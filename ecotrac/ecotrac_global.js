/**
 * This is the global variables module that is used througout the application to
 * provide run-time settings and variables that are not modified once set. 
 * The most important setting is the variable ECOTRAC_ROOT_PATH which is set
 * in the _starter module before any data is loaded. The run mode points to a
 * subfolder of ecotract containing the run data and files for a particular
 * run mode (like Dxx.. development, Txx... testing, and Pxx... production)"
 */

/** Before loading anything, we get the run-time parameters from the 
 * user. These parameters indicate the 1) the Git version, which defines which version of
 * ecotrac is being run and 2) the name of the gDrive data folder which contains all the
 * application data - normally this is named after the server on which the system
 * is being run, for ease of partitioning the system to avoid clashes of operation. 
 * The user will start the system by entering 
 *     node ecotrac_starter GITV:T2305 SRVR:Corinth
 */
let GITV, SRVR;
let rtps = process.argv
console.log("rtps",rtps)
rtps.forEach(  (rtp, ix)=>{
    console.log("rtp", rtp)
    let kvp = rtp.split(":", 2);
    
    console.log("kvp", kvp)

    if (kvp.length != 2 ){
        throw new Error("Invalid parameter, must be KEY:value format", rtp);
    };
    let key = kvp[0].toUpperCase();
    let val = kvp[1];
    switch(key){
        case "GITV":
            GITV = val;
            break;
        case "SRVR":
            SRVR = val;
            break;
        default:
            // ignore this parameter
            // throw new Error(`Invalid parameter, [${key}] is not a recognised parameter`, rtp);
    }
})

if(!GITV){
    throw new Error("Must supply GITV parameter")
}

if(!SRVR){
    throw new Error("Must supply SRVR parameter")
}

/**
 * Load the global parameters from the global parameters file
 */
const json = require("./ecotrac_global.json")

/**
 * Get the runtime configuration settings that depend on git version and the server on which it is being run
 */
let configKey = GITV + "+" + SRVR;
let config = json.global.config_list[configKey];
if(!config){
    throw new Error(`Configuration ${configKey} was not found in config list (ecotrac_global.json)`)
}
/* Config example format
            { 
                "mode": "TEST",
                "rootPath": "G:/My Drive/Chorus/Brunel/ecotrac/ecotrac_T01_Desdemona/",
                "gitBranch": "T01_Desdemona/"
            }
*/
let  {mode , gitBranch, basePath , rootFolder } = config




/**
 * Check the git version by checking in the .git/HEAD file
 */

fs = require("fs");

let data = fs.readFileSync('../.git/HEAD', 'utf8');
let xx = data.split("/").pop().trimRight();
if( xx!==GITV ){
    throw new Error(`Mismatch between run version [${GITV}] and source code version [${xx}]`)
}



const utils = require("./ecotrac_utils");
const dts = utils.dts;

const runMode = mode ;
const rootPath = basePath + rootFolder;
let inProd = (runMode.substring(0,1).toUpperCase() == "P")

/**
 * By convention, global settings names are CAPITALISED and considered invariant
 */
module.exports = exports = {
    // config settings for this run
    config
    // These are the default run mode and root path settings, which are overwritten in _starter
    ,RUN_MODE: config.mode 
    // Base location of all the ecotrac data folders
    , ECOTRAC_BASE_PATH: basePath 
    // Root location for the data folders corresponding to a specific RUN_MODE
    , ECOTRAC_ROOT_PATH: rootPath
    , IN_PROD: inProd   
    , IN_TEST: !inProd
    , python: json.python
    , dts
};
bInit = false;
console.log("### global MODULE LOADED - DEFAULT VALUES SET")


// function setRunMode(mode){
//     if(bInit){
//         console.log("_global: Attempt to set run mode twice - not allowed (" + mode + ")");
//         process.exit(101);
//     };

//     bINIT = true;
//     inProd = (mode.substring(0,1).toUpperCase()=="P")
//     console.log("_global: Setting run mode to " + mode + "---------------");

//     exports.RUN_MODE = mode;
//     exports.IN_PROD = inProd ;
//     exports.IN_TEST = !inProd ;
//     exports.ECOTRAC_ROOT_PATH = basePath + "ecotrac_" + mode + "/";
//     console.log("global: ", exports );
//     console.log("--------------------------------------------------------");

//     // Having set the run mode, we can load the _settings module to read settings.json from the root path 
//     require("./ecotrac_settings");

// };