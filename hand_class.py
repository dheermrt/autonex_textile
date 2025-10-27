from collections import defaultdict, deque
import numpy as np
import torch 
from ultralytics import YOLO
from yoloer import YOLOER
import time 
import cv2

class WorkerCounter:
    # ... your existing __init__ ...
    def __init__(self,model_path,video_path,conf_threshold=0.6,cls_id_to_count=1,device=0,half=True):
        self.CONF_THRESHOLD = conf_threshold    
        self.track_history = defaultdict(lambda: deque(maxlen=8))  # (t, cx, cy, w, h)
        self.pickups = 0
        self.picked_ids = set()
        self.MODEL_PATH=model_path
        self.FPS_UPDATE_INTERVAL = 10
        self.HALF=half
        self.counter=0 
        self.TARGET_W, self.TARGET_H = 640, 360 
        self.VIDEO_PATH=video_path
        self.frame_count=0
        # thresholds (tune for your video scale/FPS)
        self.IoU_THRESH = 0.20
        self.V_UP_THRESH = 60.0      # px/s upward (negative vy)
        self.LIFT_PIXELS = 12        # min upward delta of bottom y
        self.CONSEC_FRAMES = 3
        self.OCC_FRAC = 0.15         # 15% area shrink
        model=YOLO(self.MODEL_PATH,task="detect")
        self.fps=0 
        self.frame_count=0
        self.start_time=time.time()
        self.CLS_ID_TO_COUNT = cls_id_to_count
        self.DEVICE = f"cuda:{device}" if torch.cuda.is_available() and device >= 0 else "cpu"
        self.model = model
        self.AREA_MIN, self.AREA_MAX = 100, 12000
                
        # Video Capture Setup
        self.cap = cv2.VideoCapture(self.VIDEO_PATH)
        if not self.cap.isOpened():
            raise IOError(f"Cannot open video file: {self.VIDEO_PATH}")
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)


    # ---------- OPTIONAL: plug your hand detector here ----------
    def _detect_hands(self, frame):
        """
        Return list of hand boxes as [x1,y1,x2,y2]. 
        Replace with MediaPipe/YOLO-hand/etc.
        """
        yolo_model = YOLOER("cross-hands-yolov4-tiny.cfg", "cross-hands-yolov4-tiny.weights", ["hand"])
        width, height, inference_time, results = yolo_model.inference(frame)
        hand_count= len(results)
        hand_boxes = []
        for detection in results[:hand_count]:
            id, name, confidence, x, y, w, h = detection
            hand_boxes.append([x, y, x + w, y + h])
            cx = x + (w / 2)
            cy = y + (h / 2)

            # draw a bounding box rectangle and label on the image
            color = (0, 255, 255)
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            text = "%s (%s)" % (name, round(confidence, 2))
            cv2.putText(frame, text, (x, y - 5), cv2.FONT_HERSHEY_SIMPLEX,
                        0.5, color, 2)
        return hand_boxes 

    @staticmethod
    def _iou(a, b):
        ax1, ay1, ax2, ay2 = a
        bx1, by1, bx2, by2 = b
        inter_x1, inter_y1 = max(ax1, bx1), max(ay1, by1)
        inter_x2, inter_y2 = min(ax2, bx2), min(ay2, by2)
        iw, ih = max(0, inter_x2 - inter_x1), max(0, inter_y2 - inter_y1)
        inter = iw * ih
        a_area = max(0, (ax2 - ax1)) * max(0, (ay2 - ay1))
        b_area = max(0, (bx2 - bx1)) * max(0, (by2 - by1))
        union = a_area + b_area - inter + 1e-6
        return inter / union

    def _update_track_history(self, track_id, x1, y1, x2, y2, now_s):
        cx, cy = 0.5*(x1+x2), 0.5*(y1+y2)
        w, h = (x2-x1), (y2-y1)
        self.track_history[track_id].append((now_s, cx, cy, w, h))

    def _estimate_vel(self, track_id):
        hist = self.track_history[track_id]
        if len(hist) < 2:
            return 0.0, 0.0
        (t0, cx0, cy0, _, _), (t1, cx1, cy1, _, _) = hist[-2], hist[-1]
        dt = max(1e-3, t1 - t0)
        vx = (cx1 - cx0) / dt
        vy = (cy1 - cy0) / dt
        return vx, vy

    def _area(self, box):
        x1,y1,x2,y2 = box
        return max(0, x2-x1) * max(0, y2-y1)

    def _consecutive_contact(self, track_id, obj_box, recent_hands):
        """
        Return True if IoU(obj, any hand) exceeds IoU_THRESH for >= CONSEC_FRAMES frames.
        Maintain a short deque of bools per track.
        """
        key = f"contact_{track_id}"
        if not hasattr(self, "_contact_buf"):
            self._contact_buf = defaultdict(lambda: deque(maxlen=self.CONSEC_FRAMES))
        # check IoU with any recent hand box
        touch = any(self._iou(obj_box, hb) >= self.IoU_THRESH for hb in recent_hands)
        self._contact_buf[key].append(touch)
        return len(self._contact_buf[key]) == self.CONSEC_FRAMES and all(self._contact_buf[key])

    def _lifted(self, track_id):
        """
        Check bottom-y lifted by >= LIFT_PIXELS over last window.
        """
        hist = self.track_history[track_id]
        if len(hist) < self.CONSEC_FRAMES:
            return False
        # compare oldest vs newest
        _, _, cy_old, _, h_old = hist[-self.CONSEC_FRAMES]
        _, _, cy_new, _, h_new = hist[-1]
        by_old = cy_old + 0.5*h_old
        by_new = cy_new + 0.5*h_new
        return (by_old - by_new) >= self.LIFT_PIXELS  # moved up

    def _occluded(self, prev_area, curr_area):
        if prev_area <= 0:
            return False
        return (prev_area - curr_area) / prev_area >= self.OCC_FRAC

    # -------- modify your _process_frame to call the above --------
    def _process_frame(self, frame):
        now_s = time.time()
        # frame=cv2.resize(frame,(self.TARGET_W,self.TARGET_H))
        #Frame is already resized in run()
        hand_boxes = self._detect_hands(frame)  # fill this

        results = self.model.track(
            frame,
            conf=self.CONF_THRESHOLD,
            verbose=False,
            persist=True,
            tracker="bytetrack.yaml",
            half=self.HALF,
            device=self.DEVICE
        )[0]

        if results.boxes is not None and results.boxes.id is not None:
            for box, track_id in zip(results.boxes, results.boxes.id):
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                cls = int(box.cls.item())
                track_id = int(track_id.item())

                # only your object class
                    # if cls != self.CLS_ID_TO_COUNT:
                    #     if cls not in self.workers:
                    #         self.workers[cls] = 0
                    #     continue

                # filter by area
                area = abs(y2 - y1) * abs(x2 - x1)
                if area < self.AREA_MIN or area > self.AREA_MAX:
                    continue

                obj_box = [x1,y1,x2,y2]
                self._update_track_history(track_id, x1,y1,x2,y2, now_s)
                vx, vy = self._estimate_vel(track_id)

                # --- PICKUP RULE ---
                # 1) sustained contact with any hand
                contact_ok = self._consecutive_contact(track_id, obj_box, hand_boxes)
                # 2) lifting motion & speed upwards
                lift_ok = (vy < -self.V_UP_THRESH) and self._lifted(track_id)
                # 3) optional occlusion cue (compare last two areas)
                occl_ok = False
                # if len(self.track_history[track_id]) >= 2:
                #     # approximate areas
                #     _, _, _, w0, h0 = self.track_history[track_id][-2]
                #     _, _, _, w1, h1 = self.track_history[track_id][-1]
                #     occl_ok = self._occluded(w0*h0, w1*h1)

                """
                The code above is currently bypassed to make occlusion optional."""


                if contact_ok and lift_ok: 
                    cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                    cv2.putText(frame, f"ID {track_id}", (int(x1), int(y1) - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                    #The above code is being used to put bounding box
                    if track_id not in self.picked_ids:
                        self.picked_ids.add(track_id)
                        self.pickups += 1
                        print(f"[PICKUP] Track {track_id} picked up. Total pickups: {self.pickups}")

                # your existing line-cross logic
                # cx, cy = int((x1+x2)/2), int((y1+y2)/2)
                # if (line_y - 5 < cy < line_y + 5) and (track_id not in self.already_tracked):
                #     self.exit_count += 1
                #     self.already_tracked.add(track_id)
                #     for cls_id in self.workers.keys():
                #         self.workers[cls_id] += 1

        return self.pickups
    def _update_and_display_info(self, frame):
        """Calculates FPS and draws text overlays on the frame."""
        
        # Calculate FPS
        self.frame_count += 1
        if self.frame_count % self.FPS_UPDATE_INTERVAL == 0:
            end_time = time.time()
            self.fps = self.FPS_UPDATE_INTERVAL / (end_time - self.start_time)
            self.start_time = time.time()
        
        # Display info
        cv2.putText(frame, f"FPS: {self.fps:.1f}", (20, 90),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        # # cv2.putText(frame, f"Entered: {self.enter_count}", (20, 30),
        # #             cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        cv2.putText(frame, f"Picked Up: {self.pickups}", (20, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    def _print_final_results(self):
        print(self.pickups)
    def run(self):
        print(f"Starting tracking on {self.VIDEO_PATH} with device: {self.DEVICE}")
        
        try:
            while True:
                # Clear tracked set periodically to allow objects to be counted again
                # if self.counter % 5 == 0:
                #     self.already_tracked.clear()
                
                ret, frame = self.cap.read()
                if not ret:
                    break
                
                # 1. Pre-process frame
                frame = cv2.resize(frame, (self.TARGET_W, self.TARGET_H))
                # line_y = int((self.TARGET_H / 2) - self.LINE_OFFSET) 
                
                # 2. Process frame for tracking and counting
                self._process_frame(frame)
                
      
                self._update_and_display_info(frame)
                
                cv2.imshow("YOLO Built-in Tracking", frame)
                
                self.counter += 1
                
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
                    
        finally:
            self.cap.release()
            cv2.destroyAllWindows()
            self._print_final_results()

if __name__ == "__main__":
    model_path="textile_model_worker1.engine"  # replace with your model path
    video_path="short.mkv"  # replace with your video path
    counter = WorkerCounter(model_path,video_path,conf_threshold=0.6,cls_id_to_count=1)
    counter.run()
