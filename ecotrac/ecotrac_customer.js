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
zIfNull = utils.zIfNull;
getStateAndKeyFromFolderName = utils.getStateAndKeyFromFolderName

const log = require("./ecotrac_logger").getLogger("ecotrac_customer");
const customerLogger = require("./ecotrac_customerLogger")

const monitor = require("./ecotrac_monitorCustomerFolder");
var allCustomers;

log("#### MODULE LOAD STARTED");


function newCustomerStats(){
    return {
        scanCount: 0,
        scanFileCount: 0,
        scanFileMB: 0.0,
        scanFrameCount: 0,
        scanVideoMins: 0,
        scanTimeSecs: 0,
        scanCPUSecs: 0.0,
        lastScanDate: null
    };

}


class Customer{
    constructor( email, folderPath ){
        this.videoFolders = {};
        this.email = null;
        this.scanRuns = {
            bought: 0,
            unused: 0,
            used: 0
        };

        this.stats = newCustomerStats();

        if(email){
            this.email = email
        } 
        if (folderPath){
            this.folderPath = folderPath
        }
    }

    /**
     * Reports to the allCustomers store that this customer has
     * been updated
     */
    reportUpdated(){
        if(!allCustomers) allCustomers = require("./btrac_allCustomers");
        allCustomers.customerUpdated( this );
    }


    /**
     * Transfers all the data from the customer data that was saved to 
     * JSON file into this customer object.
     * @param {*} custData 
     * @returns 
     */
    loadFromDataFile(custData){
        
        this.email = email = custData.email;
        this.log("Loading from cust data", custData )

        this.videoFolders = (custData.videoFolders? custData.videoFolders : custData.orderFolders );
        this.custFolderName = (custData.custFolderName? custData.custFolderName : custData.custFolder) ;
        this.scanRuns = (custData.scanRuns? custData.scanRuns: { bought: 0, unused:0, used:0 });
        if(!this.scanRuns.bought) this.scanRuns.bought = 0;
        this.stats = (custData.stats? custData.stats : newCustomerStats() );

        // set all the video folder states to "old". They will be checked
        // against the actual video folders found on the customer folder.
        // Any folders that do not exist and have never had a scan run
        // will be removed from the customer record.
        let keys = Object.keys(this.videoFolders)
        keys.forEach( (key, ix)=>{
            let videoFolder = this.videoFolders[key];
            videoFolder.state = "old";
            if( !videoFolder.scanCount ) videoFolder.scanCount = 0;

        });

        // scan for folders in the customer folder area
        // to make sure all state information is up-to-date

        // First remove any that are not found on disk and have had
        // no scans
        this.removeInactiveVideoFolders();

        // Then check all those that remain to ensure their status
        // information is correct.
        this.updateVideoFolders();

        this.reportUpdated();
        return this;
    };

    removeInactiveVideoFolders(){
        this.log(`Checking for inactive video folders on ${this.custFolderName}`);
        // Sort the folder names
        let keys = Object.keys(this.videoFolders).sort();
        // Create a new list to contain those folders that will be kept

        let newFolderList = {}
        keys.forEach( (key)=>{
            let vf = this.videoFolders[key];
            if( vf.state!="old" && vf.fileCount == 0){
                delete this.videoFolders[key];
                this.log(`..removed inactive folder ${key}`)
            };

        })
    }

    /****************************************************************** updatevideoFolders
     * 
     * runs through all the order folders in the customer's work folder to 
     * update the customer record with latest information.
     * 
     */
    updateVideoFolders(){
        this.log("Scanning video folders for " + this.custFolderName )

        // Construct the path to customer's work folder
        let fullFolderPath = customersFolderFullPath  + this.custFolderName;

        // Get a list of all the sub-folders in the customer's work folder
        let folderNamesList
        try{
            folderNamesList = fs.readdirSync( fullFolderPath );
        } catch(e){
            this.log("No customer folder for this customer")
            this.isNotActive = true;
            //
            // TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO 
            // SOMEWHERE, WE WILL NEED TO MONITOR IN CASE A CUSTOMER FOLDER IS CREATED ############################
            //
            return false;
        }

        this.isNotActive = false;

        folderNamesList.forEach( (folder, ix)=>{
            
            let stat = fs.statSync( fullFolderPath + "/" + folder );
            if(stat.isDirectory()){
                // This is a folder that may contain videos for scanning
                let {state, key} = getStateAndKeyFromFolderName(folder);
                let videoFolder = this.videoFolders[key];

                if(videoFolder){
                    videoFolder.state = state;
                    videoFolder.folderName = folder;

                } else {

                    videoFolder = newVideoFolder();
                    videoFolder.folderName = folder;
                    videoFolder.key = key;
                    /* {
                        state
                        , key
                        , folderName: folder
                        , fileCount: 0
                        , fileMB: 0
                        , scanCount: 0
                        , scanFileCount: 0
                        , scanMB: 0
                        , scanVideoMins: 0.0
                        , scanCpuSecs: 0
                        , scanTimeSecs: 0
                        
                    };*/
                    this.videoFolders[key]=videoFolder ;
                }
                // Check if this videoFolder is ready to be processed
                if( videoFolder.state == "ready"){
                    if(! videoFolder.scanInProcess ){
                        this.log("Starting the scanning process on " + this.custFolderName + "/" + videoFolder.folderName );
                        this.startScanProcessForOrderFolder(videoFolder );
                    }
                }
            }
        })
        

    }

    log(...items){
        log(this.email, ...items)
    }

    /**
     * Stats layout:
     * {
            folderName: 'videosToScan.scanning',
            fps: 30,
            videoCount: 2,
            frameCount: 2716,
            scanCPUSecs: 34.15625,
            scanTimeSecs: 16,
            videoMB: 8.490473,
            videoDurationSecs: 90.533,
            scanStartTime: '20250421 191649',
            scanEndTime: '20250421 191705',
            scanCPUPerMinVideo: 22.63677333127147,
            scanCPUPerFrame: 0.012575938880706922
}
     */
    scanCompleted(stats){
        let cstats;
        let folder;
        try{
            this.log(">scanCompleted", stats)

            let folderName = stats.folderName;

            this.log(">scanCompleted on folder " + folderName);
            
            let {state, key} = getStateAndKeyFromFolderName( folderName );
            

            folder = this.videoFolders[key];

            if(!folder){
                this.log(`Creating new folder entry with key ${key}`)
                this.videoFolders[key] = folder = newVideoFolder();
                folder.folderName = stats.folderName;
                folder.key = key;
            }

            // Update the stats for this folder
            this.log(`Updating folder stats for folder key ${key}`)
            folder.state = state;
            folder.fileCount = stats.videoCount;
            folder.fileMB = stats.videoMB
            folder.totalVideoMins = stats.videoDurationSecs/60
            folder.scanCount += 1;
            folder.scanFrameCount += stats.frameCount;
            folder.scanFileCount += stats.videoCount;
            folder.scanCPUSecs = stats.scanCPUSecs + zIfNull(folder.scanCPUSecs);
            folder.scanTimeSecs += stats.scanTimeSecs;
            folder.scanVideoMins = folder.totalVideoMins + zIfNull( folder.scanVideoMins )
            folder.lastScanDate =  stats.scanEndTime

            this.log(`updated folder`, folder)
            
            // update the stats for this customer
            this.log(`Updating customer stats`)
        
            this.scanRuns.unused -=1
            this.scanRuns.used +=1
            cstats = this.stats
            cstats.scanCount +=1;
            cstats.scanFileCount += stats.videoCount
            cstats.scanFileMB += stats.videoMB
            cstats.scanFrameCount += stats.frameCount
            cstats.scanVideoMins = folder.totalVideoMins + (cstats.scanVideoMins?cstats.scanVideoMins:0);
            cstats.scanTimeSecs += stats.scanTimeSecs
            cstats.scanCPUSecs = stats.scanCPUSecs + zIfNull(cstats.scanCPUSecs);
            cstats.lastScanDate = stats.scanEndTime
            this.log(`updated customer stats`, cstats)
        } catch(e) {
            console.error(e)
            process.exit(999)
        }

        this.reportUpdated();

    }

    buildFromFolder(email, folderPath){
        // we have found a folder for a previously non-existent customer

        this.email = email;
        this.custFolderName = folderPath.split("/").pop() ;
        let fullFolderPath = folderPath
        //this.fullFolderPath = fullFolderPath

        // Look for all the folders within the customer folder and create
        // an entry each one
        let videoFolders = fs.readdirSync( fullFolderPath );

        videoFolders.forEach( (folder, ix)=>{
            
            let stat = fs.statSync( fullFolderPath + "/" + folder );
            if(stat.isDirectory()){

                let {state, key} = getStateAndKeyFromFolderName(folder);

                // Get hold of the folder entry for this key
                let videoFolder = this.videoFolders[key];

                // If there is no entry for this folder, we need to create one
                if(!videoFolder){
                    videoFolder = newVideoFolder();
                    videoFolder.key = key
                    videoFolder.folderName = folder
                    // Add the folder to the list of folders for this customer
                    this.videoFolders[key]=videoFolder ;
                }

                // Update the state of the folder to match the actual current state
                videoFolder.state = state;

                videoFolder.scanInProgress = false;

                // Check if the state is ready, because if so we need to trigger
                // a scan for this folder. The scan run is asynchronous
                if(state=="ready") this.startScanProcessForOrderFolder( videoFolder );

            }
        })
        this.log( "Video folder entries built from sub-folders in customer folder:", this.videoFolders )
        
        this.reportUpdated();
    }

    /**
     * This function establishes an asyncrhonous monitor process on the customer folder to check
     * when new sub-folders are created or any existing sub-folders are renamed.
     */
    startMonitoringCustomer(){
        this.log(">> startMonitoringCustomer");

        // The name of the folder to be monitored
        let targetFolderPath = customersFolderFullPath + this.custFolderName;
        this.log(".. target folder to monitor: " + targetFolderPath);

        // set up an aysnc folder watch using fs.watch
        let thisCustomer = this;
        let beforeRename = null;
        this.watch = fs.watch( targetFolderPath, ( eventType, itemName )=>{

            // we are looking for folder activity only
            if( !itemName ) return;

            // When a folder is first created, it is given the system defined
            // name "New folder". We just ignore this because we will get notification
            // later of the name that the user gives to the folder.
            if( itemName == "New folder" ) return;

            // We have a real event on a folder
            this.log(`<<<>>> customer folder event: ${eventType} on ${itemName}` )

            // get the folder key and state from the folder name. The state is a recognised
            // suffix such as .ready, .scanning, .processed
            let KS = getStateAndKeyFromFolderName(itemName);
            this.log("KS", KS );

            // check the state to decide what action to take
            switch(KS.state){
                case "ready":
                case "scanning":
                case "processed":
                    // these are recognised state flags for a folder
                    try{
                        // Get system information about this folder
                        let stat = fs.statSync( targetFolderPath + "/" + itemName );
                        // We are only interested in directories
                        if(stat.isDirectory() ) { 

                            // we are interested if a folder is being renamed to a different state
                            if(eventType = "rename"){
                                // Rename event come in pairs, the first being the name before the 
                                // rename and the second being the name after the rename. In the first
                                // case we create a beforeRename object, then wait for the second to
                                // arrive before we take any action.
                                if( !beforeRename ){
                                    // This is the first rename event of a pair, so we treat it
                                    // treat it as a new folder or just an update
                                    thisCustomer.updateFolderEntry( eventType, itemName )

                                } else {
                                    // Now we have the second rename event of the pair, so we can
                                    // actually take some action if needed
                                    let afterRename = {key: KS.key, state: KS.state, itemName, eventType, folderName: itemName}
                                    // Process the whole event - this is where the action happens
                                    thisCustomer.folderRename( beforeRename, afterRename );
                                }

                                beforeRename = null;
                            } else {
                                beforeRename = null;
                            }
                        };
                    } catch(e) {
                        // We come here if we got a rename event on a folder that does not exist. This
                        // indicates we have got the first event of a rename pair, because the renaming
                        // has happened and trying to find information about the folder using the old
                        // folder name will raise this exception. So, we just set up the beforeRename
                        // object on this folder and wait for the next event to arrive.
                        if( eventType == "rename"){
                            beforeRename = {key: KS.key, state: KS.state, itemName, eventType, folderName: itemName}
                        }
                        
                    }
                    break;
                default:
                    return;
            }

        })
    }

    updateFolderEntry( eventType, folderName ){
        // Get the key and state from the folder name
        let { key, state } = getStateAndKeyFromFolderName( folderName );

        // Get the existing folder entry matching the key, if there is one
        let videoFolder = this.videoFolders[key];
               
        if( !videoFolder){  
            // This is a rename indicating a new folder, so
            // create a completely new folder entry
            videoFolder  = newVideoFolder();
            videoFolder.key = key;
            videoFolder.folderName = folderName;
            videoFolder.state = "new";
            this.videoFolders[key] = videoFolder;
        };

        // Check the state to see if we need to start a scan run on this
        // folder
        let oldState = videoFolder.state;
        videoFolder.state = state;
        // Only run a scan process if the state has switched from some
        // other state to .ready
        if(state == "ready" && oldState!== "ready"){
            startScanProcessForOrderFolder(videoFolder);
        }
        
        this.reportUpdated();
    }


    // checkFolderEvent( eventType, itemName, itemKey, newState){
    //     this.log(">> checkFolderEvent for " & itemName );
    //     // we need to see if the status has changed to "ready" from some other state
    //     let videoFolder = this.videoFolders[itemKey];
    //     if(!videoFolder){
    //         videoFolder = newVideoFolder();
    //         videoFolder.state= newState
    //         videoFolder.key= itemKey
    //         videoFolder.folderName= folder
    //         this.videoFolders[itemKey] = videoFolder;
    //         return;
    //     }
    //     //if(eventType!==)
    // }

    startScanProcessForOrderFolder(videoFolder){

        this.log("<>>>>>>>> Starting the scan process for " + this.email + ": " + videoFolder.folderName )
        let email = this.email;
        setTimeout(()=>{
            this.log(" >>>> Scan starting for " + email + " " + videoFolder.folderName );
            let scanProc = scanner.newScanner( this, videoFolder );
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
        this.log(">> folderRename:::");
        this.log("before:", beforeRename );
        this.log(" after:", afterRename );

        let videoFolder = this.videoFolders[beforeRename.key];
        if(!videoFolder) videoFolder = this.videoFolders[afterRename.key];
        if(!videoFolder){
            videoFolder = newVideoFolder();
            videoFolder.state = beforeRename.state;
            videoFolder.folderName = beforeRename.folderName
            videoFolder.key = beforeRename.key;
        }
        let oldState = videoFolder.state;
        let oldFolderName = videoFolder.folderName;
        let oldKey = videoFolder.key;
        let newState = afterRename.state;
        let newFolderName = afterRename.folderName
        let newKey =afterRename.key;
        videoFolder.state = newState;
        videoFolder.folderName = newFolderName;
        videoFolder.key = newKey;
        if( oldKey !== newKey ){
            delete this.videoFolders[oldKey];
        }
        this.videoFolders[newKey] = videoFolder;
        if(newState == "ready"  ){ //&& !videoFolder.scanInProgress
            this.startScanProcessForOrderFolder(videoFolder);
        }
        
        this.reportUpdated();
    };
}

function newVideoFolder(){
    return {
        state: "new",       // suffix of the name, i.e. .ready, .scanning, .processed
        key: "",            // folder name excluding the state suffix if it has one
        folderName: "",     // folder name including the state suffix
        fileCount: 0,       // number of video files found in the folder during the last scan
        fileMB: 0,          // Sum of the sizes of all the video files that were found in the last scan
        totalVideoMins: 0,  // Length of all the videos combined, in minutes, in the last scan
        scanCount: 0,       // The number of times a scan has been run on this folder
        scanFileCount: 0,   // The number of video files in this folder that have been scanned
                            // across all scan runs
        scanCPUSecs: 0,     // The amount of cpu time used to scan all the files across all the
                            // scan runs
        scanTimeSecs: 0,    // The total elapsed time of all the scan runs
        scanInProgress: false, // Flag indicating that a scan is currently in progress
        scanFrameCount: 0,   // Number of frames scanned across all scan runs
        scanVideoMins: 0,    // The time length of all the video files that have been scanned across
                            // all scan runs
        lastScanDate: null  // The last time a scan was run on this folder yyyymmdd hhmmss string
    }
    
}

function newCustomer(email, folderPath){
    // create a new customer record with given information if any
    return new Customer(email, folderPath);
}

function INIT(){
    log(">> INIT?")
    if(bINIT) return;
    bINIT = true;

    log("<< INIT")
}
log("### MODULE LOADED ")
