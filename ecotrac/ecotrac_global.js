/**
 * This is the global variables module that is used througout the application to
 * provide run-time settings and variables that are not modified once set. 
 * 
 */

/** Before loading anything, we get the run-time parameters from the 
 * user. These parameters indicate 
 * 1) the Git version, which defines which version of ecotrac is being run 
 * 2) the name of the gDrive data folder which contains all the
 *    application data - normally this is named after the server on which the system
 *    is being run, for ease of partitioning the system to avoid clashes of operation. 
 * 
 * For example, the administrator will start the system by entering 
 *     node ecotrac_starter "GITV:T2305" "SRVR:Corinth"
 * 
 * indicating that the system is running version T2305 of the code on the server 
 * named Corinth.
 * 
 * The global module will find settings for this particular combination of GITV and SRVR in the
 * ecotrac_global.json file:
 * 1) The path to the Google Drive data root that contain the application data folders
 * 2) The application data subfolder within the Google Drive root to be used for this 
 *     code version on this server
 * 3) The GIT branch of the code to be run, which must match the GITV parameter
 * 4) A mode flag to indicate if this is Development, Test or Production configuration
 * 5) The name of the server, which must match the SRVR parameter
 * 
 * If any of the configuration variables are inconsistent, the run will be aborted with and
 * error message.
 *
 * So, whenever a new GIT branch of the application code is made, a new entry must be made in
 * the ecotrac_global.json file which provides these configuration settings for every server that
 * the code will be run on. Provided that the coniguration settings are managed with care, this
 * will avoid the application being run on the wrong server or with the wrong version of the code. 
 */

// Variables for runtime parameters
let GITV, SRVR;

// Variables for parameters to come from global.json
let mode , gitBranch, rootFolder, server, basePath
let config
let json

// Get the runtime parameters
let rtps = process.argv
// console.log("rtps",rtps)

// Run through each of the run time parameters to get the values
try{
    rtps.forEach(  (rtp, ix)=>{
    let kvp = rtp.split(":", 2);
    
    // console.log("kvp", kvp)

    if (kvp.length == 2 ){
   
        let key = kvp[0].toUpperCase();
        let val = kvp[1];
        switch(key){
            case "GITV":
                console.log("rtp", rtp)
                GITV = val;
                break;
            case "SRVR":
                console.log("rtp", rtp)
                SRVR = val;
                break;
            default:
                //console.log("  >Ignored")
                // ignore this parameter
                // throw new Error(`Invalid parameter, [${key}] is not a recognised parameter`, rtp);
        } 
    };
    });

    if(!GITV){
        throw new Error("Must supply GITV parameter")
    }

    if(!SRVR){
        throw new Error("Must supply SRVR parameter")
    }

    /**
     * Load the global parameters from the global parameters file
     */
    json = require("./ecotrac_global.json")

    /**
     * Get the runtime configuration settings that depend on git version and the server on which it is being run
     */

    basePath = json.global.dataPath_perServer[SRVR];
    /* BasePath example format
            "dataPath_perServer":{
                "Desdemona": "G:/My Drive/Chorus/Brunel/ecotrac/",
                "Corinth": "J:/JohBenRivCarGoogleDrive/Chorus/Brunel/ecotrac/"
            }
    */

    let configKey = GITV + "+" + SRVR;
    config = json.global.config_perGitvServer[configKey];

    /* Config example format
            "config_perGitvServer":{
                "D03+Desdemona":{ 
                    "mode": "DEV",
                    "rootFolder": "ecotrac_D03_Desdemona/",
                    "gitBranch": "D03",
                    "server": "Desdemona"
                }
            }
    */
    if(!basePath){
        throw new Error(`DataPath entry for server ${SRVR} was not found in config file (ecotrac_global.json)`)
    }

    if(!config){
        throw new Error(`GitVersion+Server combination ${configKey} was not found in config file (ecotrac_global.json)`)
    }

    mode = config.mode;
    gitBranch = config.gitBranch;
    rootFolder = config.rootFolder;
    server = config.server;

    if(GITV != gitBranch){
        throw new Error(`Run-time GitVersion ${GITV} does not match version ${gitBranch} in configuration entry for ${configKey} in config file (ecotrac_global.json)`)
    };

    if(SRVR != server){
        throw new Error(`Run-time Server ${SRVR} does not match server ${server} in configuration entry for ${configKey} in config file (ecotrac_global.json)`)
    };


    /**
     * Check the git version by checking in the .git/HEAD file
     */

    fs = require("fs");

    let data = fs.readFileSync( require.resolve('../.git/HEAD'), 'utf8');
    let runningSourceVersion = data.split("/").pop().trimRight();
    if( runningSourceVersion!==GITV ){
        throw new Error(`Mismatch between expected run-time version [${GITV}] and actual source code version [${runningSourceVersion}]`)
    }

} catch(err) {
    console.log(err )
    process.exit(342)
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

console.log("### global MODULE LOADED - DEFAULT VALUES SET")

// bInit = false;
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