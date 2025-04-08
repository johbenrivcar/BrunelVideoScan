import sys

def msg(*items):
    print(*items)
    sys.stdout.flush()

import cv2
import math
import brunel_ecotrac_classesA
import settings
getSetting = settings.getSetting

import os

from os import listdir
from os.path import isfile, join

from datetime import datetime

args = sys.argv
msg("py args", args)
sys.stdout.flush()

rtps = {}
progName = args[0]
ix = -1
for ix in range(1, len(args)):
    
    try:
        arg = args[ix]
        arg = arg.replace("\\", "/")
        #msg("arg[" + ix + "]=" + arg )
        kvp = arg.split(":", 1)
        key=kvp[0].lower()
        val=kvp[1]
        rtps[key]=val
    except:
        val=""

msg("Run time parameters: ", rtps)

targetMode = ""
targetRoot = ""
targetCustomer = ""
fldr = ""
disp = False
try:
    if(rtps["disp"]):
        disp = rtps["disp"]=="Y"
except:
    disp = False

try:
    targetMode = rtps["mode"] 
    targetRoot = rtps["root"]
    targetCustomer = rtps["cust"]
    targetVideoFolder = rtps["fldr"]
    
except:
    msg( "ERROR=Run-time parameters not correctly loaded")
    msg("END=342")
    exit(342)
if not targetVideoFolder.endswith(".scanning"):
    msg( "ERROR=Target folder must end with .scanning")
    msg("END=343")
    exit(343)

targetFolderFullPath = join( targetRoot, targetCustomer, targetVideoFolder )


msg( "Target folder: ", targetFolderFullPath)
sys.stdout.flush()
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

showDisplay = disp

msg( "\n ##################################################### Started at", datetime.now().strftime("%H:%M") )
sys.stdout.flush()
try:
    filesToProcess = [f for f in listdir(targetFolderFullPath) if isfile(join(targetFolderFullPath,  f)) and ( f.endswith(".mp4") ) and not ( f.endswith(".scanned.mp4") ) ]
except:
    msg("No folder was found in the location specified")
    msg("ERROR=Folder not found for scanner")
    msg("END=105")
    exit(105)

filesToProcess.sort()
msg(filesToProcess)
sys.stdout.flush()
if len(filesToProcess) == 0:
    msg("ERROR=No video files in folder to be scanned")
    msg("END=106")
    exit(106)

# ==== Scanning settings
snapTo = settings.getSetting("scanning.snapTo")
skipAfter = settings.getSetting("scanning.skipAfter")
shiftLimit = settings.getSetting("scanning.shiftLimit")
#
# ****************

COLOURS = brunel_ecotrac_classesA.Colours()
videoOutputFullPath = ""
reportOutputFullPath = ""


frameDelay = 1 
#bgImg = cv2.imread("images/rabbit_BG.png")
#bgImg = cv2.cvtColor(bgImg, cv2.COLOR_BGR2GRAY)
#bgImg = cv2.GaussianBlur(bgImg, (21, 21), 0)
isFirstFrame = True
bgImg = None


videoOut = None 

# Rectangle, size, anchor point
element = cv2.getStructuringElement(0, (11, 11), (5, 5))

scanNum = 0

#msg("");
maxContours = 0
frameNumber = 0
outputFrameCount = 0
prevBoxes = []
# Flags to indicate the video is skipping if no movement is found
skipping = True
skipCountDown = 0
skipCountUp = 0
skip1 = False
videoReader = None
frame = None

widthScaleFactor = 1 #0.5 # Half the size output video compared to input video
heightScaleFactor = 1 

for videoFileName in filesToProcess:
    scanNum += 1
    msg("Scan ", scanNum, ": ", videoFileName)
    
    videoSourceFullPath = join( targetFolderFullPath , videoFileName )
    msg(" -Path", videoSourceFullPath )
    sys.stdout.flush()
    videoReader = brunel_ecotrac_classesA.VideoReader(videoSourceFullPath)
    video = videoReader.video

    if videoOutputFullPath == "":

        videoOutputFullPath = join( targetFolderFullPath, targetVideoFolder.replace(".scanning", ".scanned.mp4" ))
        
        reportOutputFullPath = join( targetFolderFullPath, targetVideoFolder.replace(".scanning", ".scanreport.txt" ))
        
        msg("Video output file: ", videoOutputFullPath)
        msg("Report output file: ", reportOutputFullPath)

        #We always output 1280x720, scaling the video to that size whatever the input frame size.
        outputFrameWidth = 1280 
        outputFrameHeight = 720 


        # Create the video writer output using the same fps and frame size as the input
        videoWriter = brunel_ecotrac_classesA.VideoWriterMP4(videoOutputFullPath, videoReader.fps, ( outputFrameWidth, outputFrameHeight ) ) #videoInfo.frameSize )
        videoOut = videoWriter.video
        
        outputFrameNumber = 0
        msg("videoWriter has been created")
        sys.stdout.flush()
    
    #Caclulate the scaling factor being the ratio of output to input frame sizes
    widthScaleFactor = outputFrameWidth / videoReader.frameWidth
    heightScaleFactor = outputFrameHeight / videoReader.frameHeight
    msg("frameScaleFactor is set to", widthScaleFactor, heightScaleFactor)
    msg("Output frame size " + str(outputFrameWidth) + "x" + str(outputFrameHeight) )

    # Now ready to process this input video file
    isFirstFrame = True

    # Note that the Brunel ecotrac reader reads in the first frame on opening and uses this as the
    # reference frame, if comparison is to reference frame rather than to previous frame.
    frameNumber = 0
    msg("Start of video +++++++++++++++++++++++++++++++++")
    sys.stdout.flush()
    while True:
        status, frame = video.read()
        
        if not status :
            break
            
        frameNumber += 1

        frame = cv2.resize(frame, (0,0), fx=widthScaleFactor, fy=heightScaleFactor)
        if showDisplay:
            cv2.imshow("Input", frame)
                # if isFirstFrame: 
                #     # Open the output video taking the output size from the incoming scaled frame size 

                #     # First, get details of the frame size from its shape property
                #     msg("Frame shape from first frame:", frame.shape)
                #     fheight, fwidth, fchannels = frame.shape

                #     # Create the video writer output using the same fps and frame size as the input
                #     videoWriter = brunel_ecotrac_classesA.VideoWriterMP4(videoOutputFileName, videoReader.fps, ( fwidth, fheight ) ) #videoInfo.frameSize )
                #     videoOut = videoWriter.video
            
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

        ret, thresh = cv2.threshold( diff, 12, 255, cv2.THRESH_BINARY )
        thresh = cv2.dilate( thresh, element )

        # Get the contours found in the threshold image
        contourList, res = cv2.findContours( thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE )

        # Report processing stats
        if len(contourList) > maxContours:
            maxContours = len(contourList)

        #msg( "\rFrame:", frameNumber, outputFrameCount, "Countours:", len(contourList), " Max:", maxContours, "           " )


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
                    #msg("Shift calc:", pbox.report(), box.report() )
                    xt = (pbox.t-box.t) 
                    xl = (pbox.l-box.l)
                    xb = (pbox.b-box.b)
                    xr = (pbox.r-box.r)
                    xtl = math.sqrt(xt**2 + xl**2 )
                    xbr = math.sqrt(xb**2 + xr**2 )
                    boxshift = xtl + xbr

                    if boxshift < 20  and boxshift < nearestShift:
                        #msg("pbox, box:", pbox.report(), box.report() )
                        #msg( "SHIFT(t,l,b,r):(", xt, xl, xb, xr, ")")
                        #msg( "ROOT SQUARES( tl, br ):(", xtl, xbr, "}")
                        #msg("boxshift:", boxshift)
                        nearestBox = pbox
                        nearestShift = boxshift

                if  nearestShift < shiftLimit :
                    #msg("\rBox shift", nearestShift, box.report(), "<<", nearestBox.report(), "                            ")
                    #msg("")
                    box.t = nearestBox.t
                    box.l = nearestBox.l
                    box.b = nearestBox.b
                    box.r = nearestBox.r

        if True: # TODO test for number of boxes in the frame
            for box in boxes:
                box.drawInFrame(frame)
                #cv2.rectangle( frame, (box.l,box.t), (box.r, box.b), (0, 255, 0), 3 )

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
                        msg(" SKIPPING STARTED at frame ", frameNumber)
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
                        msg(" SKIPPING stopped at frame ", frameNumber)
                        skipCountDown = 0
                        skipCountUp = 0
                else: 
                    # More than one box on the frame so stop skipping
                    skipping = False
                    msg(" SKIPPING stopped at frame ", frameNumber)
                    skipCountDown = 0
                    skipCountUp = 0
        
        # Check the skipping flag to see if we need to output the frame
        if not skipping:
            outputFrameCount += 1
            

            videoOut.write( frame )
            if showDisplay:
                cv2.imshow("Scanned", frame)
                cv2.imshow("Diff video", diff)
                cv2.imshow("Threshold", thresh )
                key = cv2.waitKey(frameDelay)
            # if key == ord('q'):
            #     exit(0))

        prevImg = monochromeFrame

        # reset the firstTime flag
        isFirstFrame = False

    msg("End of video ++++[" + videoFileName + "]++++++ at frame number:", frameNumber)
    # Close the input video file
    video.release()

msg( "\n ##################################################### Finished at", datetime.now().strftime("%H:%M") )
#video.release()
videoOut.release()
msg("END=000")
#cv2.waitKey(0)
#cv2.destroyAllWindows()

