/**
 * Represents the storage of all the customers of the system with access to customer folders and
 * functions that act on those folders.
 */


exports.foundFolder = foundCustomerFolder;
exports.load = load;
exports.getCustomer = getCustomer;
exports.INIT = INIT;


var bINIT = false;
const fs = require("fs");

const utils = require("./ecotrac_utils");
const eGlobal = require("./ecotrac_global");
const settings = require("./ecotrac_settings");
const customer = require("./ecotrac_customer");
const newCustomer = customer.newCustomer;


const log = require("./ecotrac_logger").getLogger("_allCustomers")
log("### MODULE LOADING STARTED");

const allCustomersJSONPath = eGlobal.ECOTRAC_ROOT_PATH + settings.paths.dataFolder + "customers.json"
var allCustData = {};
const allCustomers = {};

log(" -- Path is " + allCustomersJSONPath );
log("### MODULE LOADING COMPLETE");


function INIT(){
    
    if(bINIT) return;
    bINIT = true;

    customer.INIT();

    log(">>INIT");


    let cd = require(allCustomersJSONPath)
    Object.assign(allCustData, cd);
    log("allCustData:", allCustData);
    log("<<INIT");

}

function load(){
    log(">>.load()")
    // get the customer record keys from the JSON data
    let custKeys = Object.keys(allCustData);
    // creating customer entries in allCustData
    custKeys.forEach( (key, ix)=>{

        custData = allCustData[key];
        let customer = newCustomer()
        log("Created empty customer record ")
        log( customer );
        if(!customer.startMonitoringCustomer){
            log("Could not find monitoring function");
        } else log("Monitoring function was found");
        customer.loadFromDataFile(custData);
        log("Loaded data from custData json" + key)
        log( customer );
        if(!customer.startMonitoringCustomer){
            log("Could not find monitoring function");
        } else log("Monitoring function was found");

        allCustomers[key]=customer;
    })

    let ccc1 = allCustomers["charles@brunelbrands.com"];
    if( ccc1.startMonitoringCustomer ) { log(" After load, Monitor function was found" ) } else { log("After load, Monitor function not found")}


    saveAllCustomersJSON();

};



function foundCustomerFolder(email, folderFullPath){
    log( ".foundCustomerFolder", email, folderFullPath);

    // get the customer record from the customer data
    let cust = allCustomers[email]
    // Does the customer already exist?
    if(!cust){
        // No, so create a new customer folder
        log("no customer data for that folder")
        cust = customer.newCustomer();
        // check
        log("new cust raw", cust)
        cust.buildFromFolder(email, folderFullPath);
        allCustomers[email]=cust;

        log("updated from folder", cust)

        setImmediate( ()=>{cust.startMonitoringCustomer();} );
        return cust;
    }
    log("Customer record found for folder..")
    return cust;
    
}

function getCustomer(email){
    let cc = allCustomers[email];
    if(!cc){
        cc = newCustomer(email);
    }
}



function saveAllCustomersJSON(){
    log(">> saveAllCustomersJSON (which also saves old customer JSON to backup)");

    let ccc1 = allCustomers["charles@brunelbrands.com"];
    if( ccc1.startMonitoringCustomer ) { log(" Monitor function was found" ) } else { log("Monitor function not found")}

    // Get the old JSON from the allCustData object
    let oldJSON = JSON.stringify( allCustData, null, 3 );
    let fileNameBackup = allCustomersJSONPath + "_" + utils.dts() + ".json";
    fs.writeFileSync(fileNameBackup, oldJSON );

    // Create a copy of all the customer data from the array of all customers
    allCustData = Object.assign( {}, allCustomers) ;

    // Create the JSON string from all that data
    let newJSON = JSON.stringify( allCustData, null, 3 );

    // Write the new JSON to the customers.json file
    fs.writeFileSync(allCustomersJSONPath, newJSON );

    // Check the Customer data
    log(" allCustomers:"); log( allCustomers )
    let ccc2 = allCustomers["charles@brunelbrands.com"];
    if( ccc2.startMonitoringCustomer ) { log(" Monitor function was found" ) } else { log("Monitor function not found")}
    log("<< saveAllCustomersJSON");
    //process.exit(3223)

}

