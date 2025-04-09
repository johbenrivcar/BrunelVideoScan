

// This sets the global variable that points to the root folders for the ecotract
// application data that is manipulated by the application. The data is placed
// on a google drive so that it can accessed directly by Brunel staff. Some customer
// sub-folders are made accessible to customers so that they can upload video 
// files for processing.

// Points to different gDrive locations depending on which mode_server combination
// is being selected. The selection comes from run-time parameters entered by the
// user. The locations of the correct gDrive to use is given in the ecotrac_global.json
// parameter file.
//


const eGlobal = require("./ecotrac_global");
eGlobal.setRunMode("DEV");

let starter = require("./ecotrac_starter")

console.log( "++++++++++++++++++++++++++++++++++++++++++++++++++++")
console.log( '+++++++++++++++ APPLICATION STARTING +++++++++++++++')
console.log( `++ ${ new Date() } ++`)
console.log( "++++++++++++++++++++++++++++++++++++++++++++++++++++")

process.exit(233)

setImmediate( ()=>{ starter.start() } ) ;

