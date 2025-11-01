import threading
import time
import random
from collections import deque

import cv2
from ultralytics import YOLO


class WorkerCounter:
    """
    CPU-only WorkerCounter (same logic as improved_class.py but forced to CPU).
    """

    def __init__(self,
                 model_path,
                 video_path,
                 line_offset=60,
                 cls_id_to_count=1,
                 conf_threshold=0.7,
                 half=False,
                 device=0):
        # Config
        self.MODEL_PATH = model_path
        self.VIDEO_PATH = video_path
        self.LINE_OFFSET = line_offset
        self.CLS_ID_TO_COUNT = cls_id_to_count
        self.CONF_THRESHOLD = conf_threshold
        # Force CPU-only
        self.device = "cpu"
        self.HALF = False

        # FOR NOW I AM SENDING RANDOM RCPM DATA
        self.rcpm = random.randint(0, 10)

        # I/O & resize
        self.TARGET_W, self.TARGET_H = 640, 360
        self.FPS_UPDATE_INTERVAL = 10

        # Filter tiny/huge boxes (tune to your scene)
        self.AREA_MIN, self.AREA_MAX = 500, 12000

        # Anti-double-count knobs
        self.HYSTERESIS = 8
        self.COOLDOWN_SEC = 2.0
        self.MIN_AGE = 0
        self.MIN_TRAVEL = 2
        self.MIN_VY = 10.0
        self.GATE_ENABLE = True
        self.GATE_WINDOW = 150
        self.SWITCH_SUPPRESS_T = 0.6
        self.SWITCH_SUPPRESS_R = 30

        # Model (CPU)
        self.model = YOLO(self.MODEL_PATH, task="detect")

        # Counters & per-track state
        self.exit_count = 0
        self.workers = {}  # non-counted classes
        self.track_state = {}
        self.recent_crossings = deque(maxlen=64)

        # bookkeeping
        self.rollsin = 0
        

        # FPS info
        self.fps = 0.0
        self.frame_count = 0
        self.start_time = time.time()

        # Thread-safety for external readers
        self._lock = threading.Lock()

        # Video capture
        self.cap = cv2.VideoCapture(self.VIDEO_PATH)
        if not self.cap.isOpened():
            raise IOError(f"Cannot open video source: {self.VIDEO_PATH}")
        # small buffer
        try:
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        except Exception:
            pass

    # --------------- Helpers ----------------

    def _line_sides(self, cy, line_y):
        if cy <= line_y - self.HYSTERESIS:
            return -1
        elif cy >= line_y + self.HYSTERESIS:
            return +1
        else:
            return 0

    def _update_track_state(self, tid, cx, cy, w, h, now):
        st = self.track_state.get(tid)
        if st is None:
            st = {
                "hist": deque(maxlen=12),
                "age": 0,
                "prev_side": None,
                "last_cross_time": -1e9,
                "last_gate_side": None,
                "last_seen": now,
            }
            self.track_state[tid] = st
        st["hist"].append((now, cx, cy, w, h))
        st["age"] += 1
        st["last_seen"] = now
        return st

    def _purge_old_tracks(self, now):
        drop = [tid for tid, st in self.track_state.items() if now - st["last_seen"] > 3.0]
        for tid in drop:
            self.track_state.pop(tid, None)

    def _estimate_vy(self, st):
        if len(st["hist"]) < 2:
            return 0.0
        (t0, _, cy0, _, _), (t1, _, cy1, _, _) = st["hist"][-2], st["hist"][-1]
        dt = max(1e-3, t1 - t0)
        return (cy1 - cy0) / dt

    def _vertical_travel(self, st):
        if len(st["hist"]) < 2:
            return 0.0
        _, _, cy_old, _, _ = st["hist"][0]
        _, _, cy_new, _, _ = st["hist"][-1]
        return abs(cy_new - cy_old)

    def _gate_pair_pass(self, st, side_now):
        if not self.GATE_ENABLE:
            return True
        last_side = st.get("last_gate_side")
        t_now = st["hist"][-1][0]
        if side_now == 0:
            return False
        valid = False
        if last_side is None:
            st["last_gate_side"] = side_now
        else:
            if last_side != side_now:
                t_prev = st["hist"][-2][0] if len(st["hist"]) >= 2 else t_now
                if (t_now - t_prev) <= self.GATE_WINDOW:
                    valid = True
                st["last_gate_side"] = side_now
        return valid

    def _switch_suppress(self, cx, cy, now):
        for (t, px, py) in reversed(self.recent_crossings):
            if now - t > self.SWITCH_SUPPRESS_T:
                break
            if (abs(px - cx) <= self.SWITCH_SUPPRESS_R) and (abs(py - cy) <= self.SWITCH_SUPPRESS_R):
                return True
        return False

    def _register_cross(self, cx, cy, now):
        self.recent_crossings.append((now, cx, cy))

    # --------------- Main per-frame processing ----------------

    def _process_frame(self, frame, line_y):
        now = time.time()

        results = self.model.track(
            frame,
            conf=self.CONF_THRESHOLD,
            verbose=False,
            persist=True,
            tracker="bytetrack.yaml",
            half=False,
            device="cpu",
        )[0]

        # track numbers for HUD
        try:
            self.rollsin = len(results.boxes)
        except Exception:
            self.rollsin = 0

        if results.boxes is None or results.boxes.id is None:
            self._purge_old_tracks(now)
            return self.get_status()["workers"]

        for box, track_id in zip(results.boxes, results.boxes.id):
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            cls = int(box.cls.item())
            tid = int(track_id.item())

            if cls != self.CLS_ID_TO_COUNT:
                if cls not in self.workers:
                    self.workers[cls] = 0
                continue

            area = abs(y2 - y1) * abs(x2 - x1)
            if area < self.AREA_MIN or area > self.AREA_MAX:
                continue

            cx, cy = 0.5 * (x1 + x2), 0.5 * (y1 + y2)
            w, h = (x2 - x1), (y2 - y1)

            # Draw helpers (no-op if headless)
            try:
                cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                cv2.putText(frame, f"ID {tid}", (int(x1), int(y1) - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                cv2.circle(frame, (int(cx), int(cy)), 4, (0, 0, 255), -1)
            except Exception:
                pass

            st = self._update_track_state(tid, cx, cy, w, h, now)
            if st["age"] < self.MIN_AGE:
                continue

            vy = self._estimate_vy(st)
            side_now = self._line_sides(cy, line_y)
            side_prev = st["prev_side"]
            if side_now != 0:
                st["prev_side"] = side_now

            crossed_band = (side_prev is not None) and (side_now != 0) and (side_prev != side_now)

            # direction flags
            down_checker = False
            up_checker = False
            if crossed_band:
                if side_prev == -1 and side_now == 1:
                    down_checker = True
                elif side_prev == 1 and side_now == -1:
                    up_checker = True

            gate_ok = self._gate_pair_pass(st, side_now)
            speed_ok = abs(vy) >= self.MIN_VY
            travel_ok = self._vertical_travel(st) >= self.MIN_TRAVEL
            cooldown_ok = (now - st["last_cross_time"]) >= self.COOLDOWN_SEC

            if crossed_band and gate_ok and speed_ok and travel_ok and cooldown_ok:
                if not self._switch_suppress(cx, cy, now):
                    if up_checker:
                        with self._lock:
                            self.exit_count += 1
                            st["last_cross_time"] = now
                            self._register_cross(cx, cy, now)
                            for worker in list(self.workers.keys()):
                                self.workers[worker] += 1
                    elif down_checker:
                        with self._lock:
                            self.rollsin += 1
                            st["last_cross_time"] = now
                            self._register_cross(cx, cy, now)

        self._purge_old_tracks(now)
        return self.get_status()["workers"]

    # --------------- App loop & UI ----------------

    def run(self):
        print(f"Starting tracking on {self.VIDEO_PATH} (CPU-only)")
        try:
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    break

                frame = cv2.resize(frame, (self.TARGET_W, self.TARGET_H))
                line_y = int((self.TARGET_H / 2) - self.LINE_OFFSET)

                self._process_frame(frame, line_y)

                # Draw main line and hysteresis band
                try:
                    cv2.line(frame, (0, line_y), (frame.shape[1], line_y), (255, 0, 0), 2)
                    cv2.line(frame, (0, line_y - self.HYSTERESIS), (frame.shape[1], line_y - self.HYSTERESIS), (255, 255, 0), 1)
                    cv2.line(frame, (0, line_y + self.HYSTERESIS), (frame.shape[1], line_y + self.HYSTERESIS), (255, 255, 0), 1)
                except Exception:
                    pass

                self._update_and_display_info(frame)

                try:
                    cv2.imshow("YOLO ByteTrack - Robust Line Counter", frame)
                    if cv2.waitKey(1) & 0xFF == ord("q"):
                        break
                except Exception:
                    # headless mode fallback
                    time.sleep(0.001)
        finally:
            try:
                self.cap.release()
            except Exception:
                pass
            try:
                cv2.destroyAllWindows()
            except Exception:
                pass
            self._print_final_results()

    def _update_and_display_info(self, frame):
        self.frame_count += 1
        if self.frame_count % self.FPS_UPDATE_INTERVAL == 0:
            end_time = time.time()
            self.fps = self.FPS_UPDATE_INTERVAL / (end_time - self.start_time)
            self.start_time = time.time()

        # HUD (best-effort)
        try:
            cv2.putText(frame, f"FPS: {self.fps:.1f}", (20, 90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            cv2.putText(frame, f"Exited: {self.exit_count}", (20, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
            cv2.putText(frame, f"Rolls In: {self.rollsin}", (20, 120),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
        except Exception:
            pass

    def _print_final_results(self):
        total_time = time.time() - self.start_time if self.frame_count > 0 else 0
        avg_fps = self.frame_count / total_time if total_time > 0 else 0

        print("\n" + "=" * 50)
        print("FINAL RESULTS")
        for (cid, numbers) in self.workers.items():
            print(f"Non-Counted Class ID {cid} Incremented Count: {numbers}")
        print(f"Final Counted Exited: {self.exit_count}")
        print(f"Total Frames Processed: {self.frame_count}")
        print(f"Average FPS: {avg_fps:.1f}")
        print("=" * 50)

    def get_status(self):
        """Thread-safe snapshot for external callers (e.g. test_server)."""
        with self._lock:
            return {
                "workers": dict(self.workers),
                "exit_count": int(self.exit_count),
                "rcpm": int(self.rcpm),
                "rollsin": int(self.rollsin),
            }


if __name__ == "__main__":
    try:
        MODEL_PATH = "textile_model_worker1.pt"  # use .pt on CPU, avoid .engine
        VIDEO_PATH = "short.mkv"

        counter_app = WorkerCounter(
            model_path=MODEL_PATH,
            video_path=VIDEO_PATH,
            line_offset=60,
            cls_id_to_count=1,
            conf_threshold=0.7,
            half=False
        )
        counter_app.run()

    except IOError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
