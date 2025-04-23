## This implements the class that can output a dot to a frame in the same position over a number of
## frames, fading the dot until it is no longer displayed. This is used to generate a footprint
## trail wherever a movement is seen on the frame, giving the impression of a gradually fading
## trail of dots that follow the movement across the frame.

import cv2


initialDotColour = (127, 127, 127)
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




