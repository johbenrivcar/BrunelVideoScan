let ddd = new Date()


const log = require( "./logger" ).getLogger("tester");


log("This is a test log ", "message" )

fs = require("fs");

fs.readFile('../.git/HEAD', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(data);
  });