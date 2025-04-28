

// This sets the global variable that points to the root folders for the ecotract
// application data that is manipulated by the application. The data is placed
// on a google drive so that it can accessed directly by Brunel staff. Some customer
// sub-folders are made accessible to customers so that they can upload video 
// files for processing.

// CHANGE GLOBALS TO POINT THE RUN TO DEV, TEST, or PROD locations

const eGlobal = require("./ecotrac_global");
const settings = require("./ecotrac_settings");

console.log( "++++++++++++++++++++++++++++++++++++++++++++++++++++")
console.log( '+++++++++++++++ APPLICATION STARTING +++++++++++++++')
console.log( `++ ${ new Date() } ++`)
console.log( "++++++++++++++++++++++++++++++++++++++++++++++++++++")

// using setImmediate ensures that all the modules that are needed
// have fully loaded and initialised before the start function runs
setImmediate( ()=>{ start() } ) ;


async function start(){
                
    let log = require("./ecotrac_logger").getLogger("ecotrac_start");
    log("### _starter MODULE LOADING")


    let run_mode = eGlobal.RUN_MODE ;
    let server = eGlobal.config.server;
    let gitBranch = eGlobal.config.gitBranch;

    console.clear
    log("*********************************************");
    log("*");
    log("*");
    log("* ECOTRAC STARTING IN ["+ run_mode + "] MODE ***");
    log("*");
    log("*");
    log("*********************************************");
    
    console.log("** Root ready to run in mode:     " + run_mode + " . . . . ");
    console.log("** Using ecotrac code git branch: " + gitBranch);
    console.log("** Running on server:             " + server );
    console.log("** Root path set to               " + eGlobal.ECOTRAC_ROOT_PATH); 

    

    // root.run is an async function that kicks off the application load and runs
    // the application.
    let root = require("./ecotrac_root");
    setImmediate( ()=>{ root.run(run_mode) } )


}
