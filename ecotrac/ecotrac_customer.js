


/**
 * Represents a customer as saved to the customer.json file, and for whom there may be a customer folder
 * corresponding to their email address
 */
const global = require("./ecotrac_global")
console.log(">> ecotrac_customer LOADING STARTED")
const log = require("./ecotrac_logger").getLogger("ecotrac_Customer")



class ecoCustomer{
    constructor( email, folderPath ){
        this.orders = {};
        this.ready = {};
        this.processing = {};
        this.processed = {};
        this.reports = {}
        this.folderPath = null;
        this.email = null;
        if(email){
            this.email = email
        } 
        if (folderPath){
            this.folderPath = folderPath
        }
    }
    loadFromDataFile(custData){
        log("Loading from cust data", custData )
        this.email = custData.email;
        this.orders = custData.orders;
        this.ready = custData.ready;
        this.processing = custData.processing;
        this.processed = custData.processed;
        this.reports = custData.reports;
        this.custFolder = custData.custFolder;
        // set all the order states to "old"
        this.orders.forEach( (order, ix)=>{
            order.state = "old";
        })
        // check for folders on the customer folder area
    };
    buildFromFolder(email, folderPath){
        // we have found a folder for a previously non-existent customer
        this.email = email;
        this.custFolder = folderPath;
        let folders = fs.readdirSync( this.custFolder );
        folders.forEach( (folder, ix)=>{
            stat = fs.statSync( this.custFolder + "/" + folder );
            if(stat.isDirectory()){
                // designate this as an order folder
                /*
                    "order_23482098": {
                            "state": "new"
                            , "folder": "order_23482098"
                            , "orderGB": 25
                            , "fileCount": 0
                            , "fileGB": 0.0
                            , "totalVideoMins": 0.0
                            , "scanCpuSecs": 0
                            , "scanTimeTaken": 0
                        } */
                let order = {
                    state: "new"
                    , folder
                    , orderGB: 0
                    , fileCount: 0
                    , fileGB: 0
                    , totalVideoMins: 0.0
                    , scanCpuSecs: 0
                    , scanTimeTaken: 0
                    
                }
                let pts = folder.split("_");
                let {state, key} = getStateAndKeyFromFolderName(folder);
                order.state = state;
                order.key = key;
                this.orders[key]=order;
            }
        })
        log("Order built from folder information:", order)
    }

    startMontoringCustomer(){
        let targetFolder = this.folderPath;
        this.watch = fs.watch( targetFolder, (eventType, itemName )=>{
            // we are looking for folder activity only
            stat = fs.statSync( itemName );
            if(! stat.isDirectory() ) return;
            let {key, state} = getStateAndKeyFromFolderName(itemName);
            if(state="ready"){
                let order = this.orders[key];
                
            }

        })
    }
}

function newCustomer(){
    return new ecoCustomer();
}


module.exports.newCustomer = newCustomer
module.exports.Customer = ecoCustomer

console.log("### ecotrac_customer MODULE LOADED ")