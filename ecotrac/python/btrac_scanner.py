## This is the core component that scans video file(s) to detect movement (or any change) in what is 
## recorded on a video and to generate a summary video of those parts of the input that show changes
## 
## Changes are detected by comparing each frame to its preceding frame to find areas of change, then
## drawing boxes round those areas of change before writing the frame to an output file. If there 
## are no changes then the frame is not written to the output. This way, the output contains only those
## parts of the input that show changes.
##
## The process by which changes are detected is as follows
##  * each frame is first converted from colour to grey-scale (note that colours might change
##  significantly yet have the same grey-scale value - in such cases no movement would be detected.
##  in practice this is unlikely to be a significant problem). The resulting grey-scale image
##  consists of an array of pixels with a grey-scale value in the range 0-255
##  * the image is mathematically processed to introduce a small amount of blurring acroos the whole
##  frame, to help avoid mistakently registering movement from very minor changes of tone, due to 
##  signal noise or imperfections, or very small movements in small area of the image.
##  * the two frames (current frame and previous frame) are compared mathematically by subtracting
##  the value of each pixel in the current frame from the value of the corresponding pixel on the 
##  previous frame and saving the absolute value of the difference in a new differences frame.
##  * The resulting differences are then filtered by applying a maximal-contrast filter that sets
##  any difference greater than a certain threshold value to 255 (the maximum), and any difference less
##  then the threshold to zero, thereby ignoring below threshold. Visually, the difference frame now
##  appears as white sploges (max values) representing points of difference (movement) against a
##  uniformly black background.
##  * The differences image may now contain quite fragmented patches of movement that are in fact
##  parts of the same single overall movement. To avoid reporting multiple movements instead of a single
##  movement, the white patches are expanded by a certain radius, thereby enlarging all the white patches into
##  the surrounding black areas. This effectively soaks up small areas of black that may be surrounded
##  by large numbers of white patches - a bit like blots spreading and merging on a porous surface.
##  * Having expanded the areas of white, the next step is to contract them by the same amount to reduce
##  their overall size. Although this will bring the outermost borders of white areas back to where
##  they started, any areas of black that were eliminated within or along edges of white areas in the
##  previous step remain white, effectively reducing "noise".
##  * The resulting differences image now shows solid areas of movement in which most of the spurious
##  noise and fragments have been eliminated. This is now processed by an edge-tracing (contouring)
##  algorithm to follow the boundaries of all the separate white areas and work out the dimensions 
##  and position of a rectangle (box) that completely encloses each separate area of movement. 
##  * The boxes so identified are to be drawn on the output summary video to visually highlight
##  areas of movement. As these boxes are drawn on a single frame taken from the original video, having
##  too many overlapping boxes my look to chaotic. So..
##  * The boxes are compared to find those that have centre points that are close together. Where
##  such close boxes are found, they are both replaced by a single box that encompasses both.
##  
# Get the sys library for stdOut abd run-time
# parameters
import sys
import datetime
import time
# Get the python math library
import math

# Get the ecotrac settings module and getSetting function
import btrac_settings
getSetting = btrac_settings.getSetting

# Get the Brunel Ecotract classes module
import btrac_classesA
overallStats = btrac_classesA.overallStats

import btrac_FadingDot as fDots

# The msg function is used to send messages through stdOut to the  
# controlling nodejs process.
msg = btrac_classesA.msg

# Returns cpu time used so far by the current process
cpuTime = time.process_time
# Now function returns the current date and time
newTS = datetime.datetime.now
def sDTS(dt):
    return str(dt)[0:19]

# Get the openCV library
import cv2
# Get basoc cv constants used in scanning



# Settings for writing information to frame
infoFont = cv2.FONT_HERSHEY_DUPLEX
logoFont = cv2.FONT_HERSHEY_PLAIN or cv2.FONT_ITALIC
infoColor = getSetting("colours.infoText")
logoColor = getSetting("colours.brunelText")

fontsize = 1
pos_infoLine1 =(20, 30 )
pos_infoLine2 =(20, 70 )
pos_topRight1 =( 900, 30 )
pos_logoLine1 =( 900, 700)




# Get references to specific functions in classes module
sDTS           = btrac_classesA.sDTS
secsDiff       = btrac_classesA.secsDiff
cpuTime        = btrac_classesA.cpuTime
newTS          = btrac_classesA.newTS
secsToMinsSecs = btrac_classesA.secsToMinsSecs

#image logo to be watermarked into scan output
#imgLogo = cv2.resize( cv2.imread("images/logo04.png"), (1280, 720) )

def addLogoToFrame( frame, img ):
    # Not implemented yet
    return frame;

    # alpha = 0.1
    # outFrame = frame.copy()
    # beta = 1.0 - alpha
    # cv2.addWeighted( imgLogo, alpha, frame, beta, 0.0, outFrame )
    
    # cv2.imshow("Logo", outFrame)
    # cv2.imshow("Input", frame )
    # cv2.waitKey(1)
    # return outFrame


## This function is used to add meta-data to each frame that identifies the original video file
## containing the frame and the frame number and point in time of the frame within that video.
def addInfoToFrame( fileName, frame, videoNumber, frameNumber, secsFromStart ):
    global fontsize, infoColor, infoFont, secsToMinsSecs, logoFont, pos_infoLine1, pos_infoLine2, pos_logoLine1, pos_topRight1, logoColor

    text = fileName
    cv2.putText( frame, fileName, pos_infoLine1, infoFont, fontsize, color = infoColor )

    text = "[" + str(videoNumber) + "/" + str(frameNumber) + "] " + secsToMinsSecs(secsFromStart) 
    cv2.putText( frame, text, pos_infoLine2, infoFont, fontsize, color = infoColor )


    cv2.putText( frame , "Brunel " + getSetting("app_name") , pos_logoLine1, logoFont, fontsize * 2, color = logoColor )
# ----------------------------------------------------------------------------

# Time stamp and CPU time used so far, at start
startTS = newTS()
startCPU = cpuTime()
print("Scanning run started at " + sDTS(startTS) + " with CPU so far " + str(startCPU) )
# ----------------------------------------------


# Get os library which gives access to files and folders
# and specific functions from that library
import os
from os import listdir
from os.path import isfile, join

# Get tje python date/time library
from datetime import datetime
# -------------------------------------------------------


# ############# RUN TIME PARAMETERS
args = sys.argv
msg("py args", args)
sys.stdout.flush()
# ---------------------------------


# ###############
# This section gets holds of the run time parameters
# Each parameter is supplied as a string containing
# a name value pair in the form "name:value"
#
# Dictionary to hold name-value pairs
rtps = {}
progName = args[0]

ix = -1
# Process each run-time parameter in turn
for ix in range(1, len(args)):
    
    try:
        arg = args[ix]
        # Replace escapted backslash with a single forward
        # slash in folder/file path names, for windows
        arg = arg.replace("\\", "/")
        
        # Split the string on colon
        kvp = arg.split(":", 1)
        # left hand-side before : is the key 
        key=kvp[0].lower()
        # right hand side after the : is the value
        val=kvp[1]
        # save the value in the dictionary
        rtps[key]=val
    except:
        val=""

# Report the extracted run time parameters
msg("Run time parameters: ", rtps)

# Now validate the run-time-parameters
targetMode = "" # Parameter key is mode
targetRoot = "" # Parameter key is root, path to root folder (normally on gDrive ecotrac folder)
targetCustomer = "" # Parameter key is cust, gives name of the customer folder (normally "cust_" followed by email )
targetVideoFolder = "" # parameter key is fldr, gives the name of the order sub-folder (in customer folder) to be scanned
disp = False # parameter key is disp, Y or N indicates if you want to see the video animation while it is being scanned

# check disp setting (optional)
try:
    if(rtps["disp"]):
        # set flat to True if the rtp is set to "Y", otherwise it's false
        disp = rtps["disp"]=="Y"
except:
    disp = False

# check that all four other rtps are given, because they are all mandatory
try:
    targetMode = rtps["mode"] 
    targetRoot = rtps["root"]
    targetCustomer = rtps["cust"]
    targetVideoFolder = rtps["fldr"]
    
except: # Report an error
    msg( "ERROR=Run-time parameters not correctly loaded")
    msg("END:342")
    exit(342)

# Check that the target folder ends with ".scanning", this is a convention of the system
if not targetVideoFolder.endswith(".scanning"):
    msg( "ERROR=Target folder must end with .scanning")
    msg("END:343")
    exit(343)

# The full path to the folder is the combination of three parameters
targetFolderFullPath = join( targetRoot, targetCustomer, targetVideoFolder )


scanReport = btrac_classesA.getLogger(targetFolderFullPath)
scanReport.log( "_____________________________________________________________________________________________________________________")
scanReport.log( "* Scanning run started at "+ sDTS(startTS) )

msg( "Target folder: ", targetFolderFullPath)

#
#  Generating the movements file from the input:
#     Whenever there are movement boxes, we want to generate output to the report video which
#       indicates which file the movement is found in, and at what point in the file it was found
#       (mins and secs from the beginning of the file)
#     We want to precede the point at which the movement is reported with a 3-sec showing of
#       an information panel that gives the location details of the movment that was found
#     

# this function checks if a file is scannable
# Currently .mp4 and .avi only
def isScannable(f): # ====================================
    ff = f.lower()
    if ff.endswith(".scanned.mp4"):
        return False
    if ff.endswith(".mp4"):
        return True
    if ff.endswith(".avi"):
        return True
    return False
# =========================================================


showDisplay = disp

msg( "\n ##################################################### Started at", datetime.now().strftime("%H:%M") )
#sys.stdout.flush()
try:
    # Get the list of video files to be processed
    # They must all end in .mp4 but not .scanned.mp4 (which is the output file of the scanning process)
    filesToProcess = [f for f in listdir(targetFolderFullPath) if isfile(join(targetFolderFullPath,  f)) and isScannable(f) ]
except:
    # If that failed report it back to the nodejs controller
    msg("No folder was found in the location specified")
    msg("ERR:Folder not found for scanner")
    msg("END:105")
    exit(105)

# Sort the found files into name order for scanning. 
# This is an application convention. The person submitting the
# files must name them so that they are scanned in the order
# required.
filesToProcess.sort()

# Report the list of files to be scanned
msg("FTP:", filesToProcess)

# Check that we have at least one file to process
if len(filesToProcess) == 0:
    # Report failed ending
    msg("ERR:No video files in folder to be scanned")
    msg("END:106")
    exit(106)

# ==== Scanning settings from the settings file
snapTo = btrac_settings.getSetting("scanning.snapTo")
skipAfter = btrac_settings.getSetting("scanning.skipAfter")
shiftLimit = btrac_settings.getSetting("scanning.shiftLimit")

# sensitivity should be a number in the range 1 to 10, this is
# translated into threshold numbers used to detect if changes have
# occurred in images.
# NOT CURRENTLY IMPLEMENTED
sensitivity = btrac_settings.getSetting("scanning.sensitivity")


# ****************

COLOURS = btrac_classesA.Colours()
videoOutputFullPath = ""
reportOutputFullPath = ""

# frameDelay is used only if the disp setting is true, as the time to pause after writing
# each frame, so the action can be seen while scanning is in progress.
frameDelay = 5 

#bgImg = cv2.imread("images/rabbit_BG.png")
#bgImg = cv2.cvtColor(bgImg, cv2.COLOR_BGR2GRAY)
#bgImg = cv2.GaussianBlur(bgImg, (21, 21), 0)


# background image (not used yet)
bgImg = None

# Scanned video output object, writing detected movements to a new video
videoWriter = None
isFirstFrame = True

# ## Shape used in modifying image see below
# parameters are:                   VRectangle, vSize,     vAnchor point (centre of the rectangle) 
element = cv2.getStructuringElement(0,          (11, 11), (5, 5))

# Number of the file currently being scanned starting at 1
scanNum = 0
frameNumber = 0
outputFrameCount = 0
outputTimeSecs = 0 # Length of the output video in seconds, (frames / 30 fps)
boxBorder = 3
boxColour = {}

#msg("");
maxContours = 0
# Array of movement boxes that were found on the previous frame
prevBoxes = []

# Flags to indicate the video output is skipping if no movement is found
skipping = True
skipCountDown = 0
skipCountUp = 0
skip1 = False
videoReader = None
frame = None

# Scale factors are calculated later, the ratio of input video frame size to output frame size
widthScaleFactor = 1 
heightScaleFactor = 1 





#We always output 1280x720, scaling the video frames to that size whatever the input frame size.
outputFrameWidth = 1280 
outputFrameHeight = 720 

def checkRow(r):
    if r < 0:
        r = 0
    else:
        if r >= outputFrameHeight:
            r = outputFrameHeight - 1
    return r
def checkColumn(c):
    if c < 0:
        c = 0
    if c >= outputFrameWidth:
        c = outputFrameWidth - 1
    return c

pixelCount = 0

class Pixel:
    id = 0
    hits = 0
    lastHitFrame = 0
    showBox = True
    prow = 0
    pcol = 0
    row = 0
    col = 0

    def __init__(self, row, col):
        global pixelCount
        pixelCount +=1
        self.id = pixelCount
        self.prow = self.row = row
        self.pcol = self.col = col
        #if row == 3:
        #    self.report("init")

    def bump(self):
        global outputFrameCount
        if outputFrameCount - self.lastHitFrame > 600:
            self.hits = 0
            #print ("Resetting pixel R" + str( self.row ) + "C" + str(self.col) + " at output frame " + str( outputFrameCount ) )
        self.hits+=1
        self.lastHitFrame = outputFrameCount
        self.showBox = (self.hits < 30)
        if (not self.showBox ) and self.col < 10 :
            self.report("hidden")

    def report(self, stage = ""):
        print ("***** Stage(" + stage + ")id[" + str(self.id) + "]: R" + str(self.prow) + "//" + str(self.row) + "C" + str( self.col ) + " Hits:" + str( self.hits ) + " lastHitFrame:" + str(self.lastHitFrame) + " ShowBox:" + str( self.showBox))
        

class PixelRow:
    # row number
    row = 0
    # number of columns in the row
    rowWidth = 0
    # Max column number = No of columns - 1
    maxCol = -1

    def __init__(self, row, rowWidth):

        # list of pixels
        self.px = dict()
        self.row = row
        self.rowWidth = rowWidth
        self.maxCol = rowWidth - 1

        # Create the list of Pixels in this row
        for col in range(0, rowWidth):
            # Add New Pixel to the list of pixels
            self.px[col] = Pixel(row, col) 

        #if row < 10:  
        #    print( "Map row " + str(row) + " has been created")

    def bump(self, c):
        if c < self.maxCol:
            self.px[c + 1].bump()
        if c > 0:
            self.px[c - 1].bump()
        self.px[c].bump()

        

class PixelMap:
    maprow = None
    mapwidth = 0
    mapHeight = 0
    maxRow = -1
    maxCol = -1

    def __init__(self, mapWidth, mapHeight):
        print("Map constructor ************************")
        self.maprow = dict()
        self.mapWidth = mapWidth
        self.mapHeight = mapHeight
        self.maxRow = mapHeight - 1
        self.maxCol = mapWidth - 1

        for row in range(0, mapHeight):
            #print("  Creating pixelRow #" + str(row))
            self.maprow[row] = PixelRow(row, mapWidth) 

        #print("Finished construction, reporting row 5 >>>>>>>>>")
        #for col in range( 0, mapWidth ):
            #print( "   Row 5: Col " + str(col) + " pixel: ") 
            #self.px(5, col).report("mapInit")


    def bump(self, r, c):
        #print("Bumping r c", r, c)
        self.maprow[r].bump(c)
        if r < self.maxRow :
            self.maprow[r+1].bump(c)
        if r > 0 :
            self.maprow[r-1].bump(c)

        # Return the pixel corresponding to the centre of the box
        return self.maprow[r].px[c]
    
    def px(self, r, c):
        return self.maprow[r].px[c]
    
    def showBox(self, r, c):
        return self.maprow[r].px[c].showBox


## The pixel info array ========================================================
print("Creating pixel map with " + str(outputFrameHeight) + " rows and " + str( outputFrameWidth) + " cols")
pixelMap = PixelMap( outputFrameWidth, outputFrameHeight )

def px(r, c):
    return pixelMap.px(r,c)

px(5,5).report("R5C5 after map initialization")


# Now, we start scanning each video in turn
for videoFileName in filesToProcess:
    scanNum += 1
    msg("Scan ", scanNum, ": ", videoFileName)
    
    # Path to the input video file
    videoSourceFullPath = join( targetFolderFullPath , videoFileName )
    msg(" -Path", videoSourceFullPath )
    
    # Get a (wrapped) video reader object, see the brunel classes file A
    videoReader = btrac_classesA.VideoReader(targetFolderFullPath, videoFileName)

    # Get the underlying openCV video reader object
    #video = videoReader.video

    # Check if we have started outputting a video yet, if not start a new one.
    if videoOutputFullPath == "":

        # The output scanned video is named after the folder, with the suffix ".scanned.mp4"
        videoOutputFileName = targetVideoFolder.replace(".scanning", ".scanned.mp4" )
        videoOutputFullPath = join( targetFolderFullPath, videoOutputFileName)
        
        # We also will create a report file that logs information about all the files that were scanned
        # In future this will be an html file
        reportOutputFullPath = join( targetFolderFullPath, targetVideoFolder.replace(".scanning", ".scanreport.txt" ))
        
        msg("Video output file: ", videoOutputFullPath)
        msg("Report output file: ", reportOutputFullPath)


        # Create the video writer output file using the same fps as the input.
        #  (We assume that all input videos have the same frame rate)
        videoWriter = btrac_classesA.VideoWriterMP4(videoOutputFullPath, int(videoReader.stats.fps/2), ( outputFrameWidth, outputFrameHeight ) ) #videoInfo.frameSize )
        
        # Get the underlying OpenCV video object (in future will wrap)
        #videoOut = videoWriter.video
        
        outputFrameNumber = 0
        msg("videoWriter has been created")
        sys.stdout.flush()
    
    #Caclulate the scaling factor being the ratio of output to input frame sizes
    widthScaleFactor = outputFrameWidth / videoReader.stats.frameWidth
    heightScaleFactor = outputFrameHeight / videoReader.stats.frameHeight
    msg("frameScaleFactor is set to", widthScaleFactor, heightScaleFactor)
    msg("Output frame size " + str(outputFrameWidth) + "x" + str(outputFrameHeight) )

    # Now ready to process this input video file
    isFirstFrame = True
    prevBoxes = []

    # Flags to indicate the video output is skipping if no movement is found
    skipping = True
    skipCountDown = 0
    skipCountUp = 0
    skip1 = False
    frame = None

    # Note that the Brunel ecotrac reader reads in the first frame on opening and uses this as the
    # reference frame, if comparison is to reference frame rather than to previous frame.
    frameNumber = 0
    msg("Start of video +++++++++++++++++++++++++++++++++")
    
    while True:
        status, frame = videoReader.getFrame(); # video.read()
        #print("status=", status)
        #print("frame=", frame)
        # Check that the read was successful, if not end the loop
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

            
        # Convert colour image to monochrome (greyscale) image
        monochromeFrame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) 

        # Slightly blur the incoming image, which helps to avoid false positives from background movement
        # We may need to rethink this if the moving objects are particularly small in the frame.
        monochromeFrame = cv2.GaussianBlur(monochromeFrame, (11, 11), 0)

        # If this is the first frame, then use the first frame as the background for comparison.
        if isFirstFrame:
            prevImg = monochromeFrame

        # Get the background image as the previous image that was read
        bgImg = prevImg

        # Get the absolute difference image between the background image and the frame read from the video
        diff = cv2.absdiff(bgImg, monochromeFrame)

        ret, thresh = cv2.threshold( diff, 20, 255, cv2.THRESH_BINARY )
        thresh = cv2.dilate( thresh, element )

        # Get the contours found in the threshold image
        contourList, res = cv2.findContours( thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE )

        #cv2.imshow("Diff video", diff)
        #cv2.imshow("Threshold", thresh )
        key = cv2.waitKey(10)

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
                # bottom and right coordinates are taken beyond the box by one grid size
                # so that when adjusted by modulus the final position is outside the bounding
                # box
                b = y+h #+snapTo
                r = x+w #+snapTo
                
                # The adjusted grid references are calculated by subtracting the modulus
                # 
                adjt = t #- t #% snapTo
                if adjt<0:
                    adjt = 0
                if adjt >= outputFrameHeight:
                    adjt = outputFrameHeight - 1
                adjl = l #- l % snapTo
                adjb = b #- b % snapTo
                adjr = r #- r % snapTo
                box = btrac_classesA.Box(adjl, adjt, adjr, adjb)

                # Checking on the pixel map for multiple hits of
                # movement in the same location on the frame. These
                # are treated as suspected "noise" that should not
                # be tracked
                # 1. Make sure the row and column are on the frame
                rw = checkRow(box.centre[1])
                cl = checkColumn(box.centre[0])

                # bump the hit count for this pixel and get back
                # a flag indicating whether the box should be shown
                # on the frame
                box.pixel = pixelMap.bump(rw, cl)

                # add the box to the box list
                boxes.append( box )

        # Check for sudden increase in number of boxes, ignore the boxes 
        # if so and use the boxes from the previous frame
        if len(boxes) - len(prevBoxes) > 50:
            # Adopt all the boxes found on the previous frame,
            # ignoring all the boxes found in the current frame
            boxes = prevBoxes

        else:
            # Find nearest box to each previous box in the current frame
            for box in boxes:
                nearestBox = None
                nearestShift = 10000000
                for pbox in prevBoxes:
                    #msg("Shift calc:", pbox.report(), box.report() )
                    # Calculate the difference in position of all corner co-ordinates
                    xt = (pbox.t-box.t) 
                    xl = (pbox.l-box.l)
                    xb = (pbox.b-box.b)
                    xr = (pbox.r-box.r)

                    # Using pythagoras, calculate direct distace between
                    # the centers of the the two boxes
                    # 1. Differenc in top left position
                    xtl = math.sqrt(xt**2 + xl**2 )
                    # 2. Differece in bottom right position
                    xbr = math.sqrt(xb**2 + xr**2 )
                    # Add these to distances to give a measure of how
                    # different the boxes are. Identical boxes will have
                    # boxshift = 0
                    boxshift = xtl + xbr

                    # Check if the two boxes are close enough that they
                    # could refer to the same mmovement and there is not
                    # another box we have already found that is closer
                    if boxshift < 20  and boxshift < nearestShift:
                        #msg("pbox, box:", pbox.report(), box.report() )
                        #msg( "SHIFT(t,l,b,r):(", xt, xl, xb, xr, ")")
                        #msg( "ROOT SQUARES( tl, br ):(", xtl, xbr, "}")
                        msg("boxshift:", boxshift)
                        nearestBox = pbox
                        nearestShift = boxshift

                # Now check that we found a box that qualifies as the same as a
                # box on the previous frame. If so, then use the previous box
                # position/diemensions for the current box. This helps to stablise the tracking
                if  nearestShift < shiftLimit :
                    #msg("Box shift", nearestShift, box.report(), "<<", nearestBox.report(), "                            ")
                    #msg("")
                    box.setLTRB( nearestBox.l, nearestBox.t, nearestBox.r , nearestBox.b)


        boxesToShow = boxes
        
        # On the first frame with no movement found, after previously there was movement,
        # repeat the previous frame boxes for one frame, because sometimes
        # the stream repeats a frame, so it shows no movement even though
        # the next frame will continue the movement from the previous frame
        if len(prevBoxes)>0 and len( boxes ) == 0:
            boxesToShow = prevBoxes
        
        # save the current box list as the previous box list for use on the next frame
        prevBoxes = boxes
        
        # draw all the dots from the previous frame, aged by one frame (see the function)
        fDots.drawAllDotsOnFrame( frame ) 

        # Now we are going to draw the boxes on the frame
        shownBoxesCount = 0
        for box in boxesToShow:
            if box.pixel.showBox:
                shownBoxesCount +=1 
                box.drawInFrame(frame)
                fDots.newDot( box )
        
        # If there were no boxes shown, set the frame skipping 
        # control variables
        if shownBoxesCount==0:
            # Countup indicates how many frames have been skipped so far
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
                # if len(boxes)==1:
                #     # If this is the first box to show movement during
                #     # skipping and there is only one box, then skip 3
                #     # frames, because it's probably spurious
                #     skipCountUp +=1
                #     if skipCountUp > 4:
                #         skipping = False
                #         msg(" SKIPPING stopped at frame ", frameNumber)
                #         skipCountDown = 0
                #         skipCountUp = 0
                # else: 
                    # More than one box on the frame so stop skipping
                    skipping = False
                    msg(" SKIPPING stopped at frame ", frameNumber)
                    skipCountDown = 0
                    skipCountUp = 0
        
        # Check the skipping flag to see if we need to output the frame
        if not skipping:
            outputFrameCount += 1
            
            # Here we add information to the frame
            sInFrameNum = str(scanNum) + "/" +  str(frameNumber)
            secsFromStart = frameNumber / videoReader.stats.fps
            #print("SecsFromStart", secsFromStart )
            #frame = addLogoToFrame( frame, imgLogo )
            addInfoToFrame( videoFileName, frame, scanNum, frameNumber, secsFromStart )
            videoWriter.write( frame )

            #cv2.imshow("Scanned", frame)
            #if showDisplay:
                #cv2.imshow("Diff video", diff)
                #cv2.imshow("Threshold", thresh )
                #key = cv2.waitKey(frameDelay)
            # if key == ord('q'):
            #     exit(0))

        prevImg = monochromeFrame

        # reset the firstTime flag
        isFirstFrame = False

    msg("End of video ++++[" + videoFileName + "]++++++ at frame number:", frameNumber)
    # Close the input video file
    # video.release()

msg( "##################################################### Finished at", datetime.now().strftime("%H:%M") )
#video.release()
videoWriter.release()

overallStats.videoFolder = targetVideoFolder
overallStats.folderName = targetVideoFolder
overallStats.report()

overallStats.sendStats()

msg("CPU:" + str(cpuTime()))

msg("END:000")

exit( 2344 )
#cv2.waitKey(0)
#cv2.destroyAllWindows()

