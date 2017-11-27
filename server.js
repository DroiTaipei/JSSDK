var express = require('express');
var app = express();

//setting middleware
app.use(express.static(__dirname + '/tests/browser')); //Serves resources from public folder

console.log('Bind port 5000, Please browse http://localhost:5000 for testing');
var server = app.listen(5000);
