
async function main(){
    
    let fs = require("fs");
    console.log("This is a test run of the video movement detection application");

    const pathsToCheck = ['./node_modules'];

    for (let i = 0; i < pathsToCheck.length; i++) {
        fs.stat(
            pathsToCheck[i], 
            (err, stats) => {
                console.log("----\nIs directory?", stats.isDirectory());
                console.log(stats);
            }
        );
    } ;


    console.log("Main module finished");
};

main();
console.log("Started");