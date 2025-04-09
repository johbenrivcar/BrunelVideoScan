
// This sets the global variable that points to the root folders for the ecotract
// application data that is manipulated by the application. The data is placed
// on a google drive so that it can accessed directly by Brunel staff. Some customer
// sub-folders are made accessible to customers so that they can upload video 
// files for processing.


// CHANGE THIS TO POINT THE RUN TO DEV, TEST, or PROD locations

const eGlobal = require("./ecotrac_global");
eGlobal.setRunMode("T01_Corinth");

let starter = require("./ecotrac_starter")

console.log( "++++++++++++++++++++++++++++++++++++++++++++++++++++")
console.log( "+++++++++++++++ APPLICATION STARTING +++++++++++++++")
console.log( "++++++++++++++++++++++++++++++++++++++++++++++++++++")

setImmediate( ()=>{ starter.start() } ) ;

