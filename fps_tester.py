import cv2, time
from ultralytics import YOLO

model = YOLO("textile_model_worker_fast.engine", task='detect')  # FP16/INT8 engine preferred
cap = cv2.VideoCapture("short.mkv")  # replace with a GStreamer pipeline for NVDEC
frames, t0 = 0, time.time()

while True:
    ret, frame = cap.read()
    if not ret:
        break
    # No resize here; let the model do imgsz=640 square
    _ = model.track(
        frame, 
        imgsz=640,
        conf=0.7, 
        verbose=False, 
        persist=True,  # Maintain tracks across frames
        tracker="bytetrack.yaml",  # Can also use "botsort.yaml"
        half=True,
        device=0
    )[0]
    frames += 1
    elapsed_current=time.time() - t0
    print(f"{frames/elapsed_current:.1f} FPS", end='\r')

elapsed = time.time() - t0
print(f"Headless end-to-end FPS: {frames/elapsed:.1f}")
