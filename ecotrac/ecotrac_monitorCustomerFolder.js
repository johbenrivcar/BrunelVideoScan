/**
 * THis module is responsible for starting the monitoring process on a customer folder, to detect
 * when an order folder is ready to be processed, or when processing has finished. 
 */


const global = require("./ecotrac_global");
const utils = require("./ecotrac_utils");
const settings = require("./ecotrac_settings");
const events = require("./ecotrac_events");
const log = require("./ecotrac_logger").getLogger("ecotrac_customerMasterFolder");
const allCustomers = require("./ecotrac_allCustomers");
events.addStream("monitor_event");


fs = require("fs");

// Number of files processed
var count = 0;
const ignorelist=[];
const fileTypes=["avi", "mp4"]
const allFilesProcessed = {};
const allMonitors = {};
const customerMasterFolderPath = global.ECOTRAC_ROOT_PATH + paths.customersFolder;

class CustomerFolderEventHandler{
    constructor(email, folderName){
        this.email= email;
        let { key, state } = 
        this.folderKey = this.folderKey;
        if(!folderPath){
            folderPath = customerMasterFolderPath + email;
        }
        this.folderPath = folderPath;
        this.customer = allCustomers.getCustomer( email );
        this.allfolders = this.customer.orderFolders;
    }

    folderEvent( eventData ){

    }
}

function startMonitor(email, processorFunction){
    let {incomingPath, processorFunction} = params;
    let custEventHandler = new CustomerFolderEventHandler( email, folderPath );


    console.log("monitor| Request to listen for file changes using params", params);

    // First check if there are any files already in the folder that need to be processed

    // Get a list of the files in the directory
    let dir = fs.readdirSync(incomingPath, {withFileTypes: true});
    
    console.log("monitor| Checking existing files in the folder =====================", dir);
    console.log("monitor| ----------------------------------\n")
    
    // Check and process each file
    dir.forEach( (entry)=>{

        let ft = fileType(entry)
        let copyParams = Object.assign( {}, params )
        console.log("monitor|  --- Existing file: <<<<<<<<<<<<<<<<<<<<<\n" + entry.name + " Type:" + ft );

        if(ft == "file") { 
            copyParams.eventType = "new";
            copyParams.filename = entry.name;
            
            let runprocess = ()=>{ processFileEvent(copyParams) };
            setImmediate(  runprocess );
            
        } else {
            let fullPath = incomingPath + "::" + entry.name;
            ignorelist.push( fullPath );
        }

        console.log("monitor|  --- >>>>>>>>>>>>>>>>>>>>>>>")
    });

    // Set up a monitor to detect changes to files in this folder
    fs.watch( incomingPath, (eventType, filename)=>{
        let copyParams = Object.assign( {}, params )
        copyParams.eventType = eventType;
        copyParams.filename = filename;
        let runprocess = ()=>{ processFileEvent(copyParams) };
        setImmediate(  runprocess );
    })
    
    console.log("monitor| Listening for file changes in [" + incomingPath + "] folder");

}



module.exports.monitor=startMonitor;



async function processFileEvent(params){
    params.count = ++count;

    let {incomingPath, eventType, filename, processorFunction} = params;
    let fullPath = params.fullPath = incomingPath + "/" + filename;

    if(!filename) filename="No name provided";

    console.log(params.count, "\n\n\n| ============================================================================= processFileEvent");
    console.log(params.count, "| params ", params);
    console.log(params.count, "| ================================= START EVENT");

    if(ignorelist.includes(fullPath)) {
        console.log(params.count, "| ... in ignore list - not processing");
        return null;
    }
    let fileType = params.fileType = filename.split(".").pop();
    console.log(params.count, "|  ... File type is " + fileType )


    ignorelist.push( fullPath );

    if(!fileTypes.includes(fileType)){
        console.log(params.count, "| ... File type not valid");

    } else {



        // }
        
        console.log(params.count, "| [processing]", count, params);

        let afp = allFilesProcessed[ count ] = { params: params, arrivalTime: new Date(), arrivalEventNumber: params.count }

        // This is where we call the processor function
        processorFunction(params)

    }

    console.log("================================= END EVENT ");
}




function fileType( dirent ){
    switch(true){
        case dirent.isFile(): return "file";
        case dirent.isDirectory(): return "directory";
        default: return "other";
    }
}




/// ======================= JUST FOR THE TESTING ====================================
const test_incomingPath = "G:/My Drive/Chorus/Brunel/VideoProcessing/Incoming";
const test_processingPath = "G:/My Drive/Chorus/Brunel/VideoProcessing/Processing";
const test_outgoingPath = "G:/My Drive/Chorus/Brunel/VideoProcessing/Processed";

let params1 = {
    incomingPath: test_incomingPath,
    processingPath: test_processingPath,
    processorFunction: dummyProcessor,
    outgoingPath: test_outgoingPath
}
startMonitor(params1)

function dummyProcessor( params ){
    //.. params: {incomingPath, processorFunction, outgoingPath}
    let copytoPath = params.processingPath + "/" + params.filename;
    
    console.log(params.count, "| ### dummyProcessor", params)

    fs.copyFile( params.fullPath, copytoPath, (err)=>{
        if(err){
            console.log(params.count, "| Error on copyFile! ", err, params)
            return null;
        };

        console.log(params.count, "| File copy completed - now deleting file", params );

        fs.rm( params.fullPath, (err)=>{
            if(err){
                console.log(params.count, "| Could not delete incoming file", err, params.fullPath );

            } else {
                console.log(params.count, "| Incoming file", params.fullPath, "was deleted!");
                //let ix = ignorelist.findIndex( (item, index )=>{ 
                //    console.log(params.count, "| checking ", item );
                //    return (item == params.fullPath) });
                //console.log(params.count, "| Incoming file was index number ", ix, "in the ignorelist");

            }
        } )
    })
}