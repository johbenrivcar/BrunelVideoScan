import cv2
import sys
import brunel_ecotrac_settings
import logging
import os
import sys
import datetime
import time

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
        print("scanner", info)


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
        self.red = (255, 0, 0)
        self.green = (0, 255, 0)
        self.blue = (0, 0, 255)

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
        self.colour = clr = COLOURS.white
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
    fps = 0
    mspf = 0
    frameWidth = 0
    frameHeight = 0
    frameSize = (0,0)
    frameCount = 0
    scanCPUsecs = 0
    scanTimeSecs = 0
    scanCPUSecs = 0
    videoGB = 0.0
    videoDurationSecs = 0
    scanStartTime = None
    scanEndTime = None
    scanTimeSecs = 0




class VideoReader:
    currFrameNumber = 0
    currFrame = None
    prevFrame = None
    prevFrameList = []
    fwdFrameList = []    
    stats = VideoStats()
    

    def __init__(self,  videoFileName):
        stats = self.stats
        # fileName, fileSeqNumber, fileDTS, fileFrameRate, fileCodec, fileFrameCount, 
        self.fileName = videoFileName
        #print(" -- opening VideoReader --------------------------")
        self.video = video = cv2.VideoCapture(videoFileName)

        #TO DO - handle file open error here
        # Get hold of the first frame from the video and save it as the reference frame
        (status, frame1) = video.read()
        self.prevFrame = self.refFrame = self.currFrame = frame1

        stats.frameCount += 1
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
        
        # Generate a report of this input vidoe to the console.
        #self._report()
    
    # Function to read the next frame from the video
    def getFrame(self):
        stats = self.stats
        status, ffr = self.video.read()
        self.prevFrame = self.currFrame
        self.currFrame = ffr
        if not status:
            print("videoReader..finished")
            self.video.release()
            stats.videoDurationSecs = stats.frameCount / stats.fps
            stats.scanCPUSecs = time.process_time() - stats.scanCPUSecs
            stats.scanEndTime = newTS()
            stats.scanTime = secsDiff( stats.scanEndTime, stats.scanStartTime)
            self._report()
        else:
            stats.frameCount +=1    

        #print("cv2.read status=", status)
        # Add special information to the frame
        return (status, ffr)
        
            


    def _report(self):
        stats = self.stats
        ll = getLogger()
        ll.log("************ videoReaderInformation: " + self.fileName)
        ll.log("* Frames per second:         " + str( stats.fps ) +  "(" + str( stats.mspf) + "ms per frame)")
        ll.log("* Frame width x height:      "+ str( stats.frameWidth) +  "x"+ str(  stats.frameHeight   ))
        ll.log("* Scan statistics:")
        ll.log("*           Scan start time: " + sDTS( stats.scanStartTime) )
        ll.log("*             Scan end time: " + sDTS( stats.scanEndTime) )
        ll.log("* Total frames/video length: " + str(stats.frameCount) + " / " + secsToMinsSecs( ( round( stats.frameCount/stats.fps , 0) ) ) )
        ll.log("*        Time taken to scan: " + secsToMinsSecs( stats.scanTime ) )
        ll.log("*             CPU Time used: " + str( round( stats.scanCPUSecs , 1) ) + " seconds" )
        ll.log("********************************************************")
        
        

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

        #self.fps = video.get(cv2.CAP_PROP_FPS)
        self.mspf = round(1000/self.fps)
        self.frameWidth = frameSize[0]
        self.frameHeight = frameSize[1]
        self._print()
        
    def write(self, frame):
        self.video.write(frame)

    def _print(self):
        print("************ videoWriter Information:", self.fileName, "*****************")
        print("* Frames per second:", self.fps, "(", self.mspf, "ms per frame)")
        print("* FrameSize:", self.frameSize)
        print("* Frame width x height: ", self.frameWidth, "w", self.frameHeight , "h" )
        print("************************************************************************\n")
        

class Box:
    def __init__(self, l, t, r, b):
        self.l = l 
        self.t = t 
        self.r = r 
        self.b = b
        self.h = h = b-t+1
        self.w = w = r-l+1
        
        self.centre =( round( l + w/ 2), round( t + h/ 2) )
        self.rgb = COLOURS.green
    
    def report(self):
        return "Box{ t:" + str(self.t) +",l:" + str(self.l) +",b:" + str(self.b) +",r:" + str(self.r) + "}"

    def drawInFrame(self, frame):
        cv2.rectangle( frame, (self.l,self.t), (self.r, self.b), self.rgb, 3 )

    def getDot(self):
        d = Dot(self.centre, 10)
