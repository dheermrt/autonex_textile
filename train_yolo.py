from ultralytics import YOLO

# Load a pretrained YOLOv11 model
model = YOLO('yolo11n.pt')  # or 'path/to/your/pretrained.pt'

# Train on your dataset
results = model.train(
    data='./textile_labelling.v1i.yolov11/data.yaml',
    epochs=50,
    imgsz=640,
    batch=16,
    lr0=0.001,
    device=0,   # or 'cpu'
    project='runs/yolo11_custom',
    name='exp1'
)
