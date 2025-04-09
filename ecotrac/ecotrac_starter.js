
// This is the global variable that points to the root folders for the ecotract
// application data that is manipulated by the application. The data is placed
// on a google drive so that it can accessed directly by Brunel staff. Some customer
// sub-folders are made accessible to customers so that they can upload video 
// files for processing.
const eGlobal = require("./ecotrac_global");

let run_mode = eGlobal.RUN_MODE ;

// -------------------------------------------------------


const log = require("./ecotrac_logger").getLogger("ecotrac_starter");
log("### _starter MODULE LOADING")

module.exports.start = start;
log ("### ecotrac_starter MODULE READY FOR RUN: Mode=" + run_mode );


function start(){
        
    let settings = require("./ecotrac_settings");

    console.clear
    log("*********************************************");
    log("*");
    log("*");
    log("* ECOTRAC STARTING IN ["+ run_mode + "] MODE ***");
    log("*");
    log("*");
    log("*********************************************");
    
    root = require("./ecotrac_root");
    // root.start is an async function that kicks off the application load and runs
    // the application.
    setImmediate( ()=>{ root.run(run_mode) } )

    console.log("** Root about to run in " + run_mode + " . . . . ");
    console.log("** with root path set to " + eGlobal.ECOTRAC_ROOT_PATH); 

}

