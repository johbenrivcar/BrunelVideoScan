import json

python = settingsJSON = {}

# Read in the global json file and get the python settings
with open('../ecotrac/ecotrac_global.json') as sss:
    eGlobal = json.load(sss)
    settingsJSON = eGlobal["python"]
    settingsJSON["app_name"] = eGlobal["global"]["app_name"]


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

path = "colours"

print( path, getSetting(path) )

