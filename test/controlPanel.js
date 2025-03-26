const { on } = require("events")

/*

*/

/**
 * This module writes the current status of processing to an html file that can be loaded into a browser to see what is going on
 */

function updatePage( allStats ){
/*
  allStats contains:
    filesProcessed - an array, in reverse time order, of all the files processed in the current session. Each entry contains
        fullPath - incoming path to the file
        arrivalTime - the time the file arrived
        arrivalEventNumber - the event number (count) on which the file arrived
        status - the processing status of the file
        statusInfo - further information about the status
        processStartTime - the time at which processing started
        processEndTime - the time at which processing ended
        processElapsedTime - how long it took to process the file

 */
}