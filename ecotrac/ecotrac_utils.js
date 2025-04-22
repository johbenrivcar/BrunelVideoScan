


exports.getStateAndKeyFromFolderName = getStateAndKeyFromFolderName;
exports.dinfo = dinfo;
exports.dts = dts;
exports.zIfNull = zIfNull;


const log = require("./ecotrac_logger").getLogger("_utils")
function zIfNull(num){
    if(isNaN(num)) return 0;
    return num;
    
}
function getStateAndKeyFromFolderName(folderName){
    let pts = folderName.split(".");
    let state, key;
    if(pts.length>1){
        state = pts.pop().toLowerCase();
        key = pts.join(".");
    } else {
        state = "none";
        key = folderName;
    }
    log(folderName, "pts", pts, state, key)
    switch(state ){
        case "ready":
        case "scanning":
        case "processed":
            break;
        default:    
            state = "notready";
            key = folderName;
    }
    
    return {state, key, folderName };

}

function dinfo( dt = new Date() ){
    let utc = dt.toUTCString();
    //console.log(sdt)
    let hh= utc.substring(17,19)
    let mm= utc.substring(20, 22)
    let ss= utc.substring(23, 25)
    let dinfo = {
        // dd: utc.substring(5,7)
        // ,
        //mm
        //,hh
        //,
        mm
        ,ss
        //,yyyy: utc.substring(12,16)
        ,hhmm: hh+mm
        , mmss: mm + ":" + ss
        ,full: utc.substring(5, 25)
        //,ts: mm + ":" + ss
        ,utc
        ,dts: dts(dt)
    }
    return dinfo;
}

/**
 *  global utility function for timestamp string
 * @returns string timestamp as yyyymmddhhmmss
 */
function dts(forDate = new Date() ){
    
    ss = forDate.toISOString().substring(0,19).replace(/[-T:]/g, "" );
    return ss
};
