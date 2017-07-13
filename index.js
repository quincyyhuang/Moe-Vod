//Dependencies
var express = require('express')
var router = require("./router")

//Global Variables
var app = express()

//Settings
app.set('port', (process.env.PORT || 1234))
app.set('view engine', 'ejs')
app.set('videoFolder', __dirname)
app.use('/static', express.static(__dirname + '/static'))
app.use('/av', express.static('/av/av'))
app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'))
});

//Router
router(app)