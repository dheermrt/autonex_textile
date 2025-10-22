 
import cv2
from ultralytics import YOLO
import torch
import time

# Load YOLO model
model = YOLO("textile_model_worker1.engine", task='detect')
device = "cuda" if torch.cuda.is_available() else "cpu"
 
# Open video
video_path = "short.mkv"
cap = cv2.VideoCapture(video_path)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

# Counting variables
enter_count, exit_count = 0, 0
workers = {}
already_tracked = set()
counter = 0

# FPS calculation
fps = 0
frame_count = 0
start_time = time.time()
fps_update_interval = 10

while True:
    if counter % 5 == 0:
        already_tracked.clear()
    
    ret, frame = cap.read()
    if not ret:
        break
    
    frame = cv2.resize(frame, (640, 360))
    
    # Use YOLO's built-in tracking (ByteTrack by default)
    results = model.track(
        frame, 
        conf=0.7, 
        verbose=False, 
        persist=True,  # Maintain tracks across frames
        tracker="bytetrack.yaml",  # Can also use "botsort.yaml"
        half=True
    )[0]
    
    line_y = int((360 / 2) - 60)
    
    # Process tracked objects
    if results.boxes is not None and results.boxes.id is not None:
        for box, track_id in zip(results.boxes, results.boxes.id):
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = box.conf.item()
            cls = int(box.cls.item())
            track_id = int(track_id.item())
            
            # Handle workers
            if cls != 1:
                if cls not in workers:
                    workers.update({cls: 0})
                    print("New worker detected. Total workers:", len(workers))
                continue
            
            # Filter by area
            area = abs(y2 - y1) * abs(x2 - x1)
            if area < 500 or area > 12000:
                continue
            
            cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
            
            # Draw bounding box and ID
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
            cv2.putText(frame, f"ID {track_id}", (int(x1), int(y1) - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.circle(frame, (cx, cy), 4, (0, 0, 255), -1)
            
            # YOUR ORIGINAL LINE CROSSING LOGIC (unchanged)
            if cy < line_y < cy + 5:
                if cy < line_y and track_id not in already_tracked:
                    already_tracked.add(track_id)
                    exit_count += 1
                    for (id, numbers) in workers.items():
                        workers[id] += 1
                    print("ID:", id, "Count:", numbers)
                else:
                    enter_count += 1
    
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
    cv2.putText(frame, "Method: YOLO ByteTrack", (20, 120),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    cv2.imshow("YOLO Built-in Tracking", frame)
    
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