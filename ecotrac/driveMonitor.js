fs = require("node:fs")
fsP = require("node:fs/promises")
settings = require("./ecotrac_settings");
log = require("./logger").getLogger("driveMonitor");

var customerDictNeedsSaving = false;


const ecotracRootName = "G:/My Drive/Chorus/Brunel/ecotrac/";
let customerInfo = require( ecotracRootName + "data/customers.json");
const paths = settings.paths
const allCustomersFolder = ecotracRootName + paths.customersFolder

const customerNamePrefix = paths.customerNamePrefix;
const submitFolder = paths.submitFolder;
const scannedFolder = paths.scannedFolder;
const reportsFolder = paths.reportsFolder;

customerDict = {}

function newCustomer(email){
    let cust = {
        ot: "customer"
        , email
        , root: allCustomersFolder + customerNamePrefix + email + "/"
    }
    
    cust.submitPath = cust.root + submitFolder;
    cust.scannedPath = cust.root + scannedFolder;
    cust.reportsPath = cust.root + reportsFolder;

    log("Customer:", cust)
    customerDict[email] = cust
    customerDictNeedsSaving = true;
    return cust;

}




// let testCust = newCustomer("charles@brunelbrands.com");
// .og("Customer list:", customerDict )

// log("Folder to monitor is", testCust.submitPath );
// fs.watch(testCust.submitPath,  submitFolderEvent)
// log("Monitoring....")
    

// The submit folder contains only customer folders into which customers can submit their files for processing
// CustomerMaster_Brunel
async function submitFolderEvent( eventType, filename ){
    log("* Folder event: ", eventType, " on folder ", filename );
}

const allSubmissions = {};

async function monitorCustomer(email){
    let customer = customerDict[email];
    if( !customer ){ customer = newCustomer(email); }

    let customerSubmitFolder = customer.submitPath

    try{
        fs.watch( customerSubmitFolder , (eventType, fileName)=>{
            // in this function we are going to handle an event that occurred on the customers submit folder
            // to see if we need to do anything.
            log("Checking "+ customerSubmitFolder + fileName);
            stats = fs.statSync( customerSubmitFolder + fileName );
            isDir = stats.isDirectory();
            if(isDir){
                // Set up monitoring of the folder to check that it is completely loaded before using
                
            }

        })
    } catch(e) {
        log("Error when setting up watch on customer folder " + customerSubmitFolder )
        log( e )
    }

    
}

/** This is the main monitoring function.
 * 1. Get a list of all the customer folders in the root folder
 * 2. Crate a new customer watch process for any new customer folders that are created
 * 3. Check for already-existing orders in each cusomter folder and start the scanning process for any that are ready
 * 4. Create an order watch process for each customer folder to check for new incoming orders
 */

async function setUpMainMonitoringProcess(){
    // get hold of the root
    try{
        files = await fsP.readdir( allCustomersFolder)
        log("All customer master folders:")
        files.forEach( (file, index)=>{
            log(file);
        })
    } catch(e){
        log(" Error on opening customer master folder "+ allCustomersFolder);
        log(e)
    }
        
    


}

setUpMainMonitoringProcess();

console.log("##> driveMonitor MODULE LOADED")