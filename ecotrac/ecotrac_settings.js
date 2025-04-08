/** 
* This module is used throughout the app to get settings that may change depending on the configuration of the system
 */

const eGlobal = require("./ecotrac_global");
const fs = require("fs");

console.log("###> _settings Module loading");
/**
 * The system level settings are stored in the file ecotracRootPath/settings.json
 */

// The root path is an application global setting that points to the root folder containing
// all the application data needed for operation. Normally
if(!eGlobal.ECOTRAC_ROOT_PATH){
  console.log("SETTINGS FAILED _ Root path must be set!");
  process.exit(102)
}

const rootPath = eGlobal.ECOTRAC_ROOT_PATH 
// Load the settings JSON file
const settings = require( rootPath + "settings.json" );


// Export the settings object so that it can be accessed directly in code if required
settings.ecotracRootPath = rootPath;
settings.customersFolderFullPath = rootPath + settings.paths.customersFolder;
settings.get = get;
settings.saveSettings = saveSettings;

module.exports = exports = settings;

function get(sPath){
    pp = sPath.split(".");
    op = settings;
    pp.forEach( (p, index)=>{
        op = op[p]
        if (!op ) return null;
    } )
    return op
};

function saveSettings(){
  sSettingsJSON = JSON.stringify( settings, null, 4 );
  fs.writeFile(outputLocation, sSettingsJSON, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("JSON saved to " + outputLocation);
      }
  });

}

//const log = require("./ecotrac_logger").getLogger("ecotrac_settings")
console.log("~~~~~~~~~Settings\n", settings)
console.log("+++> _settings MODULE LOADED")