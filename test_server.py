import socketio
import random
import threading
import time
import improved_class
# Constants
USER_ID = "68fd4a7fd820b24858af6f10"
SECS_INTERVAL = 5
AREA_ID = "6901021047444018929b5401"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGZkNGE3ZmQ4MjBiMjQ4NThhZjZmMTAiLCJlbWFpbCI6InN1cGVyX21hbmFnZXJfMEBnbWFpbC5jb20iLCJpYXQiOjE3NjE1NzA1NTR9.cP-7ZuWOYRRvxQLmIAnga9xGWFev9VgSvAm8iLkTAOk"
# Path/config for WorkerCounter (adjust to your environment)
MODEL_PATH = "textile_model_worker1.engine"
VIDEO_PATH = "short.mkv"

# Create Socket.IO client
sio = socketio.Client()
counter_app = None  # will hold WorkerCounter instance

def _on_server_response(cb):
    print("workforce_2 response", cb)

def start_counter():
    """Instantiate WorkerCounter and run it in a background thread."""
    global counter_app
    try:
        counter_app = improved_class.WorkerCounter(
            model_path=MODEL_PATH,
            video_path=VIDEO_PATH,
            line_offset=60,
            cls_id_to_count=1,
            conf_threshold=0.7,
            device=0,
            half=True
        )
        threading.Thread(target=counter_app.run, daemon=True).start()
        print("WorkerCounter started")
    except Exception as e:
        print("WorkerCounter failed to start:", e)
        counter_app = None

def send_periodic_workers(client, area_id):
    """Periodic sender: emits current worker counts taken from counter_app if available."""
    while True:
        if counter_app is not None:
            print(f"I AM EMITTING TRUE DATA FROM THE WORKER COUNTER")
            print(f"LESSGOOO:)")
            # snapshot to avoid concurrent mutation issues
            try:
                workers_snapshot = dict(counter_app.workers)
                exit_count = int(counter_app.exit_count)
            except Exception:
                workers_snapshot = {}
                exit_count = 0
            data = {
                "userId": USER_ID,
                "areaId": area_id,
                # "workers": workers_snapshot,
                "rcpm": counter_app.rcpm,
                "count": exit_count,
                "rollsIn": random.randint(exit_count-10,exit_count),
                "ts": int(time.time())
            }
        else:
            print(f"I AM EMITTING FALSE DATA THERE IS SOME ERROR")
            # fallback — keep previous random behaviour if counter isn't available
            count = random.randint(0, 4)
            rcpm = (60 / SECS_INTERVAL) * count
            in_rolls = count + random.randint(0, 9)
            data = {
                "userId": USER_ID,
                "areaId": area_id,
                "rcpm": rcpm,
                "count": count,
                "in": in_rolls,
                "ts": int(time.time())
            }

        print("workforce_2 input", data)
        try:
            client.emit("workforce_2/input", data, callback=_on_server_response)
        except Exception as e:
            print("Emit failed:", e)

        time.sleep(SECS_INTERVAL)

# Socket event handlers
@sio.event
def connect():
    print("Connected to socket server")
    # start WorkerCounter and the periodic sender
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

def auth_handler(auth):
    """Authentication callback for Socket.IO connection"""
    return {"token": TOKEN}

# Connect to server
try:
    sio.connect(
        "https://classic-autonext-dashboard-backend-production-002f.up.railway.app",
        transports=["websocket", "polling"],
        headers={"Authorization": f"Bearer {TOKEN}"},
        auth={"token": TOKEN},  # Changed from static dict to callback function
        wait_timeout=5
    )
except Exception as e:
    print("Connection failed:", e)

# Check if connected after 5 seconds (similar to setTimeout)
time.sleep(5)
if not sio.connected:
    print("Socket not connected")

# Keep program running
sio.wait()
