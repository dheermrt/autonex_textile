import cv2
import torch
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
import numpy as np

# Load YOLO model from a .engine file (TensorRT engine)
model = YOLO("textile_model_worker1.engine")

# Check for GPU availability
device = "cuda:0" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# If the model supports a .to() call (for engine, may be internal)
# model.to(device)  # comment out if .engine version manages device internally

# Initialize DeepSORT tracker
tracker = DeepSort(max_age=30, n_init=2, nms_max_overlap=1.0)

# Open video
video_path = "short.mkv"
cap = cv2.VideoCapture(video_path)

# Counting variables
enter_count = 0
exit_count = 0

workers = {}

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Resize frame for performance
    frame = cv2.resize(frame, (640, 640))

    # Preprocess: convert BGR to RGB, ensure contiguous, make tensor if needed
    img = frame[:, :, ::-1]  # BGR -> RGB
    img = np.ascontiguousarray(img)
    
    # Use the Ultralytics API perform inference directly
    results = model(img, conf=0.7, device=device, verbose=False)[0]

    detections = []
    line_y = int((360 / 2) - 60)

    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        conf = box.conf.item()
        cls = int(box.cls.item())
        if cls == 1:
            detections.append(([x1, y1, x2 - x1, y2 - y1], conf, cls))
        else:
            if cls not in workers:
                workers[cls] = 0
                print("New worker detected. Total workers:", len(workers))

    tracks = tracker.update_tracks(detections, frame=frame)

    for track in tracks:
        if not track.is_confirmed():
            continue

        track_id = track.track_id
        ltrb = track.to_ltrb()
        x1, y1, x2, y2 = map(int, ltrb)
        area = abs((y2 - y1) * (x2 - x1))
        if area < 500 or area > 12000:
            continue
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

        # Draw bounding box and ID
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, f"ID {track_id}", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        cv2.circle(frame, (cx, cy), 4, (0, 0, 255), -1)

        # Check line crossing
        if cy < line_y < cy + 5:
            if cy < line_y:
                exit_count += 1
                for id_, cnt in workers.items():
                    workers[id_] += 1
                    print("ID:", id_, "Count:", cnt)
            else:
                enter_count += 1

    # Draw counting line
    cv2.line(frame, (0, line_y), (frame.shape[1], line_y), (255, 0, 0), 2)

    # Display counts
    cv2.putText(frame, f"Entered: {enter_count}", (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    cv2.putText(frame, f"Exited: {exit_count}", (20, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    cv2.imshow("YOLO + DeepSORT", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()

for id_, cnt in workers.items():
    print("ID:", id_, "Count:", cnt)
print("Final Entered:", enter_count)
print("Final Exited:", exit_count)
