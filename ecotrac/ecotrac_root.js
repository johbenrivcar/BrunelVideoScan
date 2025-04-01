
const global = require("./ecotrac_global");
/** 
 * The root of the application, responsible for setting up the whole system from scratch and starting the
 * monitoring processes.
*/
const settings = require("./ecotrac_settings");
const log = require("./ecotrac_logger").getLogger("ecotract_root");



let runMode = global.RUN_MODE;
async function run( run_mode ){

    log( "Run mode: " + run_mode )
    load_allCustomers();



}

var allCustomers = null;
var custFolder = null;


function load_allCustomers(){
    log(">> load_allCustomers")
    // module represents the json file
    allCustomers = require("./ecotrac_allCustomers");
    allCustomers.load();

    // module represtent the master customer folder
    custFolder = require("./ecotrac_customerMasterFolder");
    custFolder.load();
}



module.exports.run = run;

console.log("+++> ecotrac_root MODULE LOADED")