from ultralytics import YOLO 


# 
import cv2 
import numpy as np 

# Load YOLO model
model = YOLO("yoloe-2.pt")

# Open video
video_path = "short.mkv"
cap = cv2.VideoCapture(video_path)

# Line position (horizontal line in the middle of the frame)
print(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
line_y = int((cap.get(cv2.CAP_PROP_FRAME_HEIGHT) // 2) -200)
table_y=int((cap.get(cv2.CAP_PROP_FRAME_HEIGHT) //2)-100)
exit_count=0 
objects =[]
 

while True:
    ret, frame = cap.read()
    if not ret:
        print("End of video stream")
        break

    gray_image = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray_image = cv2.equalizeHist(gray_image)
    gray_image = cv2.GaussianBlur(gray_image, (5, 5), 0)
    gray_image = cv2.Canny(gray_image, 50, 150)
    # Find contours
    contours, _ = cv2.findContours(gray_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    circle_count=0 
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area<50:   # ignore small noise
            continue
        
        perimeter = cv2.arcLength(cnt, True)
        if perimeter == 0:
            continue

        # Circularity = 4π * Area / Perimeter²
        circularity = 4 * np.pi * (area / (perimeter * perimeter))

        if 0.7 < circularity < 1.2: 
            circle_count += 1
            (x, y), radius = cv2.minEnclosingCircle(cnt)
            center = (int(x), int(y))

            # Draw circle outline
            cv2.circle(frame, center, int(radius), (0, 255, 0), 2)
            
            # Draw center poiant
            cv2.circle(frame, center, 3, (0, 0, 255), -1)

            # Put text with coordinates
            cv2.putText(frame, f"({int(x)}, {int(y)})", (int(x)+10, int(y)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)
    if(len(objects)<2):
        objects.append(circle_count)
    elif(len(objects)==2):
        objects[0]=objects[1]
        objects[1]=circle_count
        exit_count=objects[1]-objects[0]
    print(exit_count)
    cv2.line(gray_image, (0,table_y),(1280,table_y),255, thickness=2)
    cv2.line(gray_image,(0,line_y),(1280,line_y),255,thickness=2)

    cv2.imshow("Video Feed",frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()

print("Final Entered:", entered_count)
print("Final Exited:", exited_count)
