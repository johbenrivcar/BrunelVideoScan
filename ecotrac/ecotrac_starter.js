
// This is the global variable that points to the root folders for the ecotract
// application data that is manipulated by the application. The data is placed
// on a google drive so that it can accessed directly by Brunel staff. Some customer
// sub-folders are made accessible to customers so that they can upload video 
// files for processing.
const global = require("./ecotrac_global");
let run_mode = global.RUN_MODE 
global.ECOTRAC_ROOT_PATH = "G:/My Drive/Chorus/Brunel/ecotrac/" + run_mode + "/";



// CHANGE THIS TO POINT THE RUN TO DEV, TEST, and PROD locations

function start(){
        
    let settings = require("./ecotrac_settings");

    console.clear
    console.log("*********************************************");
    console.log("*");
    console.log("*");
    console.log("* ECOTRAC STARTED IN "+ run_mode + " MODE ***************");
    console.log("*");
    console.log("*");
    console.log("*********************************************");
    
    root = require("./ecotrac_root");
    // root.start is an async function that kicks off the application load and runs
    // the application.
    root.run(run_mode)

}
module.exports.start = start;
console.log ("### ecotrac_starter MODULE LOADED IN " + run_mode );