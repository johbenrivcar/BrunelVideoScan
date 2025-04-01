

global = require("./ecotrac_global")
if(!global["RUN_MODE"]){
    var run_mode = global.RUN_MODE = "DEV";
    global.ECOTRAC_ROOT_PATH = "G:/My Drive/Chorus/Brunel/ecotrac/DEV/";
}

module.exports = exports = { getStateAndKeyFromFolderName }

const log = require("./ecotrac_logger").getLogger("_utils")

function getStateAndKeyFromFolderName(folderName){
    let pts = folderName.split(".");
    let state, key;
    if(pts.length>1){
        state = pts.pop().toLowerCase();
        key = pts.join(".");
    } else {
        state = "notready";
        key = folderName;
    }
    log(folderName, "pts", pts, state, key)
    switch(state ){
        case "ready":
        case "processing":
        case "processed":
            break;
        default:    
            state = "notready";
            key = folderName;
    }
    
    return {state, key };

}
