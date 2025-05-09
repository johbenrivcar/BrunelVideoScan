
$(document).ready( function(){

    $("#app-exit").on( "click", function(){
        //console.log("app-exit was clicked");
        $(this)
        $("#main-admin-area").toggleClass( "hidden");
    } )

})