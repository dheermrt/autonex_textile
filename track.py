import cv2
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort

# Load YOLO model (replace with your custom textile model if needed)
model = YOLO("textile_model_worker1.pt")

# Initialize DeepSORT tracker
tracker = DeepSort(max_age=30, n_init=2, nms_max_overlap=1.0)

# Open video
video_path = "short.mkv"
cap = cv2.VideoCapture(video_path)

# Counting variables
enter_count, exit_count = 0, 0

workers={}
while True:
    ret, frame = cap.read()
    if not ret:
        break
    frame=cv2.resize(frame,(640,360))
    results = model(frame, conf=0.7, verbose=False)[0]
    detections = []
    line_y = int((360/2) - 60)

    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        conf = box.conf.item()
        cls = int(box.cls.item())
        if(cls==1):
            detections.append(([x1, y1, x2-x1, y2-y1], conf, cls))
        else:
            if(cls not in workers):
                workers.update({cls:0})
                print("New worker detected. Total workers:", len(workers))

     
    tracks = tracker.update_tracks(detections, frame=frame)

    for track in tracks:
        if not track.is_confirmed():
            continue

        track_id = track.track_id
        ltrb = track.to_ltrb()
        x1, y1, x2, y2 = map(int, ltrb)
        area=abs(y2-y1)*abs(x2-x1)
        if(area<500 or area>12000):
            continue 
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

        # Draw bounding box and ID
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, f"ID {track_id}", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        cv2.circle(frame, (cx, cy), 4, (0, 0, 255), -1)

        # Check line crossing
        if cy < line_y < cy + 5:  # Adjust tolerance
            # Decide direction (up or down)
            if cy < line_y:
                exit_count += 1
                for (id,numbers) in workers.items():
                    workers[id]+=1
                    print("ID:",id,"Count:",numbers)
            else:
                enter_count += 1

    # Draw counting line+
    cv2.line(frame, (0, line_y), (frame.shape[1], line_y), (255, 0, 0), 2)

    # Display counts
    cv2.putText(frame, f"Entered: {enter_count}", (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    cv2.putText(frame, f"Exited: {exit_count}", (20, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    cv2.imshow("YOLO + DeepSORT", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        cap.release()
        cv2.destroyAllWindows()     
        break
   


for (id,numbers) in workers.items():
    print("ID:",id,"Count:",numbers)
print("Final Entered:", enter_count)
print("Final Exited:", exit_count)
