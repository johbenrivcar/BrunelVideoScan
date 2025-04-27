##  This implements the class that can output a dot to a frame in the same position over a number of
##  frames, fading the dot until it is no longer displayed. Used to generate a "bubble"
##  trail wherever a difference is detected on the frame, usually from a moving body, giving the
##  effect of a gradually fading trail of dots that follow the moving object across the frame.

# OpenCV library for drawing shapes on a frame
import cv2

# Brunel ecotrac classes to provide COLOURS object defining colour for the bubble
import brunel_ecotrac_classesA as classesA
COLOURS = classesA.COLOURS

# Settings used to define certain parameters of the run
import { python } from brunel_ecotrac_settings 


initialDotColour = COLOURS.green # (255, 255, 255)
dotList = {}
dotCount = 0

class Dot:
    def __init__(self,  box ):
        global dotCount, initialDotColour, dotList
        dotCount += 1
        self.id = "dot" + str(dotCount)
        self.centre = box.centre
        self.initialSize = 5;
        self.frameCountDown = 90; # 3 seconds at 30 fps
        self.currentColour = initialDotColour
        
    def addToFrameAndShrink(self, frame ):
        global dotCount, initialDotColour, dotList
        cv2.circle(frame, self.centre, round( (self.initialSize) * self.frameCountDown / 90 ), self.currentColour, thickness=1, lineType=8, shift=0) #draw circle
        self.frameCountDown -= 1
        


## Creates a dot object positioned at the centre of the given box, and adds it to the
## dot list to be rendered on successive frames of the video over a period of seconds
def newDot( box ):
    addToList( Dot(box) );



def addToList(dot):
    global dotCount, initialDotColour, dotList
    dotList[dot.id] = dot

def removeFromList(dot):
    global dotCount, initialDotColour, dotList
    dotList.pop(dot.id)

def drawAllDotsOnFrame(frame):
    global dotCount, initialDotColour, dotList

    newList = {}
    for id, dot in dotList.items():
        dot.addToFrameAndShrink( frame )
        if dot.frameCountDown > 0:
            # add ourself from the new dots list
            newList[dot.id] = dot

    dotList = newList




