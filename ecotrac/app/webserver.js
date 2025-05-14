"use strict";
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
const webserver_util = require("./webserver_util");
const { getCookie, sendScript, sendCSS, sendFile, fin } = webserver_util;
console.log("Example uuid:", webserver_util.getUID() )

const fs = require("fs");
const express = require("express");
const pug = require("pug");

const getPage = require("./getPage");

const scanData = require("./xScanData")

let xx = fin("Run.js", (new Date() ).toISOString() )
const app = express();

const port = 3000;

app.use('/', (req, res, next) => {
    let xx = fin("use(/)")
    var cookie = getCookie(req);
    xx.log("cookie", cookie);
    xx.x();    
    next();
});

app.get("/", (req, res)=>{ 
    let xx = fin("get(/)")
    //xx.log("req", req)
    homePage = getPage("CheckLogin");
    res.send(homePage);


    xx.x(345)});

app.get("/css/:cssName", (req, res)=>{
    pp = req.params;

    let xx = fin(`get/css`, pp.cssName);
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
    xx.log(`BubbleTrac app listening on port` , port );
    xx.x(100);
});


xx.x();