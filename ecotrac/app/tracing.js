/**
 * Provides a means to trace entry and exit of a function, with indentation following the
 * calling depth.
 * To use:
 *  funtion abc(){
 *      xx = fin("abc"); // Report entry to function into log and increase indent
 *      :
 *      xx.log( ...args);  // Report to log, with preceding indent to match current indent
 *      :
 *      xx.x( [..args] ); // Repor exit from function and decrease indent
 *      return;
 * }
 */

exports.fin = fin;

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

