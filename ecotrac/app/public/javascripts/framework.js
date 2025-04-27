
function loadDIV(divName, data)
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", `/d/${divName}`, false);
    xmlhttp.send();
    
}

