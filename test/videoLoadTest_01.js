
const fs = require("fs");

const ffmpeg = require("ffmpeg");

console.log("Start //////////////////////////////////////////////////////////");
try {
    var vidFile = fs.stat("videos/test_01.mp4", (err, stats)=>{
        if(err){ throw err; };
        if(!err) {
            console.log(stats.isDirectory());
            console.log(stats);
            console.log("------------------------------------------------------");

            var process = new ffmpeg('videos/test_01.mp4');
            process.then(function (video) {
                processVideo(video);
            }, function (err) {
                console.log('Error: ' + err);
            });
            
            console.log("------------------------------------------------------");
        };
    })
} catch (e) {
    console.log("Error was thrown *****************************");
	console.log(e.code);
	console.log(e.msg);
    console.log("**********************************************");
}

console.log("END //////////////////////////////////////////////////////////");


function processVideo(video){
    
    console.log('The video is ready to be processed');
    console.log('video.metadata: ------------------------------------------------');
    // Video metadata
		console.log(video.metadata);
		// FFmpeg configuration
    console.log('\nvideo.info_configuration: ------------------------------------------------');
		console.log(video.info_configuration);

    console.log('Video processing complete ////////////////////////////////')

}