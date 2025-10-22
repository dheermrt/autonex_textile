"""
VERSION 3: Simple IoU Tracking (Fastest)
- Very fast, no feature extraction
- Best performance (~25-35 FPS with 10-20 objects)
- Works well when objects don't overlap much
- No external dependencies needed
"""
import cv2
from ultralytics import YOLO
import torch
import time

def iou(box1, box2):
    """Calculate Intersection over Union between two boxes."""
    x1_min, y1_min, x1_max, y1_max = box1
    x2_min, y2_min, x2_max, y2_max = box2
    
    # Intersection area
    inter_x_min = max(x1_min, x2_min)
    inter_y_min = max(y1_min, y2_min)
    inter_x_max = min(x1_max, x2_max)
    inter_y_max = min(y1_max, y2_max)
    
    inter_area = max(0, inter_x_max - inter_x_min) * max(0, inter_y_max - inter_y_min)
    
    # Union area
    box1_area = (x1_max - x1_min) * (y1_max - y1_min)
    box2_area = (x2_max - x2_min) * (y2_max - y2_min)
    union_area = box1_area + box2_area - inter_area
    
    return inter_area / union_area if union_area > 0 else 0

class SimpleIOUTracker:
    def __init__(self, iou_threshold=0.3, max_age=30):
        self.iou_threshold = iou_threshold
        self.max_age = max_age
        self.tracks = {}  # {track_id: {'box': [x1,y1,x2,y2], 'age': int}}
        self.next_id = 1
    
    def update(self, detections):
        """
        Update tracks with new detections.
        detections: list of [x1, y1, x2, y2, conf, cls]
        Returns: list of (track_id, [x1, y1, x2, y2])
        """
        # Age existing tracks
        for track_id in list(self.tracks.keys()):
            self.tracks[track_id]['age'] += 1   
            if self.tracks[track_id]['age'] > self.max_age:
                del self.tracks[track_id]
        
        if len(detections) == 0:
            return []
        
        # Match detections to existing tracks
        matched_tracks = []
        unmatched_detections = []
        
        for det in detections:
            det_box = det[:4]
            best_iou = 0
            best_track_id = None
            
            # Find best matching track
            for track_id, track_data in self.tracks.items():
                track_box = track_data['box']
                current_iou = iou(det_box, track_box)
                
                if current_iou > best_iou and current_iou > self.iou_threshold:
                    best_iou = current_iou
                    best_track_id = track_id
            
            if best_track_id is not None:
                # Update existing track
                self.tracks[best_track_id]['box'] = det_box
                self.tracks[best_track_id]['age'] = 0
                matched_tracks.append((best_track_id, det_box))
            else:
                # Create new track
                unmatched_detections.append(det)
        
        # Create new tracks for unmatched detections
        for det in unmatched_detections:
            det_box = det[:4]
            self.tracks[self.next_id] = {'box': det_box, 'age': 0}
            matched_tracks.append((self.next_id, det_box))
            self.next_id += 1
        
        return matched_tracks

# Load YOLO model
model = YOLO("textile_model_worker1.engine", task='detect')
device = "cuda" if torch.cuda.is_available() else "cpu"

# Initialize IoU tracker
tracker = SimpleIOUTracker(iou_threshold=0.3, max_age=30)

# Open video
video_path = "short.mkv"
cap = cv2.VideoCapture(video_path)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

# Counting variables
enter_count, exit_count = 0, 0
workers = {}
already_exited = set()
og_track_dict={}
counter = 0

# FPS calculation
fps = 0
frame_count = 0
start_time = time.time()
fps_update_interval = 10
already_tracked = set()
track_history = {}

while True:
    if counter % 1000 == 0:
        already_exited.clear()
        og_track_dict.clear()
    
    ret, frame = cap.read()
    if not ret:
        break
    
    frame = cv2.resize(frame, (640, 360))
    results = model(frame, conf=0.7, verbose=False, stream=False, half=True)[0]
    
    detections = []
    line_y = int((360 / 2) - 60)
    
    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        conf = box.conf.item()
        cls = int(box.cls.item())
        
        if cls == 1:
            detections.append([x1, y1, x2, y2, conf, cls])
        else:
            if cls not in workers:
                workers.update({cls: 0})
                print("New worker detected. Total workers:", len(workers))
    
    # Update tracker
    tracks = tracker.update(detections)
    
    for track_id, box in tracks:
        
        x1, y1, x2, y2 = box
        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
        
        area = abs(y2 - y1) * abs(x2 - x1)
        
        if area < 500 or area > 12000:
            continue
        
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
     
        
        # Draw bounding box and ID
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, f"ID {track_id}", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        cv2.circle(frame, (cx, cy), 4, (0, 0, 255), -1)
        
        # YOUR ORIGINAL LINE CROSSING LOGIC (unchanged)
        prev_count=exit_count 
        if cy < line_y < cy + 5:
            if cy < line_y and track_id not in already_exited:
                already_exited.add(track_id)
                exit_count += 1
                for (id, numbers) in workers.items():
                    workers[id] += 1
                print("ID:", id, "Count:", numbers)
            else:
                enter_count += 1
             
         
        # if cy < line_y < cy + 5:
        #     if cy > line_y:
        #         if(og_track_dict[track_id]>line_y):
        #             exit_count += 1
        #             for (id, numbers) in workers.items():
        #                 workers[id] += 1
        #             print("ID:", id, "Count:", numbers)
        #     else:
        #         enter_count += 1
        # og_track_dict[track_id]=cy
        # CROSSING_MARGIN = 5  # Margin to avoid multiple counts
        # if track_id in track_history:
        #     prev_cy= track_history[track_id]
        
        #     # Crossed downward (EXIT) - was above line, now below
        #     if prev_cy < line_y - CROSSING_MARGIN and cy > line_y + CROSSING_MARGIN:
        #         if track_id not in already_tracked:
        #             already_tracked.add(track_id)
        #             exit_count += 1
        #             for (id, numbers) in workers.items():
        #                 workers[id] += 1
        #             print(f"EXIT | Track {track_id} | Exit count: {exit_count}")
            
        #     # Crossed upward (ENTER) - was below line, now above  
        #     elif prev_cy > line_y + CROSSING_MARGIN and cy < line_y - CROSSING_MARGIN:
        #         if track_id not in already_tracked:
        #             already_tracked.add(track_id)
        #             enter_count += 1
        #             print(f"ENTER | Track {track_id} | Enter count: {enter_count}")

    
        # track_history[track_id] = cy
    
    # Draw counting line
    cv2.line(frame, (0, line_y), (frame.shape[1], line_y), (255, 0, 0), 2)
    
    # Calculate FPS
    frame_count += 1
    if frame_count % fps_update_interval == 0:
        end_time = time.time()
        fps = fps_update_interval / (end_time - start_time)
        start_time = time.time()
    
    # Display info
    cv2.putText(frame, f"FPS: {fps:.1f}", (20, 90),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(frame, f"Entered: {enter_count}", (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    cv2.putText(frame, f"Exited: {exit_count}", (20, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    # cv2.putText(frame, "Method: IoU Tracking", (20, 120),
    #             cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    cv2.imshow("Simple IoU Tracking", frame)

    counter += 1
    
    if cv2.waitKey(1) & 0xFF == ord("q"):
        cap.release()
        cv2.destroyAllWindows()
        break

# Print final results
print("\n" + "="*50)
for (id, numbers) in workers.items():
    print("ID:", id, "Count:", numbers)
print("Final Entered:", enter_count)
print("Final Exited:", exit_count)
print(f"Average FPS: {frame_count / (time.time() - start_time):.1f}")
print("="*50)