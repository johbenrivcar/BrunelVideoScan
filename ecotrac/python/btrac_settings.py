
import json

python = settingsJSON = {}

# Read in the global json file and get the python settings
with open('../ecotrac_global.json') as sss:
    eGlobal = json.load(sss)
    settingsJSON = eGlobal["python"]
    settingsJSON["app_name"] = eGlobal["global"]["app_name"]

print("global.python", settingsJSON )

# This function returns the value of a setting given the path to the setting
# in the form "a.b.c.d" etc
def getSetting(sPath):
  
    pp = sPath.split(".")
    op = settingsJSON
    for p in pp:
        op = op[p]   
        while type(op) == str:
            if not (op[0:1]==">"):
                break
            op = getSetting( op[1:] )

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


