const pug = require("pug");
const fs = require("fs");
const fin = require("./tracing").fin;

module.exports = exports = getScript ;

const noData = {};
const pagesCompiled = {};

function getScript( name ){
    xx = fin(`getScript()`)
    try{
        let fn = require.resolve( `./public/javascripts/${name}.js`);
        xx.log(fn)
    } catch(e) {
        xx.log(`Error on getting script ${name}`, e);
        xx.x(-1)
        return "";
    };

    fs.readFile(fn, 'utf8', (err, script) => {
        if (err) {
            console.error(err);
            return `<!-- SCRIPT FILE ${name} NOT FOUND -->`;
             
        }
        
        xx.x(0)
        return script;
    });
}


