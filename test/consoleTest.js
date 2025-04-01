
    let fs = require("fs");
    let settings = require("./ecotrac_settings")
    console.log(settings);
    ppp = settings.ecotracRootPath
    const ecotracRootPath = ppp //.slice( 0, ppp.length -1 );

    console.log("Root path: " + ecotracRootPath);

function main(){
    
    console.log("This is a test run of the video movement detection application");
    console.log("***** Starting from " + ecotracRootPath)
    processFolder ( ecotracRootPath );

    console.log("Main module finished");
};

function processFolder(folderPath, indent = 1 ){
    console.log(">> start of folder " + folderPath, indent)
    let sIn = " | | | | | | | | | | | | | | | | | | | | | | | | | ".slice(0, indent * 2 )
    let pathsToCheck = fs.readdirSync(folderPath).sort();
    for (let i = 0; i < pathsToCheck.length; i++) {
        let itemName = pathsToCheck[i];
        let itemPath = folderPath + itemName 
        subStats = fs.statSync( itemPath )
        let isFolder = subStats.isDirectory();
        console.log( sIn + itemName + ( isFolder? " [Dir]": " [File]" ) );
        console.log("** " + itemPath)
        if(isFolder) processFolder(itemPath + "/" , indent+1 );
    };
    console.log("<< end of folder " + folderPath)
} ;


main();
console.log("Started");