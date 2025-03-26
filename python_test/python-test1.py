import cv2
img = cv2.imread('images/IMG-20250320-WA0005.jpg', -1) #load in colour mode
img = cv2.resize(img, (0,0), fx=0.5, fy=0.5)
img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE )
cv2.imshow('Image', img)
cv2.waitKey(0)
cv2.destroyAllWindows()