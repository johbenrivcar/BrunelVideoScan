/**
 * This module loads the express app to handle the Brunel Ecotrac interface to administrators and to customers
 * 
 * Administrators can
 * * Start or stop the scanner system
 * * Monitor the operation of the scanner
 * * Create new customers
 * * Activate or suspend customer accounts
 * * View activity stats of customers
 * 
 * Customers can
 * * Create new scan batch folders
 * * Upload video files into batch folders
 * * Indicate that a batch folder is ready for scanning
 * * Check the progress of a scan
 * * View the scan output video in a review window
 * * Check their account status
 * * Authorise more than one login for their account(?)
 * 
 */
const eGlobal = require("../ecotrac_global");
const fs = require("fs");
const express = require("express");
const pug = require("pug");
const getPage = require("./pages/getPage");
const getScript = require("./public/javascripts/getScript")

function fin(ctxt, ...params){
    return new i(ctxt, ...params);
}

class i{
    static cIndent = "|";
    constructor(cname, ...params){
        this.cname = cname;
        this.oldIndent = i.cIndent;
        
        console.log(`${this.oldIndent}>>${this.cname}`, ...params)

        this.indent = i.cIndent = "| " + i.cIndent;
    }
    log(...params){
        console.log(`${this.indent}${this.cname}`, ...params)
    }
    x(...params){
        i.cIndent = this.oldIndent
        console.log(`${this.oldIndent}<<${this.cname}`, ...params)
    }
}

exports.fin = fin;

xx = fin("Load run.js")

const app = express();

const port = 3000;

app.get("/", (req, res)=>{ let xx = fin("get(/)")
    //xx.log("req", req)
    homePage = getPage("AppFramework");
    res.send(homePage);


    xx.x(345)});

app.get("/css/:cssName", (req, res)=>{
    pp = req.params;

    let xx = new i(`get/css`, pp.cssName);
    //xx.log("req", req);

    // return a stylesheet here
    sendCSS(res, pp.cssName ) ;
    
    xx.log(`Sent ${pp.cssName}.css`);
    xx.x(344);

});


app.get("/js/:scriptName", (req, res)=>{
    pp = req.params;
    
    let xx = fin(`get/js`, pp.scriptName)
    //xx.log("req", req)

    // return a stylesheet here
    pp = req.params;
    sendScript(res, pp.scriptName);
    xx.log(`Sent script ${pp.scriptName}`);
    xx.x(343);

});

app.post( "/f/:formName", (req, res)=>{
    console.log("");
}) ;

app.listen(port, ()=>{
    let xx = fin(`listen()`, port);
    xx.log(`Example app listening on port` , port );
    xx.x(23);
});


function sendCSS( res, name ){
    let xx = fin("sendCSS", name)
    fs.readFile(`public/stylesheets/${name}.css`, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          res.send("<!-- CSS FILE NOT FOUND -->")
          return;
        }
        res.send(data);
      });
    xx.x(425);
}

function sendScript( res, name ){
    fs.readFile(`public/javascripts/${name}.js`, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          res.send(`<!-- SCRIPT FILE ${name} NOT FOUND -->`)
          return;
        }
        res.send(data);
        return;
      });
}

xx.x();