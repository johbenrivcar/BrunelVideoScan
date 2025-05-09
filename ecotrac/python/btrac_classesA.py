import cv2
import sys
import btrac_settings
import logging
import os
import sys
import datetime
import time
import json

from os.path import isfile, join

# ==== Scanning settings from the settings file
# { snapTo , skipAfter , shiftLimit , minDisturbanceSizePx , outputFps , sensitivity , pythonScriptFolder , pythonScriptName , maxFrameSize  } 
scanning = btrac_settings.getSetting("scanning")

####################################
# This function is used to send messages through stdOut to the  
# controlling nodejs process.
def msg(*items):
    print("[-!-]", *items)
    sys.stdout.flush()
# #################################


# Returns cpu time used so far by the current process
cpuTime = time.process_time
# Now function returns the current date and time
newTS = datetime.datetime.now
def sDTS(dt):
    return str(dt)[0:19]

def secsDiff(a, b):
    return round( ( abs(a-b) ).total_seconds() )

def secsToMinsSecs(secs):
    secs = round(secs)
    # get the remainder from modulus of secs
    ss = secs % 60
    # get the minutes by dividing seconds by 60
    mm = int( (secs-ss)/60 )
    #print("secsToMinsSecs", secs, ">" , mm , ss )
    return str(mm) + "m" + ("00" + str(ss) + "s")[-3:]




class Log:
    def __init__(self, orderFolderPath):
        self.logger = logging.getLogger('ecotrac')
        self.logPath = orderFolderPath
        
        # if not os.path.exists(self.logPath):
        #     os.makedirs(LOG_DIR)
        fileHandler = logging.FileHandler("{0}/{1}.txt".format(orderFolderPath, "ScanReport"))
        self.logger.addHandler(fileHandler)

        self.logger.setLevel(logging.DEBUG)

    def log(self, info):
        self.logger.debug(info)
        print("scanner log: ", info)


myLog = None

def getLogger( orderFolderPath = None ):
    global myLog
    if myLog == None:
        myLog = Log(orderFolderPath)
    return myLog;

class Colours:
    def __init__(self):
        self.white = (255,255,255)
        self.grey = (150,150,150)
        self.red = ( 0, 0, 255)
        self.green = (0, 255, 0)
        self.blue = (255, 0, 0)

    def mix(self, c1, c2 ):
        return ( round((c1[0]+c2[0])/2), round((c1[1]+c2[1])/2) , round((c1[2]+c2[2])/2))

COLOURS = Colours()       

# This class draws a dot on the frame centered at a given position  (x,y)
class Dot:
    def __init__(self, centre, radius):
        self.x = centre[0]
        self.y = centre[1]
        self.centre = centre
        self.radius = 10 if radius==None else radius
        self.colour = clr = COLOURS.green
        decayFactor = 240/60
        self.decayOn = False

    def positionAtBox(self, box):
        self.x = x = box.l + int( (box.h+1)/2 )
        
        self.y = y = box.r + int( (box.h+1)/2 )
        self.centre = (x, y);
    
    def startDecay(self):
        clr = self.colour
        self.decayCount = dc = 60 # decays over 60 frames (2 secs?)
        self.decayStep = ( clr[0]/dc, clr[1]/dc, clr[2]/dc )
        self.decayOn = True

    def drawInFrame(self, frame):
        if self.decayOn:
            if self.stopped:
                return False;
            clr = self.colour  
            ds = self.decayStep  
            newClr = ( clr[0] - ds[0] , clr[1]- ds[1], clr[2]-ds[2] )
            self.colour = newClr
        cv2.circle( frame, self.centre, self.radius, self.colour, cv2.FILLED, cv2.LINE_8)
        self.decayCount -=1
        if self.decayCount < 1:
            self.stopped = True;
            return False
        return True

class VideoFrame:
    frame = None
    monoFrame = None
    prevDiffs = None
    nextDiffs = None
    frameNumber = 0
    
class VideoStats:
    folderName = ""
    fileNumber = 0
    fps = 0
    mspf = 0
    frameWidth = 0
    frameHeight = 0
    frameSize = (0,0)
    frameCount = 0
    scanCPUSecs = 0
    scanTimeSecs = 0
    videoMB = 0.0
    videoDurationSecs = 0
    scanStartTime = None
    scanEndTime = None
    scanTimeSecs = 0
    scanCPUPerMinVideo = 0
    scanCPUPerFrame = 0.0
    videoCount = 0

    # The parameter self is the implicit reference to this instance of the
    # class, which is always the first parameter of the call.
    def reportStats(self):
        
        ll = getLogger()
        ll.log("********************************************************")
        if self.fps > 0:
            ll.log("*         Frames per second: " + str( self.fps ) +  "(" + str( self.mspf) + "ms per frame)")
            ll.log("*      Frame width x height: "+ str( self.frameWidth) +  "x"+ str(  self.frameHeight   ))
        ll.log("* Scan statistics:")
        if self.videoCount > 1:
            ll.log("*     Number of video files: " + str( self.videoCount ))
        ll.log("*           Total file size: " + str( round(self.videoMB, 3)) + "MB")

        fcMsg = "* Total frames/video length: " + str(self.frameCount)
        if self.fps > 0:
            fcMsg += " / " + secsToMinsSecs( ( round( self.frameCount/self.fps , 0) ) )
        ll.log(fcMsg)
        ll.log("*           Scan start time: " + sDTS( self.scanStartTime) )
        ll.log("*             Scan end time: " + sDTS( self.scanEndTime) )
        ll.log("*        Time taken to scan: " + secsToMinsSecs( self.scanTimeSecs ) )
        ll.log("*             CPU Time used: " + str( round( self.scanCPUSecs , 1) ) + " secs (" + str(round( self.scanCPUPerMinVideo , 1 )) + " secs/min of video)")
        ll.log("********************************************************")
            


class OverallStats():
    oStats = VideoStats()
    def addStats(self, stats):
        os = self.oStats
        #os.folderName = stats.videoFolder
        os.fps = stats.fps
        os.videoCount += stats.videoCount
        os.frameCount += stats.frameCount
        os.scanCPUSecs += stats.scanCPUSecs
        os.scanTimeSecs += stats.scanTimeSecs
        os.videoMB += stats.videoMB
        os.videoDurationSecs += stats.videoDurationSecs
        if os.scanStartTime == None:
            os.scanStartTime = stats.scanStartTime
        os.scanEndTime = stats.scanEndTime
        os.scanCPUPerMinVideo = 60.0 * os.scanCPUSecs / os.videoDurationSecs 
        os.scanCPUPerFrame = os.scanCPUSecs / os.frameCount
    def report(self):
        
        ll = getLogger()
        ll.log( "***** OVERALL STATS FOR THE SCAN ***********************")
        self.oStats.reportStats()

    # Creates a JSON string representing the statistics in this overallStats object
    # and sends it as a STATS message to the parent process (nodejs)
    def sendStats(self):
        os = self.oStats
        dicOS = {}
        dicOS["folderName"]=self.videoFolder
        dicOS["fps"]=os.fps
        dicOS["videoCount"]=os.videoCount
        dicOS["frameCount"]=os.frameCount
        dicOS["scanCPUSecs"]=os.scanCPUSecs
        dicOS["scanTimeSecs"]=os.scanTimeSecs
        dicOS["videoMB"]=os.videoMB
        dicOS["videoDurationSecs"]=os.videoDurationSecs
        dicOS["scanStartTime"]=os.scanStartTime.strftime("%Y%m%d %H%M%S")
        dicOS["scanEndTime"]=os.scanEndTime.strftime("%Y%m%d %H%M%S")
        dicOS["scanCPUPerMinVideo"]=os.scanCPUPerMinVideo
        dicOS["scanCPUPerFrame"]=os.scanCPUPerFrame
        strOS = json.dumps(dicOS)
        msg( "STATS:" + strOS)


overallStats = OverallStats()
videoFileCount = 0

class VideoReader:
    currFrameNumber = 0
    currFrame = None
    prevFrame = None
    prevFrameList = []
    fwdFrameList = []    
    videoSourceFullPath = ""

    
    # Constructor parameters tell the reader where to find the video to be scanned
    def __init__(self, targetFolderFullPath, videoFileName ):
        global videoFileCount
        # New stats object for this reader
        self.stats = stats = VideoStats()

        videoFileCount += 1
        self.videoSourceFullPath = videoSourceFullPath = join(targetFolderFullPath , videoFileName);

        stats.fileNumber = videoFileCount
        stats.videoCount = 1
        # fileName, fileSeqNumber, fileDTS, fileFrameRate, fileCodec, fileFrameCount, 
        self.fileName = videoFileName
        stats.videoMB = os.stat(videoSourceFullPath).st_size/1000000.0
        #print(" -- opening VideoReader --------------------------")
        self.video = video = cv2.VideoCapture(videoSourceFullPath)

        #TO DO - handle file open error here
        # Get hold of the first frame from the video and save it as the reference frame
        (status, frame1) = video.read()
        self.prevFrame = self.refFrame = self.currFrame = frame1

        stats.frameCount = 1

        stats.scanCPUSecs = time.process_time()
        stats.scanTimeSecs = 0.0
        # Now get various properties of the video file which will
        # inform the output  file creation - we copy frames per
        # second to keep movement realistic in output video
        fps = video.get(cv2.CAP_PROP_FPS)
        if fps == 0:
            print( " -- fps is zero, defaulting to 30")
            fps = 30
        stats.fps = fps

        # Calculate milliseconds per frame for playback delay (if needed)
        stats.mspf = int(round(1000/stats.fps))
        stats.scanStartTime = newTS()
        # Not using properties of the video file as this seems to return zero sometimes
        #self.frameWidth = frameWidth = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        #self.frameHeight = frameHeight = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Get the frame height and width directly from the first frame of the video
        frameHeight, frameWidth, channels = frame1.shape
        stats.frameHeight = frameHeight
        stats.frameWidth = frameWidth
        stats.frameSize = ( frameWidth, frameHeight )
        
        # Generate a report of this input video to the console.
        #self._report()
    
    # Function to read the next frame from the video
    def getFrame(self):
        global overallStats

        stats = self.stats
        status, ffr = self.video.read()
        self.prevFrame = self.currFrame

        if not status:
            print("videoReader..finished")
            self.video.release()
            stats.videoDurationSecs = stats.frameCount / stats.fps
            stats.scanCPUSecs = cpuSecs = time.process_time() - stats.scanCPUSecs
            stats.scanEndTime = newTS()
            stats.scanTimeSecs = secsDiff( stats.scanEndTime, stats.scanStartTime)
            stats.scanCPUPerMinVideo = 60.0 * cpuSecs / stats.videoDurationSecs 
            stats.scanCPUPerFrame = cpuSecs / stats.frameCount
            self._report()
            overallStats.addStats(stats)
        else:
            stats.frameCount +=1    
            self.currFrame = ffr

        #print("cv2.read status=", status)
        return (status, ffr)
        
            


    def _report(self):
        stats = self.stats
        ll = getLogger()
        ll.log("************ Video File Information [" + str(stats.fileNumber) + "]: " + self.fileName)
        stats.reportStats()
        
        

class VideoWriterMP4:
    fourcc = cv2.VideoWriter_fourcc(*'XVID') # Code for MP4 encoding


    def __init__(self,  videoFileName, fps, frameSize):
        # fileName, fileSeqNumber, fileDTS, fileFrameRate, fileCodec, fileFrameCount, 
        self.fileName = videoFileName
        self.frameSize = frameSize
        self.fps = fps
        self.frameWidth = frameSize[0]
        self.frameHeight = frameSize[1]
        self.video = video = cv2.VideoWriter(videoFileName, self.fourcc, fps, frameSize)
        self.frameCount = 0

        #self.fps = video.get(cv2.CAP_PROP_FPS)
        self.mspf = round(1000/self.fps)
        self.frameWidth = frameSize[0]
        self.frameHeight = frameSize[1]
        
    def write(self, frame):
        self.video.write(frame)
        self.frameCount +=1

    def _print(self):
        ll = getLogger()
        ll.log("************ videoWriter Information:" + self.fileName + "*****************")
        ll.log("* Frames per second:" + str(self.fps) + " (" + str(self.mspf) + ") ms per frame)")
        ll.log("* FrameSize:" + str(  self.frameSize) )
        ll.log("* Frame width x height: " + str(self.frameWidth) + "w" + str(self.frameHeight ) + "h" )
        ll.log("* Ouput frames/length: " + str( self.frameCount ) + "/" + secsToMinsSecs( round(self.frameCount / self.fps, 0) ) )
        ll.log("************************************************************************")
        
    def  release(self):
        self.video.release()
        global overallStats
        os = overallStats
        os.outputVideoFrames = self.frameCount
        self._print()

class Box:
    pixel = None
    def __init__(self, l, t, r, b):
        self.setLTRB(l, t, r, b)
        self.rgb = COLOURS.green

    def setLTRB(self, l, t, r , b):
        self.l = l 
        self.t = t 
        self.r = r 
        self.b = b
        self.h = h = b-t+1
        self.w = w = r-l+1
        self.centre =( round( l + w/ 2), round( t + h/ 2) )

    def report(self):
        return "Box{ t:" + str(self.t) +",l:" + str(self.l) +",b:" + str(self.b) +",r:" + str(self.r) + "}"

    def drawInFrame(self, frame):
        if self.pixel.showBox:
            self.rgb = COLOURS.green
        else:
            self.rgb = COLOURS.red
        cv2.rectangle( frame, (self.l,self.t), (self.r, self.b), self.rgb, 1 )

    def getDot(self):
        d = Dot(self.centre, 10)
