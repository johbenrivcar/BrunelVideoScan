
import json

settingsJSON = {}

# Read in the global json file and get the python settings
with open('ecotrac_global.json') as sss:
    gg = json.load(sss)
    settingsJSON = gg["python"]


print("Settings", settingsJSON )

def getSetting(sPath):
  
    pp = sPath.split(".")
    op = settingsJSON
    for p in pp:
        op = op[p]
    return op

def settings():
   return settingsJSON

def repeat( char, count ):
    x = ""
    for n in range(count):
        x = x + char
    return x


def reportDict(dict, indent="  "):
    
    for x in dict:
        val = dict[x]
        valType = str( type(val) )
        if valType=="<class 'dict'>":
            print(indent + ">", x)
            reportDict( val , repeat(" ", len(indent)) + "  ")
        else:
            print( indent, x + ":", val)


print("Settings -----------------")
reportDict(settingsJSON)
print("--------------------------")


