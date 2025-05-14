"use strict"; //{ getCookie, sendScript, getCookie, sendCSS, sendFile, fin, dts }

if(!global.BRUNEL) global.BRUNEL = {}
const BRUNEL = global.BRUNEL;


// ======================= Tracing function =====================
var currentIndent = "|";
class I{
    constructor(cname, ...params){
        this.cname = cname;
        this.oldIndent = currentIndent;
        
        console.log(`${this.oldIndent}\\ ${this.cname}`, ...params);

        this.indent = currentIndent = "| " + currentIndent;
    }
    log(...params){
        console.log(`${this.indent}`, ...params)
    }
    x(...params){
        currentIndent = this.oldIndent;
        console.log(`${currentIndent}/ ${this.cname}`, ...params)
    }
}


function fin(ctxt, ...params){
    return new I(ctxt, ...params);
}
//================================================================

function dts(){
    let d = new Date().toISOString();
    //                    YYYY               MM                 DD                  HH                   MM                   SS
    return `${d.substring(0,4)}${d.substring(5,7)}${d.substring(8,10)}${d.substring(11,13)}${d.substring(14,16)}${d.substring(17,19)}`
}


//================= Cookie management ============================
function getCookie(req){
    let xx = fin("getCookie")
    var cookie = req.headers.cookie
    if(!cookie) cookie="NONE"
    xx.x()
    return cookie.split("; ")
}
//================================================================

//============= Send a pug page from the pages folder ============
/**
 * This async function activates the page loader module for the given page.
 * The page loader assembles the relevant data prior to calling the pug functions
 * to construct the page or div html that is sent. Each pug page or div ending .pug
 * has a corresponding .js loader module containing the javascript that will load
 * the page. The javascript module must export a function sendPage( req, res, sessionData ).
 * @param {*} req
 * @param {*} res 
 * @param {*} session
 * @param {*} pageName 
 * @param {*} subfolder - the subfolder within app folder that contains the 
 *                          page loader module. Defaults to ./pages
 * @returns null
 * 
 */



//============= Web server assistance for scripts and css files ===
function sendScript(res, scriptName, subfolder="./public/javascripts" ){
    xx = fin(`getScript()`)
    if(scriptName.substring(-4) != ".js" ) scriptName += ".js";
    try{
        let fn = `${subfolder}/${scriptName}`;
        xx.log("fn=", fn)
        sendFile(res, fn);
        return true

    } catch(e) {
        xx.log(`Error on getting script ${scriptName}`, e);
        xx.x(-1)
        return "";
    };

}



function sendCSS( res, cssName, subfolder="./public/stylesheets" ){
    let xx = fin("sendCSS", cssName)
    try{
        if(cssName.substring(-4) != ".css" ) cssName += ".css";
        let fn = `${subfolder}/${cssName}`;
        xx.log("fn=", fn)
        sendFile(res, fn);
        xx.x(0)
        return 0
    } catch(e) {
        xx.log(`Error on getting script ${cssName}`, e);
        xx.x(-1)
        return -1;
    };
};


function sendFile(res, path){
    let xx = fin("sendFile")
    
    fn = require.resolve( path );
    xx.log(fn)
    fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          res.send(`<!-- FILE NOT FOUND ${fn} -->`)
          xx.x(-1)
          return -1;
        } else {
            res.send(data);
            xx.x(0)
            return 0
        }
      });
    xx.x(0);
}

// ===============================================================


const RE_UnderscoreCheck = /(^_|_$)/;
var _log, _logError

function log(...args){
    if(!_log) {
        _log = BRUNEL.util.logger.getLogger( "tigerUtils" );
        logError = _log.error;
    }
    _log(...args);
}

function logError(...args){
    if(!_logError) {
        _logError = BRUNEL.util.logger.getLogger( "tigerUtils" ).error;
    }
    _logError(...args);
}

const dummyFunction = function(){ return null };

if( BRUNEL.silent ) _log = dummyFunction;

class PromiseMonitor {
};



   // ========================================================================================== simpleClone

    /**
     * Returns a simplified clone of a given object. The clone
     * excludes any functions and empty objects {}
     * Objects are cloned to a depth by using the function recursively. 
     * By default there is a limit of 10 on the depth of recursion 
     * although this can be increased by passing a higher number as 
     * maxDepth parameter. 
     * Members of the object may be excluded by providing a regexp 
     * that matches the pattern(s) of the key(s) to be excluded, or 
     * a string that matches a the keys exactly (case-sensitive).
     * Any key that begins or ends in underscore _ is not cloned. 
     * The key is excluded from the cloned object.
     * Functions are not copied.
     * @param {*} pObject 
     * @param {*} params Object that contains parameters: 
     *              excludeKey  - see above
     *              maxDepth    - see above
     *              currentDepth - set only internally to keep 
     *                             track of recursion
     */
    
    function simpleClone( pObject, params = {} ){

        let  bExclude ;
        let { excludeKey, maxDepth, currentDepth } = params ;

        if( !maxDepth ) maxDepth = 10;
        if( !currentDepth ) currentDepth = 1;

        // If nothing is given, return null
        if( !pObject ) return null;

        // If a string, return the string
        if( typeof pObject === "string" ){

            return pObject;
        }
        // If a date, return a copy of the date
        if ( pObject instanceof Date ) 
            return new Date( pObject );
    
        // If a function, return a placeholder for the function with its name for Information only
        if ( pObject instanceof Function )
            return `[FUNCTION: ${pObject.name}]`;


        // If an array, construct a copy of the array
        if( Array.isArray( pObject ) ){
            // Empty copy
            let newA = [];
            // Check each item in the array, using simpleClone recursively
            pObject.forEach( item=>{
                let xo = simpleClone( item, excludeKey, maxDepth, currentDepth+1 );
                // Even if the returned item is null, push it ( to preserve indexing )
                newA.push( xo );
            })

            //if ( maxDepth == 1) console.log( "RETURNING CLONE" , newA )
            return newA;
        } 
    
        // If an object other than array, then clone the object
        if ( typeof pObject == "object" ){
            
            // If this object is too deep in the hierarchy, then return a placeholder only, (for information)
            if( currentDepth > maxDepth ) return `[OBJECT NESTING TOO DEEP, Max depth is ${maxDepth}]` ;

            // New empty object
            let newO = {};

            // get all the keys and process them one by one
            let keys = Object.keys( pObject );
            keys.forEach( K => {
                // does the name begin or end with an underscore, if so we do not copy it
                bExclude = RE_UnderscoreCheck.test(K);
                
                // check if the key matches the exclude pattern first
                if(!bExclude) if( excludeKey ){
                    // Is the excludeKey a regex or just a string?
                    if( excludeKey instanceof RegExp ){
                        bExclude = excludeKey.test( K );

                    } else if( typeof excludeKey === "string" ){
                        bExclude = ( excludeKey == K )
                    }
                }

                // if the key is excluded then do not add it
                if( bExclude ) return;
                
                // Get the value of the Key
                let po = pObject[K];

                // If it is a function discard it
                if(  po instanceof Function  ) { return ; } 

                // If it is a date, put a copy of the date into the object
                if( po instanceof Date ) { newO[K] = new Date( po ) ; return ; }
                
                // If it is an object or an array, then clone it recursively
                if( typeof po == "object" || Array.isArray( po ) ) { 
                        // Notice how we increment the depth
                        let xo = simpleClone ( po, excludeKey, maxDepth, currentDepth+1 ) 
                        // If nothing was returned, then do not set anything on the clone
                        if( !xo ) return;
                        // Check that something was returned from the clone
                        newO[K] = xo;
                        return;
                    } 
                // Whatever it is, just set it on the new object;
                newO[K] = po;
                return;

            })
    
            // Check if we have an object with no keys, if so do not clone it
            if ( Object.keys( newO ).length == 0 && currentDepth > 1 ) return null;

            // Return the newly-constructed copy
            return newO;
        
        } 
        
        // some other elementary type that we do not need to clone, so just return its value.
        return pObject;
    
    }


    // ========================================================================================== getRandom
    function getRandom(max){
        return Math.round( Math.random()*max )
    }

    // ========================================================================================== r255
    function r255() { return getRandom(255) };


    // ========================================================================================== hhmm
    function hhmm( ddd ){ 
        
        if( !ddd ) ddd = new Date();
        var sDts = ddd.toISOString();
        return sDts.substr(11,5);
    }

    // ========================================================================================== hhmmss
    function hhmmss( ddd ){ 
        
        if( !ddd ) ddd = new Date();
        var sDts = ddd.toISOString();
        return sDts.substr(11,8);
    }

    // ========================================================================================== yyyymmdd_hhmmss
    function yyyymmdd_hhmmss( ddd ){
        if( !ddd ) ddd = new Date();
        var sDts = ddd.toISOString();
        return sDts.substr(0, 4) + sDts.substr( 5, 2) + sDts.substr(8, 2) + "_" + sDts.substr(11,2) + sDts.substr(14,2) + sDts.substr(17,2);
    }

    function dts(){
        return yyyymmdd_hhmmss()
    }
    

    
// ========================================================================================== getUID
/**
 * Generates a 36-character UID in standard format
 */
function getUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function parseWSMessage( wsmsg ){
    //log("parseWSMessage", wsmsg);
    let oMsg = null;
    try{
        oMsg = JSON.parse( wsmsg );
        //log("after JSON.parse", oMsg);
        preprocessJSON( oMsg );
        //log("after preprocessJSON", oMsg);
    } catch(e) {
        oMsg = {
            msgType: "not_json"
            , msg: wsmsg
            , e: e
        }
    }
    return oMsg;
}

// ========================================================================================== util_preprocessJSON
/**
 * Takes an object or any item that has been constructed using JSON.parse(), and converts all data
 * items whose string values can be represented as valid JS types. The data values are changed in situ
 * if the top-level entry is an object, and the converted value/object is also returned.
 * @param {*} entry 
 */
function preprocessJSON( entry ){
    //console.log( "preprocessing", entry);
    // Pre-process the body to convert text values that are numbers, boolean
    // or dates into corresponding types.

    switch( typeof entry ){
        case "number": return entry;
        case "string": return stringToElementaryType( entry );
        case "object":
            if( !entry ) return null;
            // forEach method indicates an array
            if( entry.constructor )
                if( entry.constructor.name === "Date" ) return entry;

            if( entry.forEach ){
                try { 
                    entry.forEach( (item, index)=>{
                            entry[index] = preprocessJSON( item );
                        })
                    return entry;
    
                } catch (e) {
                    console.error( e )
                    return null;
                };
    
            }

            // otherwise go through members of the object
            for( let [key, value] of Object.entries( entry )){
                entry[key] = preprocessJSON( value )
            }
            return entry;
        
    }

}

    // ======================================================================================================= stringToElementaryType
    function checkInt(xx){
        let int_regexp = /^-?(0|[1-9]\d*)$/g                 // regular expression to check integer value
        return int_regexp.test( xx )
    }
    function checkDecimal(xx){
        let dec_regexp = /^-?(0|[1-9]\d*)(\.\d+)?$/g         // regular expression to check for decimal (n.n) value
        return dec_regexp.test( xx );
    }
    /**
     * Recasts a string as one of the javascript basic types, by checking convertibility. If no
     * conversion is possible returns the string. Types are Integer, Number (Float), Boolean and Date
     * @param {*} xxx String to be converted to an elementary type if possible.
     */
    function stringToElementaryType( xxx ){
        //console.log( "string", typeof xxx , xxx)
        if( xxx.length === 0 ) return xxx;
        if(checkInt( xxx )) return parseInt( xxx ); 
        if(checkDecimal( xxx )) return parseFloat( xxx );
        switch(xxx){
            case "null": return null;
            case "true": return true;
            case "false": return false;
            default: return xxx;
        }

        
    };

module.exports = {
    // This section includes all the util functions provided by TigerApp
    simpleClone: simpleClone        // Returns a simple clone of an object suitable for serialising to be sent via web service
    , getRandom: getRandom          // Returns a random number
    , r255: r255                    // Random number in the range 0-255
    , hhmm: hhmm                    // Timestamp as string hhmm
    , hhmmss: hhmmss                // Timestamp as string hhmmss
    , yyyymmdd_hhmmss: yyyymmdd_hhmmss // Full timestampe
    , dts: dts                      // dts format for including in objects when modifying or creating, same as yyyymmdd_hhmmss
    , getUID: getUID                // Returns 
    , preprocessJSON: preprocessJSON
    , parseWSMessage: parseWSMessage
    , PromiseMonitor: PromiseMonitor

    , getCookie
    , sendScript
    , sendCSS
    , sendFile
    , fin
    , dts 
}