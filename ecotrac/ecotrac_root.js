
/** 
 * The root of the application, responsible for setting up the whole system from scratch and starting the
 * monitoring processes.
*/


exports.run = run;


const eGlobal = require("./ecotrac_global");
// Not used?
const settings = require("./ecotrac_settings");
//


const log = require("./ecotrac_logger").getLogger("_root");

const customer = require("./ecotrac_customer")
const customerMasterFolder = require("./ecotrac_customerMasterFolder")

require("./ecotrac_events")
require("./ecotrac_monitorCustomerFolder")
require("./ecotrac_utils")


const allCustomers = require("./ecotrac_allCustomers")


async function run(  ){

    log( "Run mode: " + eGlobal.RUN_MODE );
    
    customer.INIT();
    customerMasterFolder.INIT();
    allCustomers.INIT();

    load_allCustomers();

}

//var allCustomers = null;
//var custFolder = null;
//

function load_allCustomers(){
    log(">> load_allCustomers")
    // module represents the json file
    //allCustomers = require("./ecotrac_allCustomers");
    allCustomers.load();

}


console.log("+++> ecotrac_root MODULE LOADED")

