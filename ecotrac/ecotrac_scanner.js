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


const scannerName = eGlobal.python.scanning.pythonScriptName.replace("[MODE]", runMode).replace(/\\/g, "/")
const pythonScriptFolder = eGlobal.python.scanning.pythonScriptFolder;


const pathToScannerCWD = __dirname.replace(/\\/g, "/") +  pythonScriptFolder;
console.log("Python scanner CWD", pathToScannerCWD)

const pathToScannerScript = pathToScannerCWD + "/" + scannerName
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
        this.log(">> StartScan ")
        let mode = 'MODE:' + runMode;
        let root = 'ROOT:' + settings.customersFolderFullPath
        let cust = 'CUST:' + this.customer.custFolderName;
        this.log( { mode, root, cust })
        let scanFolder = this.folder.folderName;

        if(scanFolder.slice(-6) !== ".ready"){
            this.log("ERROR: The folder to be scanned must end with .ready")
            return false;
        }


        let newFolderName = this.folder.folderName.replace(".ready", ".scanning");

        let oldFolderPath = settings.customersFolderFullPath  + this.customer.custFolderName + "/" + this.folder.folderName;
        let newFolderPath = settings.customersFolderFullPath + this.customer.custFolderName + "/"  + newFolderName;
        
        try{
            this.log( "Attempting rename");
            this.log( oldFolderPath );
            this.log( newFolderPath );
            fs.renameSync(oldFolderPath, newFolderPath);

        } catch(e){
            this.log ("ERROR: When trying to rename folder before scan");
            return false;
        }

        
        let fldr = "FLDR:" + newFolderName ;


        this.log("Command to start the scanner: ***********************************************");
        this.log(`py "${pathToScannerScript}"  "${mode}" "${root}" "${cust}" "${fldr}"`  );
        
        let proc = this.pythonProcess = spawn('py', [pathToScannerScript, mode , root, cust, fldr], {cwd: pathToScannerCWD } );

        proc.on("exit", (code)=>{
            this.log( `Scanning process #${this.id} for ${cust} on folder ${fldr} has exited with code ${code}`);
            

            
            this.pythonProcess = null;

        });


        proc.stdout.on('data', (data) => {
            let msgIn = data.toString();
            let msgs = msgIn.split( "[-!-]");

            msgs.forEach( (msg, ix)=>{
                msg = msg.trim();
                if(msg.length > 0){

                    this.log("|py|=[" + msg + "]=" );
                    if(msg.substr(0, 6) == "STATS:"){
                        //this.log ("Stats returned from scanner:");
                        let json = msg.substr(6);
                        this.log( "raw json:", json);
                        try{

                            let stats = JSON.parse(json);

                            this.log( "stats", stats )
                            this.customer.scanCompleted( stats )
            
                            let ac = require("./btrac_allCustomers");
                            ac.saveAllCustomersJSON();

            
            
            
                        } catch(e){
                            this.log( `Could not parse stats json from python scanner:`, json)
                            this.log(e)
                        }
                    };

                    if(msg.substr(0, 4) == "END:"){
                        this.log("Scanning process completed");

                        oldFolderPath = newFolderPath;
                        newFolderPath = newFolderPath.replace(".scanning", ".processed");
                        
                        try{
                            this.log( "Attempting folder rename to .processed status");
                            this.log( oldFolderPath );
                            this.log( newFolderPath );
                            fs.renameSync(oldFolderPath, newFolderPath);
                            this.folder.scanInProgress = false;
                            
                        } catch(e){
                            this.log ("ERROR: When trying to rename folder after scan");

                        }
                


                    }
                }
            });
                    
        });

        this.folder.scanInProgress = true;
        return true;
    
    }

    pythonMessage( data ){
        //report = data.split(":");
        this.log( data )
    }

    log(...args){
        console.log(">scan " + this.id, ...args )
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
