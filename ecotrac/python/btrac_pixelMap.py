## Implements the pixel map used to monitor for repeated movements centered on limited areas of
## the video frame. The map holds data on each pixel in the output image frame, and monitors
## how many times a movement is detected within overlapping areas of 9 pixels of the frame.
## Each movement at a pixel is designated a "hit". The count of hits is cumulative if they
## continue to occur within 20 secs (600 frames). If no movement has occured within any
## 20-second period, then the hit count is reset to zero.


#We always output 1280x720, scaling the video frames to that size whatever the input frame size.
outputFrameWidth = 20 
outputFrameHeight = 10 
pixelMap = None

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


class Pixel:
    hits = 0
    lastHitFrame = 0
    showBox = True

    def __init__(self):
        hits = 0

    def bump(self, frameCount):
        if frameCount - self.lastHitFrame > 600:
            self.hits = 0

        self.hits+=1
        self.lastHitFrame = frameCount
        self.showBox = self.hits < 30
        global pixelMap
        pixelMap = self;

class PixelRow:
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
            self.px[col] = Pixel() 


    def bump(self, c, frameCount):
        if c < self.maxCol:
            self.px[c + 1].bump(frameCount)
        if c > 0:
            self.px[c - 1].bump(frameCount)
        self.px[c].bump(frameCount)


class PixelMap:
    maprow = None
    mapwidth = 0
    mapHeight = 0
    maxRow = -1
    maxCol = -1

    def __init__(self, mapWidth, mapHeight):

        self.maprow = dict()
        self.mapWidth = mapWidth
        self.mapHeight = mapHeight
        self.maxRow = mapHeight - 1
        self.maxCol = mapWidth - 1

        for row in range(0, mapHeight):
            self.maprow[row] = PixelRow(row, mapWidth) 


    def bump(self, r, c, frameCount):
        self.maprow[r].bump(c, frameCount)
        if r < self.maxRow :
            self.maprow[r+1].bump(c, frameCount)
        if r > 0 :
            self.maprow[r-1].bump(c, frameCount)

        # Return the pixel that was hit
        return self.maprow[r].px[c]
    
    def px(self, r, c):
        return self.maprow[r].px[c]
    
    def showBox(self, r, c):
        return self.maprow[r].px[c].showBox


def px(r, c):
    return pixelMap.px(r,c)

def newMap( rows, cols ):
    pixelMap = PixelMap( cols, rows )
    return pixelMap


def testMap():
    ## The pixel info array ========================================================
    print("Creating pixel map with 20 rows and 30 cols")
    pixelMap = PixelMap( 30, 20 )


    print ("----------------------------")
    for r in range(0, 20):
        line = ""
        for c in range(0, 30):
            line +="Y" if px(r, c).showBox else "N"
        print( line )
    print ("----------------------------")

    for n in range(34):
        pixelMap.bump( 5, 6, 234 );
        pixelMap.bump( 6, 4, 234 );


    print ("----------------------------")
    for r in range(0, 20):
        line = ""
        for c in range(0, 30):
            line +="." if px(r, c).showBox else "#"
        print( line )
    print ("----------------------------")
