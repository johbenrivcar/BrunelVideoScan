/**
 * Represents the storage of all the customers of the system with access to customer folders and
 * functions that act on those folders.
 */

const fs = require("fs");
const global = require("./ecotrac_global");
const utils = require("./ecotrac_utils");

// FOR TESTING ONLY
global.RUN_MODE = "DEV"
global.ECOTRAC_ROOT_PATH = "G:/My Drive/Chorus/Brunel/ecotrac/DEV/";

const settings = require("./ecotrac_settings");
//const { get } = require("http");
const log = require("./ecotrac_logger").getLogger("ecotrac_allCustomers")

const orderFolder = require("./ecotrac_orderFolder");
log( "orderFolder", orderFolder );


const getStateAndKeyFromFolderName = utils.getStateAndKeyFromFolderName;

const Customer = require("./ecotrac_customer")
const newCustomer = Customer.newCustomer;

log("Loading customer json:");
let allCustomersJSONPath = settings.ecotracRootPath + settings.paths.dataFolder + "customers.json"
const allCustData = require(allCustomersJSONPath)
log("allCustData:", allCustData)

const allCustomers = {};

// get a reference to the customer folder

//customerMasterFolder = require("./ecotrac_customerMasterFolder");



function foundFolder(email, folderPath){
    log( "foundFolder", email, folderPath);
    // get the customer record from the customer data
    cust = allCustData[email]
    if(!allCustData[email]){
        log("no customer data for that folder")
        let nc = new newCustomer();
        nc.buildFromFolder(email, folderPath);
        return;
    }
    log("Customer record found for folder..")

    
}
module.exports.foundFolder = foundFolder;


function load_allCustomers(){
    log(">>load_allCustomers()")
    let custKeys = Object.keys(allCustData);
    custKeys.forEach( (key, ix)=>{
        custData = allCustData[key];
        let customer = newCustomer().loadFromDataFile(custData);
        allCustomers[key]=customer;

    })
    saveAllCustomersJSON();
};
module.exports.load = load_allCustomers;

function getCustomer(email){
    let cc = allCustomers[email];
    if(!cc){
        cc = newCustomer(email);
    }
}


module.exports.getCustomer = getCustomer;

function saveAllCustomersJSON(){
    let oldJSON = JSON.stringify( allCustData, null, 3 );
    let fileNameBackup = allCustomersJSONPath + "_" + global.dts();
    fs.writeFile(fileNameBackup, oldJSON );

    let allCustData = Object.assign( {}, allCustomers) ;

    let newJSON = JSON.stringify( allCustData, null, 3 );
    fs.writeFile(allCustomersJSONPath, newJSON );

    

}



console.log("gsak", getStateAndKeyFromFolderName);

log("TESTING")
log( getStateAndKeyFromFolderName("asdlkjas") )
log( getStateAndKeyFromFolderName("mma.oasid") )
log( getStateAndKeyFromFolderName("asdfalskdfj.anything") )
log( getStateAndKeyFromFolderName("mma_oasid.ProCeSSed") )
log( getStateAndKeyFromFolderName("mma.oasid.processing") )
log( getStateAndKeyFromFolderName("mma.oasid.ready") )