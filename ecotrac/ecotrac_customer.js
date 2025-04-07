/**
 * Represents a customer as saved to the customer.json file, and for whom there may be a customer folder
 * corresponding to their email address
 */

var bINIT = false;

exports.INIT = INIT;
exports.newCustomer = newCustomer;


//const global = require("./ecotrac_global");

const settings = require("./ecotrac_settings");
const customersFolderFullPath = settings.customersFolderFullPath;
const scanner = require("./ecotrac_scanner");

//const paths = settings.paths;

const utils = require("./ecotrac_utils");
const log = require("./ecotrac_logger").getLogger("ecotrac_customer");
const customerLogger = require("./ecotrac_customerLogger")

const monitor = require("./ecotrac_monitorCustomerFolder");


log("#### MODULE LOAD STARTED");




class ecoCustomer{
    constructor( email, folderPath ){
        this.log = customerLogger.getCustomerLog( email )
        this.orderFolders = {};
        this.email = null;
        if(email){
            this.email = email
        } 
        if (folderPath){
            this.folderPath = folderPath
        }
    };

    loadFromDataFile(custData){
        log("Loading from cust data", custData )
        this.email = custData.email;
        this.orderFolders = custData.orderFolders;
        this.custFolder = custData.custFolder;
        // set all the order states to "old"
        let keys = Object.keys(this.orderFolders)
        keys.forEach( (key, ix)=>{
            let order = this.orderFolders[key];
            order.state = "old";
            //log("Updated order", order)
        });

        // scan for folders in the customer folder area
        // to make sure all state information is up-to-date
        this.updateOrderFolders();

        return this;
    };

    /**
     * runs through all the order folders in the customers folder to 
     * update the customer record with latest information.
     */
    updateOrderFolders(){
        log("Scanning order folders for " + this.custFolder )
        let fullFolderPath = customersFolderFullPath  + this.custFolder;

        let orderFolders = fs.readdirSync( fullFolderPath );

        orderFolders.forEach( (folder, ix)=>{
            
            let stat = fs.statSync( fullFolderPath + "/" + folder );
            if(stat.isDirectory()){
                // designate this as an order folder
                /*
                    
                "order_23482098": {
                    "state": "old",
                    "key": "order_23482098",
                    "folderName": "order_23482098",
                    "orderGB": 25,
                    "fileCount": 0,
                    "fileGB": 0,
                    "totalVideoMins": 0,
                    "scanCpuSecs": 0,
                    "scanTimeTaken": 0

                } */

                let {state, key} = utils.getStateAndKeyFromFolderName(folder);
                let orderFolder = this.orderFolders[key];

                if(orderFolder){
                    orderFolder.state = state;
                    orderFolder.folderName = folder;

                } else {

                    orderFolder = {
                        state
                        , key
                        , folderName: folder
                        , orderGB: 25 // default order size
                        , fileCount: 0
                        , fileGB: 0
                        , totalVideoMins: 0.0
                        , scanCpuSecs: 0
                        , scanTimeTaken: 0
                        
                    };
                    this.orderFolders[key]=orderFolder ;
                }
                // Check if this orderFolder is ready to be processed
                if( orderFolder.state == "ready"){
                    if(! orderFolder.scanInProcess ){
                        log("Starting the scanning process on " + this.custFolder + "/" + orderFolder.folderName );
                        this.startScanProcessForOrderFolder(orderFolder );
                    }
                }
            }
        })
        //log("Orders built from folder information:", this.orderFolders );
    }

    buildFromFolder(email, folderPath){
        // we have found a folder for a previously non-existent customer

        this.email = email;
        this.custFolder = folderPath.split("/").pop() ;
        let fullFolderPath = folderPath
        //this.fullFolderPath = fullFolderPath

        // Look for all the folders within the customer folder and create
        // an entry each one
        let orderFolders = fs.readdirSync( fullFolderPath );

        orderFolders.forEach( (folder, ix)=>{
            
            let stat = fs.statSync( fullFolderPath + "/" + folder );
            if(stat.isDirectory()){
                // designate this as an order folder
                /*
                    
                "order_23482098": {
                    "state": "old",
                    "key": "order_23482098",
                    "folderName": "order_23482098",
                    "orderGB": 25,
                    "fileCount": 0,
                    "fileGB": 0,
                    "totalVideoMins": 0,
                    "scanCpuSecs": 0,
                    "scanTimeTaken": 0

                } */

                let {state, key} = utils.getStateAndKeyFromFolderName(folder);
                let orderFolder = this.orderFolders[key];

                if(orderFolder){
                    orderFolder.state = state;
                    
                } else {

                    orderFolder = newOrderEntry();
                    orderFolder.state = state
                    orderFolder.key = key
                    orderFolder.folderName = folder
                    this.orderFolders[key]=orderFolder ;
                }

                orderFolder.scanInProgress = false;
                if(state=="ready") this.startScanProcessForOrderFolder( orderFolder );

            }
        })
        log("Orders built from folder information:", this.orderFolders )
    }

    startMonitoringCustomer(){
        log(">> startMonitoringCustomer " + this.email )
        //this.customerMonitor = monitor.startMonitor(this);

        let targetFolder = customersFolderFullPath + this.custFolder;
        log(".. target folder to monitor: " + targetFolder);
        let thisCustomer = this;
        let beforeRename = null;
        this.watch = fs.watch( targetFolder, ( eventType, itemName )=>{
            // we are looking for folder activity only
            if( !itemName ) return;
            if(itemName=="New folder") return;

            log("<<<>>> customer folder " + this.email + " event: " );
            log("         " + eventType + " on " + itemName )

            let KS = utils.getStateAndKeyFromFolderName(itemName);
            log("KS", KS );

            switch(KS.state){
                case "notready":
                case "ready":
                case "processing":
                case "processed":
                case "scanned":
                    // start up processing of this folder
                    try{
                        let stat = fs.statSync( targetFolder + "/" + itemName );
                        log("Is directory? " + stat.isDirectory() );
                        if(stat.isDirectory() ) { 
                            if(eventType = "rename"){
                                if( beforeRename ){
                                    let afterRename = {key: KS.key, state: KS.state, itemName, eventType, folderName: itemName}
                                    thisCustomer.folderRename( beforeRename, afterRename );
                                } else {
                                    // This is a rename on a previously-unknown folder, so
                                    // treat it as a new folder
                                    thisCustomer.updateFolderEntry( eventType, itemName )
                                }
                                beforeRename = null;
                            } else {
                                beforeRename = null;
                            }

                            log("              >>>>>> folder status change " );
                        };
                    } catch(e) {
                        if( eventType == "rename"){
                            beforeRename = {key: KS.key, state: KS.state, itemName, eventType, folderName: itemName}
                        }
                        log("                  >>>>>> possible folder deleted change ")
                    }
                    break;
                default:
                    return;
            }

        })
    }

    updateFolderEntry( eventType, folderName ){
        let { key, state } = utils.getStateAndKeyFromFolderName( folderName );
        let orderFolder = this.orderFolders[key];
        // This is a rename on a previously-unknown folder, so
        // treat it as a new folder
        if( !orderFolder){ orderFolder  = newOrderEntry();
            orderFolder.key = key;
            orderFolder.folderName = folderName;
            orderFolder.state = "new";
            this.orderFolders[key] = orderFolder;
        };
        let oldState = orderFolder.state;
        orderFolder.state = state;
        if(state == "ready" && oldState!== "ready"){
            startScanProcessForOrderFolder(orderFolder);
        }
    }
    checkFolderEvent( eventType, itemName, itemKey, newState){
        log(">> checkFolderEvent for " & itemName );
        // we need to see if the status has changed to "ready" from some other state
        let orderFolder = this.orderFolders[itemKey];
        if(!orderFolder){
            orderFolder = {
                state: newState
                , key: itemKey
                , folderName: folder
                , orderGB: 25 // default order size
                , fileCount: 0
                , fileGB: 0
                , totalVideoMins: 0.0
                , scanCpuSecs: 0
                , scanTimeTaken: 0
            }
            this.orderFolders[itemKey] = orderFolder;
            return;
        }
        //if(eventType!==)
    }

    startScanProcessForOrderFolder(orderFolder){

        log("<>>>>>>>> Starting the scan process for " + this.email + ": " + orderFolder.folderName )
        let email = this.email;
        setTimeout(()=>{
            log(" >>>> Scan starting for " + email + " " + orderFolder.folderName );
            let scanProc = scanner.newScanner( this, orderFolder );
            scanProc.startScan();
        }, 3000 );

    }
    
    /**
     * Format of parameters:
     * {key , state , folderName}
     * @param {*} beforeRename 
     * @param {*} afterRename 
     */
    folderRename( beforeRename, afterRename ){
        log(">> folderRename:::");
        log("before:", beforeRename );
        log(" after:", afterRename );
        let orderFolder = this.orderFolders[beforeRename.key];
        if(!orderFolder){
            orderFolder = newOrderEntry();
            orderFolder.state = beforeRename.state;
            orderFolder.folderName = beforeRename.folderName
            orderFolder.key = beforeRename.key;
        }
        let oldState = orderFolder.state;
        let oldFolderName = orderFolder.folderName;
        let oldKey = orderFolder.key;
        let newState = afterRename.state;
        let newFolderName = afterRename.folderName
        let newKey =afterRename.key;
        orderFolder.state = newState;
        orderFolder.folderName = newFolderName;
        orderFolder.key = newKey;
        if( oldKey !== newKey ){
            delete this.orderFolders[oldKey];
        }
        this.orderFolders[newKey] = orderFolder;
        if(newState == "ready"  ){ //&& !orderFolder.scanInProgress
            this.startScanProcessForOrderFolder(orderFolder);
        }
    };
}

function newOrderEntry(){
    return {
        state: "new"
        , key: ""
        , folderName: ""
        , orderGB: 25 // default order size
        , fileCount: 0
        , fileGB: 0
        , totalVideoMins: 0.0
        , scanCpuSecs: 0
        , scanTimeTaken: 0
    }
}
function newCustomer(email, folderPath){
    // create a new customer record with given information if any
    return new ecoCustomer(email, folderPath);
}

function INIT(){
    log(">> INIT?")
    if(bINIT) return;
    bINIT = true;

    log( newCustomer )
    log("<< INIT")
}
log("### MODULE LOADED ")
