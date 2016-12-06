var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./index');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({limit: '10240mb', extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    res.redirect('/w/');
});


// 에러 창
if (app.get('env') === 'development') {
    app.use(function(err, req, res) {
		var exists = fs.existsSync('./setting/WikiName.txt');
		var name;
		if(exists) {
			name = fs.readFileSync('./setting/WikiName.txt', 'utf8');
		}
		else {
			name = "오픈나무";
		}
		res.status(404).render('error', {
		    title: 'Error',
		    message: err.message,
		    error: err,
		    wikiname: name
		});
		res.end();
		return;
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
    res.status(200).res.render('error', {
		title: 'Error',
		message: err.message,
		error: {}
    });
	res.end();
	return;  
});

var debug = require('debug')('openNAMU:server');
var http = require('http');
var schedule = require('node-schedule');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/* Print Message on Server console */
console.log("Open Wiki Namu Engine Test engine is now active\n\n");
console.log("Running on Port "+ port );

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

process.on('exit', function(){

})

module.exports = app;
