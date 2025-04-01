/** 
 * Provides an application-wide event generation process to support event-driven programming
 * 
 */

const EventEmitter = require("node:events");

const  myEmitter = new EventEmitter();

function raise( eventStream, eventData ){
    myEmitter.emit( eventStream, eventData )
}

function listen( eventStream, listener ){
    if(typeof(listener)=="function"){
        myEmitter.addListener( eventStream, listener )
    }
}

function customer_new( eventData){
    raise("customer_new", eventData )
}

function addStream(streamName){
    if(! exports[streamName] ){
            
        exports[streamName] = function(data){
            raise( streamName, data )
        }
    }
}
Object.assign(exports, { raise, listen, customer_new, addStream });
