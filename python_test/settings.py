import json
settingsJSON = None
with open('settings.json') as sss:
  settingsJSON = json.load(sss)

print("Settings", settingsJSON )

def getSetting(sPath):
  return "aaas"


