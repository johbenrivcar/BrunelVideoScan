/**
 * Provides a logger to write activity on a customer account to a log file.
 */
// const fs = require("fs");
// const eGlobal = require("./ecotrac_global");
// const settings = require("./ecotrac_settings");

exports.getCustomerLog = getCustomerLog;

const utils = require("./ecotrac_utils")
const events = require("./ecotrac_events")
const dinfo = utils.dinfo;

//events.addStrem("customer_log")


class CustomerLogFile{
    constructor(email){
        this.email = email
        return;
    };

    write(msg){
        console.log(msg);
    };
}


let indent = 0

function getCustomerLog(email){
    //let sContext = (context + "                 ").substring(0,15)
    let logFile = new CustomerLogFile(email);

    let hhmm = "0000"
    let mmss = "00:00"

    fn = function (...params){
        newdt = dinfo();
        switch(true){
            case hhmm=="0000":
                logFile.write( newdt.full )
                logFile.write("Customer log started for " + customer.email )
                break;
            case hhmm != newdt.hhmm:
                console.log( newdt.full );
                break;
            case mmss != newdt.mmss :
                console.log( mmss )
                break;
        };
        
        logFile.write(customer.email + "| "   , ...params )
        hhmm = newdt.hhmm
        mmss = newdt.mmss

    }
    return fn
}



// let log = getLogger("test");
// for( c=2000; c>0; c--){
//     log("countdown", c)
// }


console.log("+++> ecotrac_logger MODULE LOADED\nLogging started at " + (new Date()).toUTCString())