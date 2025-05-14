"use strict";

/**
 * Admin Franework page loader
 */

const util = require("../webserver_util");
const pugUtil = require("./pug_util");
const { getCookie, sendScript, sendCSS, sendFile, fin, dts } = util;

const securityRole = "admin"

exports.sendPage = sendPage;


const pageName = "adminframework";
function sendPage(   req, res, session, pageName ){
    let xx = fin("adminFramework.sendPage")
    // 0 = Construct a default page data object
    let data = { dts: dts(), page: "adminFramework" };

    // 1 = check the session permissions


    // 2 = obtain session info from session where required

    // 3 = get/validate any relevant request parameters (e.g. from user input form)

    // 4 = obtain any data from the data store that is needed by pug to construct the page

    // 5 = call the Pug compiler to build the page and apply the data

    // 6 = send the constructed html to the client using the response object

    xx.x()
}