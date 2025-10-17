import cv2
cap =cv2.VideoCapture("shorter.mkv")
counter=0
while True: 
    if not cap.isOpened():
        print("Error opening video stream or file")
        break
    
    ret, frame = cap.read()
    if not ret:
        print("End of video stream")
        break
    counter+=1 
    
    if(counter%60!=0):
        continue
    cv2.imwrite(f"dataset/frame_{counter}.jpg",frame)
cap.release()
cv2.destroyAllWindows()