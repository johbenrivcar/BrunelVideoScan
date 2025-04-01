
const fs = require("fs");

const global = require("./ecotrac_global");
const settings = require("./ecotrac_settings");

let hhmm = "0000"
let mmss = "00:00"
let lastContext = ""
let indent = 0

function getLogger(context){
    //let sContext = (context + "                 ").substring(0,15)

    fn = function (...params){
        newdt = dinfo();
        if(hhmm != newdt.hhmm){
            console.log( newdt.full )
            hhmm = newdt.hhmm
            mmss = newdt.mmss
        } 
        else if (mmss != newdt.mmss ){
            mmss=newdt.mmss
            console.log( mmss )

        }
        
        lastContext = context;
        console.log("[" + context + "]"   , ...params )
    }
    return fn
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
    }
    return dinfo;
}

// let log = getLogger("test");
// for( c=2000; c>0; c--){
//     log("countdown", c)
// }

exports.getLogger = getLogger;

console.log("+++> ecotrac_logger MODULE LOADED\nLogging started at " + (new Date()).toUTCString())