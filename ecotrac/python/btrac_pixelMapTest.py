
#We always output 1280x720, scaling the video frames to that size whatever the input frame size.
outputFrameWidth = 20 
outputFrameHeight = 10 

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
        if row == 3:
            self.report("init")

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

        if row < 10:  
            print( "Map row " + str(row) + " has been created")

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
            print("  Creating pixelRow #" + str(row))
            self.maprow[row] = PixelRow(row, mapWidth) 

        print("Finished construction, reporting row 5 >>>>>>>>>")
        for col in range( 0, mapWidth ):
            print( "   Row 5: Col " + str(col) + " pixel: ") 
            self.px(5, col).report("mapInit")


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

exit( 999 )
