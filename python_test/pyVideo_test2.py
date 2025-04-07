import cv2
import math
import brunel_ecotrac_classesA
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

# GET SETTINGS ######################################################
getSetting = settings.getSetting
# ==== FOLDER settings
incomingFolder = getSetting("folders.incoming")
print("Incoming folder is: ", incomingFolder )

# ==== Scanning settings
snapTo = settings.getSetting("scanning.snapTo")
skipAfter = settings.getSetting("scanning.skipAfter")
shiftLimit = settings.getSetting("scanning.shiftLimit")
#
# ****************

print( "\n ##################################################### Started at", datetime.now().strftime("%H:%M") )
COLOURS = brunel_ecotrac_classesA.Colours()

print ( "Red and green: ", COLOURS.mix(COLOURS.red, COLOURS.green) )

videoSourceFileName = incomingFolder #"images/videoplayback.mp4"

#videoSourceFileName = "images/rabbit.mp4"

#videoSourceFileName = "G:/My Drive/Chorus/Brunel/VideoProcessing/Incoming/20250302 Great Brockeridge Tree Survey/20250321_045556F.ts"
videoOutputFileName = videoSourceFileName + ".scanned.mp4"

videoInfo = brunel_ecotrac_classesA.VideoReader(videoSourceFileName)

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

isFirstFrame = True
bgImg = None



# Rectangle, size, anchor point
element = cv2.getStructuringElement(0, (11, 11), (5, 5))


print("Countour detection.....");
#print("");
maxContours = 0
frameNumber = 0
outputFrameCount = 0
prevBoxes = []
# Flags to indicate the video is skipping if no movement is found
skipping = True
skipCountDown = 0
skipCountUp = 0
skip1 = False

print("Start of video +++++++++++++++++++++++++++++++++")
while True:
    status, frame = video.read()
    
    if not status :
        print("End of video +++++++++++++++++++++++++++++++++ Frame number:", frameNumber)
        break
        
    frameNumber += 1

    frame = cv2.resize(frame, (0,0), fx=frameScaleFactor, fy=frameScaleFactor)

    if isFirstFrame: 
        # Open the output video taking the output size from the incoming scaled frame size 

        # First, get details of the frame size from its shape property
        print("Frame shape from first frame:", frame.shape)
        fheight, fwidth, fchannels = frame.shape

        # Create the video writer output using the same fps and frame size as the input
        videoOutfo = brunel_ecotrac_classesA.VideoWriterMP4(videoOutputFileName, videoInfo.fps, ( fwidth, fheight ) ) #videoInfo.frameSize )
        videoOut = videoOutfo.video
        
    # Convert colour image to monochrome (greyscale) image
    monochromeFrame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) 

    # Slightly blur the incoming image, which helps to avoid false positives from background movement
    # We may need to rethink this if the moving objects are particularly small in the frame.
    monochromeFrame = cv2.GaussianBlur(monochromeFrame, (21, 21), 0)

    # If this is the first frame, then use the first frame as the background for comparison.
    if isFirstFrame:
        prevImg = monochromeFrame

    # Get the background image as the previous image that was read
    bgImg = prevImg

    # Get the absolute difference image between the background image and the frame read from the video
    diff = cv2.absdiff(bgImg, monochromeFrame)

    ret, thresh = cv2.threshold( diff, 10, 255, cv2.THRESH_BINARY )
    thresh = cv2.dilate( thresh, element )

    # Get the contours found in the threshold image
    contourList, res = cv2.findContours( thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE )

    # Report processing stats
    if len(contourList) > maxContours:
        maxContours = len(contourList)

    print( "\rFrame:", frameNumber, outputFrameCount, "Countours:", len(contourList), " Max:", maxContours, "           ", end="\r" )


    #
    # Process the contours to establish the bounding boxes of all the moving objects
    #
    boxes = []


    if True: #len(contourList)<50: # Only show rectangles if there are fewer than 50 on the frame
        
        for contour in contourList:
            # get the bounding rectangle of the contour
            (x, y, w, h) = cv2.boundingRect(contour)           

            # Adjust the rectangle to snap to a grid determined by the snapTo setting
            t = y#(y-snapTo) 
            l = x#(x-snapTo) 
            b = y+h+snapTo
            r = x+w+snapTo
            
            adjt = t - t % snapTo
            adjl = l - l % snapTo
            adjb = b - x % snapTo
            adjr = r - x % snapTo
            box = brunel_ecotrac_classesA.Box(adjl, adjt, adjr, adjb)
            boxes.append( box )

    # Check for sudden increase in number of boxes, ignore the frame
    if len(boxes) - len(prevBoxes) > 15:
        # Adopt all the boxes found on the previous frame
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

    # If there are no boxes to be shown, set the frame skipping 
    # control variables
    if len(boxes)==0:
        skipCountUp = 0
        # Are we already skipping? if so, we just continue to skip
        if not skipping:
            # We are not already skipping check the countdown
            if skipCountDown > 0:
                # We are already counting down, count down again
                skipCountDown -=1
                # if the countdown is complete, start skipping
                if skipCountDown == 0:
                    skipping = True
                    print(" SKIPPING STARTED at frame ", frameNumber)
            else:
                # We are not skipping and there's no countdown, so
                # this must be the first frame with no movement, so
                # start the countdown
                skipCountDown = skipAfter
    else:
        # There is movement in this frame, so stop skipping
        # and stop counting down.
        if skipping:
            if len(boxes)==1:
                # If this is the first box to show movement during
                # skipping and there is only one box, then skip 3
                # frames, because it's probably spurious
                skipCountUp +=1
                if skipCountUp > 4:
                    skipping = False
                    skipCountDown = 0
                    skipCountUp = 0
            else: 
                # More than one box on the frame so stop skipping
                skipping = False
                skipCountDown = 0
                skipCountUp = 0
    
    # Check the skipping flag to see if we need to output the frame
    if not skipping:
        outputFrameCount += 1
        cv2.imshow("Scanned", frame)
        videoOut.write( frame )
        key = cv2.waitKey(frameDelay)
        if key == ord('q'):
            exit(0)
        #cv2.imshow("Diff video", diff)
        #cv2.imshow("Threshold", thresh )

    prevImg = monochromeFrame




    # reset the firstTime flag
    isFirstFrame = False

print( "\n ##################################################### Finished at", datetime.now().strftime("%H:%M") )
#video.release()
#videoOut.release()
cv2.waitKey(0)
cv2.destroyAllWindows()
