//Dependencies
var express = require('express')
var router = require("./router")
var bodyParser = require('body-parser')
var session = require('express-session')
var FileStore = require('session-file-store')(session)

//Global Variables
var app = express()

//Settings
app.set('port', (process.env.PORT || 1234))
app.set('view engine', 'pug')
app.use('/static', express.static(__dirname + '/static'))
app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'))
})

//Body parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Use the session middleware
app.use(session({
    store: new FileStore({
		logFn: () => {},
		ttl: 5*60*60
	}),
	secret: 'quincyhuang',
	resave: true,
	saveUninitialized: false
}))

//Router
app.use('/', router)