events = require("./ecotrac_events")


events.listen("abc", ()=>{ log(">> abc")})

events.raise("abc", { data: "abcdata" })

events.addStream("explode")

events.listen("explode" , (msg)=>{ log(msg)})

events.explode("message 1")

function log(...args){
    console.log(...args);
}