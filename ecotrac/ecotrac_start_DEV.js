

// This sets the global variable that points to the root folders for the ecotract
// application data that is manipulated by the application. The data is placed
// on a google drive so that it can accessed directly by Brunel staff. Some customer
// sub-folders are made accessible to customers so that they can upload video 
// files for processing.

// CHANGE GLOBALS TO POINT THE RUN TO DEV, TEST, or PROD locations


const eGlobal = require("./ecotrac_global");
eGlobal.setRunMode("DEV");

let starter = require("./ecotrac_starter")

console.log( "++++++++++++++++++++++++++++++++++++++++++++++++++++")
console.log( '+++++++++++++++ APPLICATION STARTING +++++++++++++++')
console.log( `++ ${ new Date() } ++`)
console.log( "++++++++++++++++++++++++++++++++++++++++++++++++++++")

setImmediate( ()=>{ starter.start() } ) ;

