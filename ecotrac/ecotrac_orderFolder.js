/**
 * Corresponds to an order folder in a customer folder. The order folder is the unit of processing
 * when scanning is doen. It contains video files to be scanned. 
 */


const global = require("./ecotrac_global");
const utils = require("./ecotrac_utils");
//const settings = require("./ecotrac_settings");
const log = require("./ecotrac_logger").getLogger("ecotrac_orderFolder");
/**
 * This is an example of the JSON for an orderFolder within a customer record
 * The key is the folder name excluding the state flag appended to it.
"order_23482098": {
                "state": "new"
                , "key": "order_23482098"
                , "folder": "order_23482098"
                , "orderGB": 25
                , "fileCount": 0
                , "fileGB": 0.0
                , "totalVideoMins": 0.0
                , "scanCpuSecs": 0
                , "scanTimeTaken": 0
            }
 */

class OrderFolder{
    constructor( email , folderName, orderNumber ){
        // The path indicates the folder state based on the suffix:
        // _ready  _processing  _processed 
        // Any other suffix is state notready
        let {state, key} = getStateAndKeyFromFolderName(folderName);
        this.state = state;
        this.key = key;
        this.folder = folderName;
        this.orderGB = 25;
        this.fileCount = 0;
        this.fileGB = 0.0;
        this.totalVideoMins = 0;
        this.scanCpuSecs = 0;
        this.scanTimeTaken = 0;
        this.crd = global.dts();
        this.upd = global.dts();

    }

    newState(state, folderName){
        this.state = state;
        if(folderName) this.folderName = folderName;
        this.upd = global.dts();
        if(state = "ready"){
            // KICK OFF THE PROCESSING HERE
            log(">>>> Start Processing this folder, status is ready: ", this.folderName )
        };
    }

}


function newOrderFolder(path){
    return new OrderFolder(path);
}

module.exports = exports = {
    getStateAndKeyFromFolderName: utils.getStateAndKeyFromFolderName
    ,OrderFolder
    ,newOrderFolder
};


console.log("ecotrac_orderFolder", module.exports )