/**
 * THis module is responsible for starting the monitoring process on a customer folder, to detect
 * when an order folder is ready to be processed, or when processing has finished. 
 */


exports.monitor=startMonitor;


const global = require("./ecotrac_global");
const settings = require("./ecotrac_settings");
const utils = require("./ecotrac_utils");

const paths = settings.paths;
const events = require("./ecotrac_events");
const log = require("./ecotrac_logger").getLogger("ecotrac_customerMasterFolder");
const allCustomers = require("./btrac_allCustomers");
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
    constructor(customer){
        this.customer = customer;
        this.allfolders = this.customer.orderFolders;
    }

    folderEvent( eventData ){
        log("Folder event on: " + this.customer.email, "eventData:", eventData);
        events.monitor_event({ customer, eventData })
        // call back to the customer instance that an event happened on the customer folder
        this.customer.folderEvent( eventData );
    }
}

function startMonitor(customer){

    console.log("monitor| Request to listen for file changes for customer", customer.email);

    // First check if there are any files already in the folder that need to be processed
    // Get a list of the files in the directory
    let custFolder = customer.custFolder
    
    console.log("monitor| Checking existing files in the folder =====================", dir);
    console.log("monitor| ----------------------------------\n")
    
    let cevh = new CustomerFolderEventHandler(customer)

    let dir = fs.readdirSync(custFolder, {withFileTypes: true});

    // Check and process each file
    dir.forEach( (entry)=>{

        let ft = fileType(entry)

        console.log("monitor|  --- Existing file: <<<<<<<<<<<<<<<<<<<<<\n" + entry.name + " Type:" + ft );

        if(ft=="directory"){
            cevh.folderEvent( {fileName: entry.name, eventType: "new" } );
        }
        // if(ft == "file") {}
        //     let fullPath = custFolder + "::" + entry.name;
        //     ignorelist.push( fullPath );
        // }

        // console.log("monitor|  --- >>>>>>>>>>>>>>>>>>>>>>>")
    });


    // Set up a monitor to detect changes to files in this folder
    fs.watch( custFolder, (eventType, filename)=>{
        cevh.folderEvent( { eventType, filename } ) }
    );
    
    console.log("monitor| Listening for file changes in [" + custFolder + "] folder");

}




// async function processFileEvent(params){
//     params.count = ++count;

//     let {incomingPath, eventType, filename, processorFunction} = params;
//     let fullPath = params.fullPath = incomingPath + "/" + filename;

//     if(!filename) filename="No name provided";

//     console.log(params.count, "\n\n\n| ============================================================================= processFileEvent");
//     console.log(params.count, "| params ", params);
//     console.log(params.count, "| ================================= START EVENT");

//     if(ignorelist.includes(fullPath)) {
//         console.log(params.count, "| ... in ignore list - not processing");
//         return null;
//     }
//     let fileType = params.fileType = filename.split(".").pop();
//     console.log(params.count, "|  ... File type is " + fileType )


//     ignorelist.push( fullPath );

//     if(!fileTypes.includes(fileType)){
//         console.log(params.count, "| ... File type not valid");

//     } else {



//         // }
        
//         console.log(params.count, "| [processing]", count, params);

//         let afp = allFilesProcessed[ count ] = { params: params, arrivalTime: new Date(), arrivalEventNumber: params.count }

//         // This is where we call the processor function
//         processorFunction(params)

//     }

////    console.log("================================= END EVENT ");
//}




function fileType( dirent ){
    switch(true){
        case dirent.isFile(): return "file";
        case dirent.isDirectory(): return "directory";
        default: return "other";
    }
}




// /// ======================= JUST FOR THE TESTING ====================================
// const test_incomingPath = "G:/My Drive/Chorus/Brunel/VideoProcessing/Incoming";
// const test_processingPath = "G:/My Drive/Chorus/Brunel/VideoProcessing/Processing";
// const test_outgoingPath = "G:/My Drive/Chorus/Brunel/VideoProcessing/Processed";

// let params1 = {
//     incomingPath: test_incomingPath,
//     processingPath: test_processingPath,
//     processorFunction: dummyProcessor,
//     outgoingPath: test_outgoingPath
// }
// startMonitor(params1)

// function dummyProcessor( params ){
//     //.. params: {incomingPath, processorFunction, outgoingPath}
//     let copytoPath = params.processingPath + "/" + params.filename;
    
//     console.log(params.count, "| ### dummyProcessor", params)

//     fs.copyFile( params.fullPath, copytoPath, (err)=>{
//         if(err){
//             console.log(params.count, "| Error on copyFile! ", err, params)
//             return null;
//         };

//         console.log(params.count, "| File copy completed - now deleting file", params );

//         fs.rm( params.fullPath, (err)=>{
//             if(err){
//                 console.log(params.count, "| Could not delete incoming file", err, params.fullPath );

//             } else {
//                 console.log(params.count, "| Incoming file", params.fullPath, "was deleted!");
//                 //let ix = ignorelist.findIndex( (item, index )=>{ 
//                 //    console.log(params.count, "| checking ", item );
//                 //    return (item == params.fullPath) });
//                 //console.log(params.count, "| Incoming file was index number ", ix, "in the ignorelist");

//             }
//         } )
//     })
// }