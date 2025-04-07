/**
 * This module controls all the scanning processes that are running in the system at any time
 *  
 * This is the python command to run the scanner 
 * py brunel_ecotrac_scanner.py root:"G:\My Drive\Chorus\Brunel\ecotrac\ecotrac_T01\customers" mode:"T01" cust:"cust_charles@brunelbrands.com" fldr:"videosToScan.ready"
*/
 

var bINIT = false;



exports.INIT = INIT;
exports.newScanner = newScanner;

const fs = require("fs");
const eGlobal = require("./ecotrac_global");
const runMode = eGlobal.RUN_MODE;
const settings = require("./ecotrac_settings");
const events = require("./ecotrac_events");

const pathToScannerScript = "D:/GitHubRepositories/BrunelVideoScan/python_test/brunel_ecotrac_scanner_" + runMode + ".py"
const pathToScannerCWD = "D:/GitHubRepositories/BrunelVideoScan/python_test/"
console.log("Path to scanner " + pathToScannerScript )
const spawn = require("child_process").spawn;


const allScanners = {};
const queuedScanners = [];
var scannerCount = 0


class Scanner{
    constructor( customer, folder ){
        this.customer = customer
        this.folder = folder
        this.id = nextScannerID();
        events.addStream( this.id );
        events.listen(this.id, (scanEventData)=>{ this.onScanEvent } );
    }
    
    onScanEvent( scanEventData ){
        print("Scanner" + this.id + this.customer.email + " - " + this.folder.folderName, scanEventData )
    }

    startScan(){
        // arguments for python script 
        // mode = the current run mode
        // root = the root path to the folder for all customers
        // cust = the customers folder under the root
        // fldr = the folder containing videos to be scanned
        let me = this;
        console.log(">> StartScan ")
        let mode = 'MODE:"' + runMode + '"';
        let root = 'ROOT:"' + settings.customersFolderFullPath + '"'
        let cust = 'CUST:"' + this.customer.custFolder + '"';
        console.log( { mode, root, cust })
        let scanFolder = this.folder.folderName;

        if(scanFolder.slice(-6) !== ".ready"){
            console.log("ERROR: The folder to be scanned must end with .ready")
            return false;
        }


        let newFolderName = this.folder.folderName.replace(".ready", ".scanning");

        let oldFolderPath = settings.customersFolderFullPath  + this.customer.custFolder + "/" + this.folder.folderName;
        let newFolderPath = settings.customersFolderFullPath + this.customer.custFolder + "/"  + newFolderName;
        
        try{
            this.log( "Rename");
            this.log( oldFolderPath );
            this.log( newFolderPath );
            fs.renameSync(oldFolderPath, newFolderPath);
        } catch(e){
            console.log ("ERROR: When trying to rename folder before scan");
            //return false;
        }

        
        let fldr = 'FLDR:"' + this.folder.folderName + '"';


        let proc = this.pythonProcess = spawn('py', [pathToScannerScript, mode , root, cust, fldr], {cwd: pathToScannerCWD } );

        proc.stdout.on('data', (data) => {
            console.log("scanner" + me.id, "FromPython:",  data );
        });
        this.folder.scanInProgress = true;


    }

    pythonMessage( data ){
        //report = data.split(":");
        this.log( data )
    }
    log(...args){
        console.log(">scanner" + this.id, ...args )
    }
}

function newScanner(customer, folder){
    return new Scanner(customer, folder);
}

function queueScan( customer, folder ){
    let ss = newScanner(customer, folder);
    let custScanners = allScanners[customer.email] 

}

function nextScannerID(){
    scannerCount++;
    return "S[" + scannerCount + "]";

}

function INIT(){

}
