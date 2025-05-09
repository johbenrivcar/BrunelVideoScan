



const fs = require("fs")

const settings = require("../../ecotrac_global");

/**
 *  This module implemenets a means of saving session data to files.
 *  Session data is keyed on sessionID which is stored in a cookie on the
 *  client.
 * 
 *  Session data is stored as JSON text encrypted in files named by hashed SessionID
 */

function getSessionForReq( req , cbfunction ){



}