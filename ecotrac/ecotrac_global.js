/**
 * This is the global variables module that is used througout the application to
 * provide run-time settings and variables that are not modified once set. 
 * The most important setting is the variable ECOTRAC_ROOT_PATH which is set
 * in the _starter module before any data is loaded. The run mode points to a
 * subfolder of ecotract containing the run data and files for a particular
 * run mode (like Dxx.. development, Txx... testing, and Pxx... production)"
 */
const json = require("./ecotrac_global.json")
const utils = require("./ecotrac_utils");
const dts = utils.dts;

const basePath = json.global.base_path ;
const runMode = json.global.default_mode ;
const rootPath = basePath + "ecotrac_" + runMode + "/";
let inProd = (runMode.substring(0,1).toUpperCase == "P")

/**
 * By convention, global settings names are CAPITALISED and considered invariant
 */
module.exports = exports = {
    // These are the default run mode and root path settings, which are overwritten in _starter
    RUN_MODE: runMode 
    // Base location of all the ecotrac data folders
    , ECOTRAC_BASE_PATH: basePath 
    // Root location for the data folders corresponding to a specific RUN_MODE
    , ECOTRAC_ROOT_PATH: rootPath
    , IN_PROD: inProd   
    , IN_TEST: !inProd
    , python: json.python
    , dts
    , setRunMode
};
bInit = false;
console.log("### global MODULE LOADED - DEFAULT VALUES SET")


function setRunMode(mode){
    if(bInit){
        console.log("_global: Attempt to set run mode twice - not allowed (" + mode + ")");
        process.exit(101);
    };

    bINIT = true;
    inProd = (mode.substring(0,1).toUpperCase()=="P")
    console.log("_global: Setting run mode to " + mode + "---------------");

    exports.RUN_MODE = mode;
    exports.IN_PROD = inProd ;
    exports.IN_TEST = !inProd ;
    exports.ECOTRAC_ROOT_PATH = basePath + "ecotrac_" + mode + "/";
    console.log("global: ", exports );
    console.log("--------------------------------------------------------");

    // Having set the run mode, we can load the _settings module to read settings.json from the root path 
    require("./ecotrac_settings");

};