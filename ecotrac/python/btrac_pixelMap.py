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

class PixelRow:
    # number of columns in the row
    rowWidth = 0
    # Max column number = No of columns - 1
    maxCol = -1

    def __init__(self, row, rowWidth):

        # list of pixels
        self.px = list()
        self.row = row
        self.rowWidth = rowWidth
        self.maxCol = rowWidth - 1

        # Create the list of Pixels in this row
        for col in range(0, rowWidth):
            # Add New Pixel to the list of pixels
            self.px.append ( Pixel() )


    def bump(self, c, frameCount):
        if c < self.maxCol:
            self.px[c + 1].bump(frameCount)
        if c > 0:
            self.px[c - 1].bump(frameCount)
        self.px[c].bump(frameCount)


class PixelMap:
    maprow = None
    maxRow = -1
    maxCol = -1

    def __init__(self, mapHeight, mapWidth):

        self.maprow = list()
        self.maxRow = mapHeight - 1
        self.maxCol = mapWidth - 1

        for row in range(0, mapHeight):
            self.maprow.append( PixelRow(row, mapWidth) )

        global pixelMap
        pixelMap = self

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
    global pixelMap
    #print( "Getting px(" + str(r) + "," + str(c) + ")" )
    return pixelMap.px(r,c)

def createMap( rows, cols ):
    global pixelMap
    pixelMap = PixelMap( rows, cols )
    return pixelMap

# def testMap():
#     ## The pixel info array ========================================================
#     print("Creating pixel map with 20 rows and 30 cols")
#     pixelMap = createMap( 20, 30 )

#     print ("Created map with "+ str( len( pixelMap.maprow ) ) + " rows and " + str( len( pixelMap.maprow[0].px ) ) + " columns")

#     print ("----------------------------")
#     for r in range(0, 20):
#         line = ""
#         for c in range(0, 30):
#             line +="Y " if px(r, c).showBox else "N "
#         print( line )
#     print ("----------------------------")

#     for n in range(34):
#         pixelMap.bump( 5, 6, 234 )
#         pixelMap.bump( 6, 4, 234 )
#         pixelMap.bump( 0, 0 , 234)
#         pixelMap.bump( 19, 29 , 234)


#     print ("----------------------------")
#     for r in range(0, 20):
#         line = ""
#         for c in range(0, 30):
#             line +=". " if px(r, c).showBox else "# "
#         print( line )
#     print ("----------------------------")

