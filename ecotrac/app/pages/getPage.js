const pug = require("pug");
const fs = require("fs");

module.exports = exports = getPage ;

const noData = {};
const pagesCompiled = {};

function getPage( name, data = noData ){
    let pfn = pagesCompiled[name]
    if(!pfn){
        
        pfn = pug.compileFile( require.resolve( "./" + name + ".pug" ) );
        pagesCompiled[name]
    }
    html = pfn( data  )
    console.log("html", html);
    return html;
}

