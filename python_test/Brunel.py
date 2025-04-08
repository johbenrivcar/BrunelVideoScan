import cv2
import ecotrac.brunel_ecotrac_settings as brunel_ecotrac_settings

class Colours:
    def __init__(self):
        self.white = (255,255,255)
        self.red = (255, 0, 0)
        self.green = (0, 255, 0)
        self.blue = (0, 255, 0)

    def mix(self, c1, c2 ):
        return ( round((c1[0]+c2[0])/2), round((c1[1]+c2[1])/2) , round((c1[2]+c2[2])/2))

COLOURS = Colours()       

class Dot:
    def __init__(self, centre, radius):
        self.x = centre[0]
        self.y = centre[1]
        self.centre = centre
        self.radius = 10 if radius==None else radius
        self.colour = COLOURS.white

    def forBox(self, box):
        self.x = box.l + int( (box.h+1)/2 )
        
        self.y = box.r + int( (box.h+1)/2 )
        self.centre = (x, y);
    def drawInFrame(self, frame):
        cv2.circle( frame, self.centre, self.radius, self.colour, cv2.FILLED, cv2.LINE_8)


class VideoReader:
    def __init__(self,  videoFileName):
        # fileName, fileSeqNumber, fileDTS, fileFrameRate, fileCodec, fileFrameCount, 
        self.fileName = videoFileName
        print(" -- opening VideoReader --------------------------")
        self.video = video = cv2.VideoCapture(videoFileName)

        fps = video.get(cv2.CAP_PROP_FPS)
        if fps == 0:
            print( " -- fps is zero, defaulting to 30")
            fps = 30
        self.fps = fps
        self.mspf = int(round(1000/self.fps))
        self.frameWidth = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.frameHeight = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.frameSize = ( self.frameWidth, self.frameHeight )
        self._print()
        


    def _print(self):
        print("************ videoReaderInformation:", self.fileName)
        print("* Frames per second:", self.fps, "(", self.mspf, "ms per frame)")
        print("* Frame width x height: ", self.frameWidth, "x", self.frameHeight  )
        
        

class VideoWriterMP4:
    fps = 30
    mspf = round(1000/30)
    frameWidth = 0
    frameHeight = 0
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
        
    def write(self,frame):
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
