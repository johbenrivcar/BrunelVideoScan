
// const fs = require("fs");
// const eGlobal = require("./ecotrac_global");
// const settings = require("./ecotrac_settings");

const utils = require("./ecotrac_utils")
const dinfo = utils.dinfo;


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
        console.log(context + "| "   , ...params )
    }
    return fn
}



// let log = getLogger("test");
// for( c=2000; c>0; c--){
//     log("countdown", c)
// }

exports.getLogger = getLogger;

console.log("+++> ecotrac_logger MODULE LOADED\nLogging started at " + (new Date()).toUTCString())