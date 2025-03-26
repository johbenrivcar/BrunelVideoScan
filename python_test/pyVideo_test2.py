import cv2
import math
import Brunel
import settings
from datetime import datetime
#
#  Generating the movements file from the input:
#     Whenever there are movement boxes, we want to generate output to the report video which
#       indicates which file the movement is found in, and at what point in the file it was found
#       (mins and secs from the beginning of the file)
#     We want to precede the point at which the movement is reported with a 3-sec showing of
#       an information panel that gives the location details of the movment that was found
#     
#
#

print( "\n ##################################################### Started at", datetime.now().strftime("%H:%M") )
COLOURS = Brunel.Colours()

print ( "Red and green: ", COLOURS.mix(COLOURS.red, COLOURS.green) )



#videoSourceFileName = "images/videoplayback.mp4"
videoSourceFileName = "images/rabbit.mp4"

#videoSourceFileName = "G:/My Drive/Chorus/Brunel/VideoProcessing/Incoming/20250302 Great Brockeridge Tree Survey/20250321_045556F.ts"
videoOutputFileName = videoSourceFileName + ".scanned.mp4"

videoInfo = Brunel.VideoReader(videoSourceFileName)

frameScaleFactor = 1 #0.5 # Half the size output video compared to input video
if videoInfo.frameWidth > 1080:
    frameScaleFactor = 1080.0 / videoInfo.frameWidth

print("frameScaleFactor is set to", frameScaleFactor)

countdown = 1
while countdown > -1:
    print ( "\r", countdown , "   ", end="" )
    key = cv2.waitKey(1000)
    countdown -= 1 
    #if key == ord('q'):
    #    exit(0)
print("")




video = videoInfo.video
videoOut = None 


frameDelay = 1 #videoInfo.mspf


#bgImg = cv2.imread("images/rabbit_BG.png")
#bgImg = cv2.cvtColor(bgImg, cv2.COLOR_BGR2GRAY)
#bgImg = cv2.GaussianBlur(bgImg, (21, 21), 0)

firstTime = True
bgImg = None

snapTo = 20
shiftLimit = 100

# Rectangle, size, anchor point
element = cv2.getStructuringElement(0, (11, 11), (5, 5))


print("Countour detection.....");
#print("");
maxContours = 0
frameNumber = 0
prevBoxes = []
print("Start of video +++++++++++++++++++++++++++++++++")
while True:
    status, frame = video.read()
    
    if not status :
        print("End of video +++++++++++++++++++++++++++++++++ Frame number:", frameNumber)
        break
        
    frameNumber += 1

    frame = cv2.resize(frame, (0,0), fx=frameScaleFactor, fy=frameScaleFactor)

    if firstTime: # Open the output video with scaled frame size 
        print("Frame shape from first frame:", frame.shape)
        fheight, fwidth, fchannels = frame.shape

        videoOutfo = Brunel.VideoWriterMP4(videoOutputFileName, videoInfo.fps, ( fwidth, fheight ) ) #videoInfo.frameSize )
        videoOut = videoOutfo.video
        
    monochromeFrame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    monochromeFrame = cv2.GaussianBlur(monochromeFrame, (21, 21), 0)

    # If this is the first time, then use the first frame as the background for comparison.
    if firstTime:
        prevImg = monochromeFrame

    # Get the background image as the previous image that was read
    bgImg = prevImg

    # Get the absolute difference image between the background image and the frame read from the video
    diff = cv2.absdiff(bgImg, monochromeFrame)

    ret, thresh = cv2.threshold( diff, 10, 255, cv2.THRESH_BINARY )
    thresh = cv2.dilate( thresh, element )

    # Get the contours found in the threshold image
    contourList, res = cv2.findContours( thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE )
    if len(contourList) > maxContours:
        maxContours = len(contourList)

    print( "\rFrame:", frameNumber, "Countours:", len(contourList), " Max:", maxContours, "           ", end="\r" )

    # Process the contours 
    boxes = []
    if True: #len(contourList)<50: # Only show rectangles if there are fewer than 50 on the frame
        
        for contour in contourList:
            # get the bounding rectangle of the contour
            (x, y, w, h) = cv2.boundingRect(contour)           

            t = y#(y-snapTo) 
            l = x#(x-snapTo) 
            b = y+h+snapTo
            r = x+w+snapTo
            
            adjt = t - t % snapTo
            adjl = l - l % snapTo
            adjb = b - x % snapTo
            adjr = r - x % snapTo
            box = Brunel.Box(adjl, adjt, adjr, adjb)
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
            box.drawInFrame(frame)
            #cv2.rectangle( frame, (box.l,box.t), (box.r, box.b), (0, 255, 0), 3 )

    #if frameNumber == 150:
        #print( "Boxes", boxes, "                            " )
        #print( "PrevBoxes", prevBoxes, "                            " )
        #print( "" )

    prevBoxes = boxes

    cv2.imshow("Scaneed", frame)
    videoOut.write( frame )
    #cv2.imshow("Diff video", diff)
    #cv2.imshow("Threshold", thresh )

    prevImg = monochromeFrame


    key = cv2.waitKey(frameDelay)
    if key == ord('q'):
        break


    # reset the firstTime flag
    firstTime = False

print( "\n ##################################################### Finished at", datetime.now().strftime("%H:%M") )
#video.release()
#videoOut.release()
cv2.waitKey(0)
cv2.destroyAllWindows()
