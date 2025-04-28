const pug = require("pug");
const fs = require("fs");

module.exports = exports = getScript ;

const noData = {};
const pagesCompiled = {};

function getScript( name ){
    fs.readFile(`public/javascripts/${name}.js`, 'utf8', (err, script) => {
        if (err) {
            console.error(err);
            return `<!-- SCRIPT FILE ${name} NOT FOUND -->`;
             
        }
        
        return script;
    });
}


