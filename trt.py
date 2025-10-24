from ultralytics import YOLO

# Load the YOLO11 model
model = YOLO("textile_model_worker1.pt")

# Export the model to TensorRT format
model.export(format="engine",device=0,half=True)  #
