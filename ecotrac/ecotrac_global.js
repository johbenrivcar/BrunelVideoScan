

function dts(){
    ss = (new Date()).toISOString().substring(0,19).replace(/[-T:]/g, "" );
    return ss
};

module.exports = exports = {
    RUN_MODE: ""
    , dts
}
console.log("### global MODULE LOADED")
//console.log( "dts: [" +  dts() + "]" );