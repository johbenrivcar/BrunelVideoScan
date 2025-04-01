/** 
* This module is used throughout the app to get settings that may change depending on the configuration of the system
 */


const eGlobal = require("./ecotrac_global");
const fs = require("fs");

/**
 * The system level settings are stored in the file ecotracRootPath/settings.json
 * 
 * 
 */

// The root path is an application global setting that points to the root folder containing
// all the application data needed for operation. Normally
if(!eGlobal.ECOTRAC_ROOT_PATH){
  console.log("SETTINGS WARNING _ Root path must be set by ecotrac_run before loading settings");
  console.log("SETTINGS WARNING _ Defaulting to DEV root path");
  eGlobal.RUN_MODE = "DEV"
  eGlobal.ECOTRAC_ROOT_PATH = "G:/My Drive/Chorus/Brunel/ecotrac/DEV/";
}

// Load the settings JSON file
const settings = require( eGlobal.ECOTRAC_ROOT_PATH + "settings.json" );

function get(sPath){
    pp = sPath.split(".");
    op = settings;
    pp.forEach( (p, index)=>{
        op = op[p]
        if (!op ) return null;
    } )
    return op
};

// Export the settings object so that it can be accessed directly in code if required
settings.ecotracRootPath = eGlobal.ECOTRAC_ROOT_PATH;
settings.get = get;

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


settings.saveSettings = saveSettings;

module.exports = settings;
//const log = require("./ecotrac_logger").getLogger("ecotrac_settings")
console.log("###> settings Module loading");
console.log("~~~~~~~~~Settings\n", settings)
console.log("+++> settings MODULE LOADED")