/** 

* This module is used throughout the app to get settings that may change depending on the configuration of the system
 */


fs = require("fs");
log = require("./logger").getLogger("ecotracSettings")

const ecotracRootPath = "G:/My Drive/Chorus/Brunel/ecotrac/";

/**
 * The system level settings are stored in the file ecotracRootPath/data/settings.json
 * 
 * 
 */

const settings = require( ecotracRootPath + "data/settings.json" );


module.exports = settings;

function get(sPath){
    
  
    pp = sPath.split(".");

    op = settings

    pp.forEach( (p, index)=>{
        
        op = op[p]
        if (!op ) return null;
    } )

    return op
}

exports.ecotracRootPath = ecotracRootPath;
exports.get = get;



log("settings", settings)
console.log("+++> ecotracSettings MODULE LOADED")