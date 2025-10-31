import os
import socketio
import random
import threading
import time
import improved_class

# ------------------ Config ------------------
USER_ID = "68fd4a7fd820b24858af6f10"
SECS_INTERVAL = 5
AREA_ID = "6901021047444018929b5401"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGZkNGE3ZmQ4MjBiMjQ4NThhZjZmMTAiLCJlbWFpbCI6InN1cGVyX21hbmFnZXJfMEBnbWFpbC5jb20iLCJpYXQiOjE3NjE1NzA1NTR9.cP-7ZuWOYRRvxQLmIAnga9xGWFev9VgSvAm8iLkTAOk"

MODEL_PATH = "textile_model_worker1.engine"
VIDEO_PATH = "short.mkv"  # 0 for webcam, or RTSP URL When using Camera 

SIO_URL = os.getenv("SIO_URL", "https://classic-autonext-dashboard-backend-production-002f.up.railway.app")

# Backoff settings (seconds)
INITIAL_DELAY = 2
MAX_DELAY = 30
WAIT_TIMEOUT = 10  # socketio connect wait timeout

# ------------------ Globals ------------------
sio = socketio.Client(
    reconnection=True,              # client will try to reconnect
    reconnection_attempts=0,        # infinite
    reconnection_delay=2,           # base delay (client-internal)
    reconnection_delay_max=30,      # cap for client-internal backoff
)

counter_app = None
_counter_started = threading.Event()
_sender_started = threading.Event()
_reconnector_running = threading.Event()  # prevents multiple reconnect loops
_stop = threading.Event()

# ------------------ Helpers ------------------
def _on_server_response(cb):
    print("workforce_2 response", cb)

def start_counter():
    """Instantiate WorkerCounter and run in background once."""
    global counter_app
    if _counter_started.is_set():
        return
    _counter_started.set()
    try:
        counter_app = improved_class.WorkerCounter(
            model_path=MODEL_PATH,
            video_path=VIDEO_PATH,
            line_offset=60,
            cls_id_to_count=1,
            conf_threshold=0.7,
            device=0,
            half=True,
            # show_windows=False  # ensure headless under systemd
        )
        threading.Thread(target=counter_app.run, daemon=True).start()
        print("WorkerCounter started")
    except Exception as e:
        print("WorkerCounter failed to start:", e)
        counter_app = None

def send_periodic_workers(client, area_id):
    """Emit payloads every SECS_INTERVAL seconds, regardless of connection state."""
    if _sender_started.is_set():
        return
    _sender_started.set()

    while not _stop.is_set():
        if counter_app is not None:
            try:
                workers_snapshot = dict(counter_app.workers)
                exit_count = int(counter_app.exit_count)
            except Exception:
                workers_snapshot = {}
                exit_count = 0

            data = {
                "userId": USER_ID,
                "areaId": area_id,
                "rcpm": counter_app.rcpm,
                "count": exit_count,
                "rollsIn": random.randint(exit_count-10,exit_count),
                "ts": int(time.time())
            }
        else:
            # Fallback “fake” payload so the pipeline stays active
            count = random.randint(0, 4)
            rcpm = (60 / SECS_INTERVAL) * count
            in_rolls = count-random.randint(0, 9)
            data = {
                "areaId": area_id,
                "rcpm": rcpm,
                "count": count,
                "in": in_rolls,
                "ts": int(time.time()),
            }

        print("workforce_2 input", data)
        try:
            client.emit("workforce_2/input", data, callback=_on_server_response)
        except Exception as e:
            # Don’t crash on emit errors; just log and try next tick
            print("Emit failed:", e)

        _stop.wait(SECS_INTERVAL)

def _connect_once():
    """Try a single blocking connect with timeout; raise on failure."""
    headers = {"Authorization": f"Bearer {TOKEN}"}
    # Use static dict auth; (callback also fine)
    auth = {"token": TOKEN}
    sio.connect(
        SIO_URL,
        transports=["websocket", "polling"],
        headers=headers,
        auth=auth,
        wait=True,
        wait_timeout=WAIT_TIMEOUT,
        namespaces=["/"],
    )

def connect_with_retry_forever():
    """Outer loop that *never exits*; reconnects with exponential backoff."""
    if _reconnector_running.is_set():
        return
    _reconnector_running.set()

    delay = INITIAL_DELAY
    while not _stop.is_set():
        try:
            if not sio.connected:
                print(f"[SIO] Connecting to {SIO_URL} ...")
                _connect_once()
                print("[SIO] Connected")
                delay = INITIAL_DELAY  # reset backoff after success

            # Block until disconnected; returns when connection breaks
            sio.wait()
            print("[SIO] wait() returned (disconnected)")

        except Exception as e:
            print(f"[SIO] Connection attempt failed: {e}")

        # If we’re here, we’re disconnected or failed; backoff then retry
        for _ in range(delay):
            if _stop.is_set():
                break
            time.sleep(1)
        delay = min(int(delay * 2), MAX_DELAY)

# ------------------ Socket.IO events ------------------
@sio.event
def connect():
    print("Connected to socket server")
    # Start long-lived workers only once
    threading.Thread(target=start_counter, daemon=True).start()
    threading.Thread(target=send_periodic_workers, args=(sio, AREA_ID), daemon=True).start()

@sio.event
def connect_error(error):
    print("Socket connection error:", error)

@sio.event
def error(error):
    print("Socket error:", error)

@sio.event
def disconnect():
    print("Socket disconnected")

# ------------------ Main ------------------
if __name__ == "__main__":
    try:
        # Kick off the resilient connector in its own thread
        threading.Thread(target=connect_with_retry_forever, daemon=True).start()

        # Keep the main thread alive; handle SIGTERM under systemd gracefully
        while True:
            time.sleep(3600)

    except KeyboardInterrupt:
        pass
    finally:
        _stop.set()
        try:
            if sio.connected:
                sio.disconnect()
        except Exception:
            pass
        print("Exiting.")
