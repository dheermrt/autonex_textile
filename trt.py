from ultralytics import YOLO

# Load the YOLO11 model
model = YOLO("textile_model.pt")

# Export the model to TensorRT format
model.export(format="engine")  #
