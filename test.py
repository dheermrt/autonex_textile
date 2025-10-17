from ultralytics import YOLO
import cv2

# 1. Load the trained model
# Replace 'yolov8n.pt' with the path to your custom trained model (e.g., 'path/to/best.pt')
# For a quick test, you can use a pre-trained model like 'yolov8n.pt'
model = YOLO('textile_model_worker1.pt')

# 2. Define the image source
image_path = './dataset/frame_60.jpg' 

# 3. Perform prediction (inference)
# The model() call returns a list of 'Results' objects, one for each image.
# We expect one result since we pass a single image path.
results = model(image_path)

# 4. Process and display the results
for result in results:
    # Print a summary of the predictions
    print(f"Detected {len(result.boxes)} object(s) in the image.")
    print("Bounding box details:")
    
    # Iterate through the detected bounding boxes
    for box in result.boxes:
        # box.xyxy: Bounding box coordinates in pixels [x1, y1, x2, y2]
        # box.conf: Confidence score
        # box.cls: Class index
        
        confidence = box.conf.item()
        class_id = int(box.cls.item())
        class_name = model.names[class_id]
        
        print(f"  Class: {class_name} (ID: {class_id}), Confidence: {confidence:.2f}")

    # Optional: Save the image with drawn bounding boxes
    # The 'result.path' gives the path where the annotated image is saved (usually in 'runs/detect/predict')
    result.save(filename='predicted_image.jpg')
    print("\nAnnotated image saved as 'predicted_image.jpg' in the runs/detect/predict directory.")
    
    # Optional: Display the image using OpenCV
    # img_bgr = result.plot() # Get the annotated image as a numpy array (BGR format)
    # cv2.imshow("YOLO Detection", img_bgr)
    # cv2.waitKey(0)
    # cv2.destroyAllWindows()
