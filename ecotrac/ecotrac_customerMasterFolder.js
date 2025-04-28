/**
 * Represents the folder that contains all the customer's folders. These are the folders into which the customer
 * can load vidoes for processing.
 */
var bINIT = false;
const eGlobal = require("./ecotrac_global");
const settings = require("./ecotrac_settings");
const allCustomers = require("./btrac_allCustomers");

const fs = require("fs");
const paths = settings.paths;
 
const log = require("./ecotrac_logger").getLogger("eoctrac_customerMasterFolder");
log("###> LOADING MODULE")
log("Settings on entry to _customerMasterFolder: ", settings)
const customerMasterFolderPath = settings.customersFolderFullPath;

const customerNamePrefix = settings.customers.customerNamePrefix;
const pfxLen = customerNamePrefix.length;

module.exports.load = load;
module.exports.INIT = INIT;



// get the list of all the folders in the path and update the customer record
function load(){
    log("Connecting to the customer master folder at " + customerMasterFolderPath )
    const theCMFContents  = fs.readdirSync(customerMasterFolderPath).sort();
    theCMFContents.forEach((folderName, ix)=>{
        if(folderName.substring(0, pfxLen) == customerNamePrefix ){
            custEmail = folderName.substring(pfxLen);
            log("Found customer " + custEmail);
            // Now check if we have that customer in the customer list.
            allCustomers.foundFolder( custEmail, customerMasterFolderPath + folderName )
        }
    });
};

function folderEvent( eventData ){

}

function INIT(){
    if(bINIT) return;
    bINIT = true;
    load();
}

log("### MODULE LOADED");