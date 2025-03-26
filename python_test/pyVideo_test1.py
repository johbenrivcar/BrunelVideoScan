import cv2
import math


class Box:
    def __init__(self, l, t, r, b):
        self.l = l 
        self.t = t 
        self.r = r 
        self.b = b
    def report(self):
        return "Box{ t:" + str(self.t) +",l:" + str(self.l) +",b:" + str(self.b) +",r:" + str(self.r) + "}"

#bgImg = cv2.imread("images/rabbit_BG.png")
#bgImg = cv2.cvtColor(bgImg, cv2.COLOR_BGR2GRAY)
#bgImg = cv2.GaussianBlur(bgImg, (21, 21), 0)

firstTime = True
bgImg = None

snapTo = 50
shiftLimit = 100

# Rectangle, size, anchor point
element = cv2.getStructuringElement(0, (11, 11), (5, 5))

video = cv2.VideoCapture("images/rabbit.mp4")


print("Countour detection.....");
#print("");
maxContours = 0
frameNumber = 0
prevBoxes = []
while True:
    status, frame = video.read()
    
    if not status :
        break
        
    frameNumber += 1

    # frame = cv2.resize(frame, (0,0), fx=0.25, fy=0.25)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (21, 21), 0)

    # If this is the first time, then use the first frame as the background for comparison.
    if firstTime:
        prevImg = gray

    # Get the background image as the previous image that was read
    bgImg = prevImg

    # Get the absolute difference image between the background image and the frame read from the video
    diff = cv2.absdiff(bgImg, gray)

    ret, thresh = cv2.threshold( diff, 15, 255, cv2.THRESH_BINARY )
    #thresh = cv2.dilate( thresh, element )

    # Get the contours found in the threshold image
    cnts, res = cv2.findContours( thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE )
    if len(cnts) > maxContours:
        maxContours = len(cnts)

    print( "\rFrame:", frameNumber, "Countours:", len(cnts), " Max:", maxContours, "           ", end="\r" )

    # Process the contours 
    boxes = []
    if True: #len(cnts)<50: # Only show rectangles if there are fewer than 50 on the frame
        
        for cntr in cnts:
            # get the bounding rectangle of the contour
            (x, y, w, h) = cv2.boundingRect(cntr)           

            t = (y-snapTo) 
            l = (x-snapTo) 
            b = y+h+snapTo
            r = x+w+snapTo
            
            adjt = t - t % snapTo
            adjl = l - l % snapTo
            adjb = b - x % snapTo
            adjr = r - x % snapTo
            box = Box(l, t, r, b)
            boxes.append( box )

    # Check for sudden increase in number of boxes, ignore the frame
    if len(boxes) - len(prevBoxes) > 15:
        boxes = prevBoxes

    else:
        # Find nearest box to each previous box in the current frame
        for box in boxes:
            nearestBox = None
            nearestShift = 10000000
            for pbox in prevBoxes:
                #print("Shift calc:", pbox.report(), box.report() )
                xt = (pbox.t-box.t) 
                xl = (pbox.l-box.l)
                xb = (pbox.b-box.b)
                xr = (pbox.r-box.r)
                xtl = math.sqrt(xt**2 + xl**2 )
                xbr = math.sqrt(xb**2 + xr**2 )
                boxshift = xtl + xbr

                if boxshift < 20  and boxshift < nearestShift:
                    #print("pbox, box:", pbox.report(), box.report() )
                    #print( "SHIFT(t,l,b,r):(", xt, xl, xb, xr, ")")
                    #print( "ROOT SQUARES( tl, br ):(", xtl, xbr, "}")
                    #print("boxshift:", boxshift)
                    nearestBox = pbox
                    nearestShift = boxshift

            if  nearestShift < shiftLimit :
                #print("\rBox shift", nearestShift, box.report(), "<<", nearestBox.report(), "                            ")
                #print("")
                box.t = nearestBox.t
                box.l = nearestBox.l
                box.b = nearestBox.b
                box.r = nearestBox.r

    if True: # TODO test for number of boxes in the frame
        for box in boxes:

            cv2.rectangle( frame, (box.l,box.t), (box.r, box.b), (0, 255, 0), 3 )


    #if frameNumber == 150:
        #print( "Boxes", boxes, "                            " )
        #print( "PrevBoxes", prevBoxes, "                            " )
        #print( "" )

    prevBoxes = boxes

    cv2.imshow("Original", frame)
    #cv2.imshow("Diff video", diff)
    cv2.imshow("Threshold", thresh )

    prevImg = gray

    key = cv2.waitKey(30)
    if key == ord('q'):
        break
    # reset the firstTime flag
    firstTime = False

print( "\n" )
video.release()
cv2.destroyAllWindows()
