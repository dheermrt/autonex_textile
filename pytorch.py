import torch
import torchvision
from torchvision import transforms
from torchvision.models.detection import FasterRCNN_ResNet50_FPN_Weights
from PIL import Image, ImageDraw, ImageFont
import cv2
import numpy as np

# Load a detection model (FCOS, Faster R-CNN, or YOLO)
weights = FasterRCNN_ResNet50_FPN_Weights.DEFAULT
model = torchvision.models.detection.fasterrcnn_resnet50_fpn(weights=weights)
model.eval()

# COCO class names (80 classes)
COCO_CLASSES = [
    '__background__', 'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus',
    'train', 'truck', 'boat', 'traffic light', 'fire hydrant', 'N/A', 'stop sign',
    'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
    'elephant', 'bear', 'zebra', 'giraffe', 'N/A', 'backpack', 'umbrella', 'N/A', 'N/A',
    'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'N/A', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
    'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
    'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'N/A', 'dining table',
    'N/A', 'N/A', 'toilet', 'N/A', 'tv', 'laptop', 'mouse', 'remote', 'keyboard',
    'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'N/A', 'book',
    'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
]

def detect_objects_image(image_path, confidence_threshold=0.5):
    """Detect objects in a single image file"""
    # Load image
    img = Image.open(image_path).convert('RGB')
    
    # Transform to tensor
    transform = transforms.Compose([transforms.ToTensor()])
    img_tensor = transform(img)
    
    # Run detection
    with torch.no_grad():
        predictions = model([img_tensor])[0]
    
    # Draw bounding boxes
    draw = ImageDraw.Draw(img)
    
    # Filter by confidence
    boxes = predictions['boxes'][predictions['scores'] > confidence_threshold]
    labels = predictions['labels'][predictions['scores'] > confidence_threshold]
    scores = predictions['scores'][predictions['scores'] > confidence_threshold]
    
    # Draw each detection
    for box, label, score in zip(boxes, labels, scores):
        x1, y1, x2, y2 = box.cpu().numpy()
        class_name = COCO_CLASSES[label]
        
        # Draw rectangle
        draw.rectangle([x1, y1, x2, y2], outline='red', width=3)
        
        # Draw label
        text = f'{class_name}: {score:.2f}'
        draw.text((x1, y1 - 10), text, fill='red')
    
    img.show()
    return img

def detect_objects_video(video_source=0, confidence_threshold=0.5):
    """Detect objects in video (webcam or video file)"""
    cap = cv2.VideoCapture(video_source)
    
    # Define preprocessing
    transform = transforms.Compose([transforms.ToTensor()])
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(frame_rgb)
        
        # Transform and detect
        img_tensor = transform(img_pil)
        
        with torch.no_grad():
            predictions = model([img_tensor])[0]
        
        # Filter by confidence
        boxes = predictions['boxes'][predictions['scores'] > confidence_threshold]
        labels = predictions['labels'][predictions['scores'] > confidence_threshold]
        scores = predictions['scores'][predictions['scores'] > confidence_threshold]
        
        # Draw on frame
        for box, label, score in zip(boxes, labels, scores):
            x1, y1, x2, y2 = box.cpu().numpy().astype(int)
            class_name = COCO_CLASSES[label]
            
            # Draw rectangle
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw label background
            text = f'{class_name}: {score:.2f}'
            (text_width, text_height), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
            cv2.rectangle(frame, (x1, y1 - text_height - 10), (x1 + text_width, y1), (0, 255, 0), -1)
            
            # Draw text
            cv2.putText(frame, text, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
        
        # Show frame
        cv2.imshow('Object Detection', frame)
        
        # Press 'q' to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

def detect_objects_frame(frame, confidence_threshold=0.5):
    """Detect objects in a single frame (numpy array)"""
    # Convert BGR to RGB if needed
    if len(frame.shape) == 3 and frame.shape[2] == 3:
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    else:
        frame_rgb = frame
    
    # Transform to tensor
    transform = transforms.Compose([transforms.ToTensor()])
    img_tensor = transform(frame_rgb)
    
    # Run detection
    with torch.no_grad():
        predictions = model([img_tensor])[0]
    
    # Filter by confidence
    boxes = predictions['boxes'][predictions['scores'] > confidence_threshold]
    labels = predictions['labels'][predictions['scores'] > confidence_threshold]
    scores = predictions['scores'][predictions['scores'] > confidence_threshold]
    
    # Draw on frame
    for box, label, score in zip(boxes, labels, scores):
        x1, y1, x2, y2 = box.cpu().numpy().astype(int)
        class_name = COCO_CLASSES[label]
        
        # Draw rectangle
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # Draw label
        text = f'{class_name}: {score:.2f}'
        cv2.putText(frame, text, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    return frame, predictions

# Example usage:
if __name__ == "__main__":
    # Option 1: Detect in a single image
    # detect_objects_image('your_image.jpg', confidence_threshold=0.7)
    
    # Option 2: Detect in video/webcam
    detect_objects_video("shorter.mkv", confidence_threshold=0.2)  # 0 for webcam, or path to video file
    
    # Option 3: Detect in a single frame (for custom pipelines)
    # frame = cv2.imread('your_image.jpg')
    # result_frame, predictions = detect_objects_frame(frame, confidence_threshold=0.7)
    # cv2.imshow('Result', result_frame)
    # cv2.waitKey(0)