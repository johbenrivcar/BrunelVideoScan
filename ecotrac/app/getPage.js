const pug = require("pug");
const fs = require("fs");

module.exports = exports = getPage ;

const noData = {};
const pagesCompiled = {};

function getPage( name, data = noData ){

    if(name.substring(-4) != ".pug")  name += ".pug"
            
    let pfn //= pagesCompiled[name]
    if(!pfn){
        
        pfn = pug.compileFile( require.resolve( "./" + name ) );
        pagesCompiled[name] = pfn
        
    }
    html = pfn( data  )
    console.log("html", html);
    return html;
    


}

