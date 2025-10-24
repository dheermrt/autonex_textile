import cv2
from ultralytics import YOLO
import torch
import time

class WorkerCounter:
    """
    A class to perform object detection, tracking, and line-crossing counting
    on a video stream using a YOLOv8-TensorRT engine and ByteTrack.
    """
    
    def __init__(self, model_path, video_path, line_offset=60, cls_id_to_count=1, conf_threshold=0.7, half=True, device=0):
        """
        Initializes the WorkerCounter.

        Args:
            model_path (str): Path to the TensorRT model engine file (e.g., 'textile_model_worker1.engine').
            video_path (str): Path to the input video file (e.g., 'short.mkv').
            line_offset (int): Vertical offset from the center of the video to draw the counting line (in pixels).
            cls_id_to_count (int): The class ID of the object to be counted (e.g., 1 for 'worker').
            conf_threshold (float): Confidence threshold for detection.
            half (bool): Use half-precision (FP16) for inference if supported by the device.
            device (int): CUDA device index (0 for the first GPU).
        """
        # Configuration
        self.MODEL_PATH = model_path
        self.VIDEO_PATH = video_path
        self.LINE_OFFSET = line_offset
        self.CLS_ID_TO_COUNT = cls_id_to_count
        self.CONF_THRESHOLD = conf_threshold
        self.HALF = half
        self.DEVICE = device
        self.TARGET_W, self.TARGET_H = 640, 360  # Target frame size
        self.FPS_UPDATE_INTERVAL = 10
        self.AREA_MIN, self.AREA_MAX = 500, 12000

        # YOLO/TensorRT Setup
        self.device = f"cuda:{device}" if torch.cuda.is_available() and device >= 0 else "cpu"
        self.model = YOLO(self.MODEL_PATH, task='detect')

        # Counting & Tracking State
        self.exit_count = 0
        self.workers = {}  # Tracks other classes if needed (original logic retained)
        self.already_tracked = set() # Stores IDs that have crossed the line in the current clear cycle
        self.counter = 0

        # FPS calculation
        self.fps = 0
        self.frame_count = 0
        self.start_time = time.time()
        
        # Video Capture Setup
        self.cap = cv2.VideoCapture(self.VIDEO_PATH)
        if not self.cap.isOpened():
            raise IOError(f"Cannot open video file: {self.VIDEO_PATH}")
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    def _process_frame(self, frame, line_y):
        """Processes a single frame for detection, tracking, and counting."""
        
        # 1. Tracking
        results = self.model.track(
            frame, 
            conf=self.CONF_THRESHOLD, 
            verbose=False, 
            persist=True,
            tracker="bytetrack.yaml",
            half=self.HALF,
            device=self.DEVICE
        )[0]
        
        # 2. Object Processing and Counting
        if results.boxes is not None and results.boxes.id is not None:
            for box, track_id in zip(results.boxes, results.boxes.id):
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                cls = int(box.cls.item())
                track_id = int(track_id.item())
                
                # Original logic for tracking non-counting classes (cls != 1)
                if cls != self.CLS_ID_TO_COUNT:
                    if cls not in self.workers:
                        self.workers.update({cls: 0})
                        print(f"New worker class {cls} detected. Total classes tracked:", len(self.workers))
                    continue
                
                # Filter by area
                area = abs(y2 - y1) * abs(x2 - x1)
                if area < self.AREA_MIN or area > self.AREA_MAX:
                    continue
                
                cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
                
                # Draw bounding box and ID
                cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                cv2.putText(frame, f"ID {track_id}", (int(x1), int(y1) - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                cv2.circle(frame, (cx, cy), 4, (0, 0, 255), -1)
                
              
                if (line_y - 5 < cy < line_y + 5) and (track_id not in self.already_tracked):
                    self.exit_count +=1
                    self.already_tracked.add(track_id)
                    print(f"ID {track_id} exited. Total Exited: {self.exit_count}")
                    # Assuming movement from bottom (cy > line_y) to top (cy < line_y) is 'Exit'
                    # if cy < line_y and track_id not in self.already_tracked:
                    #     self.already_tracked.add(track_id)
                    #     self.exit_count += 1
                    #     # The original script added counts to ALL workers.items() here,
                    #     # which might be a placeholder for a different logic. Retaining it for fidelity:
                    for cls_id in self.workers.keys():
                        self.workers[cls_id] += 1
                    #     print(f"ID {track_id} exited. Total Exited: {self.exit_count}")

                    # Assuming movement from top (cy < line_y) to bottom (cy > line_y) is 'Enter'
                    # elif cy > line_y and track_id not in self.already_tracked:
                    #      self.already_tracked.add(track_id)
                    #      self.enter_count += 1
                    #      print(f"ID {track_id} entered. Total Entered: {self.enter_count}")
        return self.workers

    def run(self):
        """Starts the main video processing loop."""
        
        print(f"Starting tracking on {self.VIDEO_PATH} with device: {self.device}")
        
        try:
            while True:
                # Clear tracked set periodically to allow objects to be counted again
                if self.counter % 5 == 0:
                    self.already_tracked.clear()
                
                ret, frame = self.cap.read()
                if not ret:
                    break
                
                # 1. Pre-process frame
                frame = cv2.resize(frame, (self.TARGET_W, self.TARGET_H))
                line_y = int((self.TARGET_H / 2) - self.LINE_OFFSET)
                
                # 2. Process frame for tracking and counting
                self._process_frame(frame, line_y)
                
                # 3. Draw display elements
                cv2.line(frame, (0, line_y), (frame.shape[1], line_y), (255, 0, 0), 2)
                self._update_and_display_info(frame)
                
                cv2.imshow("YOLO Built-in Tracking", frame)
                
                self.counter += 1
                
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
                    
        finally:
            self.cap.release()
            cv2.destroyAllWindows()
            self._print_final_results()

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
        # cv2.putText(frame, f"Entered: {self.enter_count}", (20, 30),
        #             cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        cv2.putText(frame, f"Exited: {self.exit_count}", (20, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    def _print_final_results(self):
        """Prints the final statistics."""
        total_time = time.time() - self.start_time if self.frame_count > 0 else 0
        avg_fps = self.frame_count / total_time if total_time > 0 else 0
        
        print("\n" + "="*50)
        print("FINAL RESULTS")
        print("="*50)
        for (id, numbers) in self.workers.items():
            print(f"Non-Counted Class ID {id} Incremented Count: {numbers}")
        # print(f"Final Counted Entered: {self.enter_count}")
        print(f"Final Counted Exited: {self.exit_count}")
        print(f"Total Frames Processed: {self.frame_count}")
        print(f"Average FPS: {avg_fps:.1f}")
        print("="*50)
 
if __name__ == "__main__":
    try:
 
        MODEL_PATH = "textile_model_worker1.engine"
        VIDEO_PATH = "short.mkv"
        # 
        # Initialize the counter object
        counter_app = WorkerCounter(
            model_path=MODEL_PATH,
            video_path=VIDEO_PATH,
            line_offset=60,     
            cls_id_to_count=1,    
            conf_threshold=0.7,
            device=0          
        )
        
        # Run the main processing loop
        counter_app.run()
        
    except IOError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")