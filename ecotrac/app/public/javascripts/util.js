function makeCookie(name,value){
    $.cookie(name,$.param(value),{ path: '/' });
}

function readCookie(name){
    var readCookie=$.cookie(name);
    readCookie = readCookie.split('&');
    if(readCookie.length != 0){
    for (i=0; i<readCookie.length; i++) {
        readCookie[i] = readCookie[i].split('=');
        popUps[readCookie[i][0]] = readCookie[i][1];
    }
    }
}