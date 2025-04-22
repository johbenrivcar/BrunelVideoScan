

var objCount = 0;
async function testObject(t){
    xx = { t, a:10, b:5, id: ++objCount };
    setTimeout(()=>{
        xx.a = xx.a - 1
        console.log( `A${t} After ${t} seconds:`, xx)
    } , 1000*t )
    setTimeout( ()=>{
        xx.b = xx.b - 1
        console.log( `B${t} After ${3*t} seconds:`, xx)
    }, 3000*t)
}

result = ( function aa(){

    testObject(1);
    testObject(2);
    testObject(3);
    console.log("READY")

} )();