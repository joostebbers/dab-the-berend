var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var numUsers = 0;
var log = [];

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});
app.use(express.static('public'));

io.on('connection', function(socket){
	var addedUser = false;
	
	function add_log(msg) {
		var now = new Date();
		var timestamp = pad(now.getHours())+':'+pad(now.getMinutes())+':'+pad(now.getSeconds())+' - ';
		log.push(timestamp+msg);
		if(log.length > 40) {
			log.pop();
		}
	}
	function pad(n){return n<10 ? '0'+n : n}

	// when the client emits 'add user', this listens and executes
	socket.on('add user', function (username) {
		if (addedUser) return;

		// we store the username in the socket session for this client
		socket.username = username;
		++numUsers;
		add_log(socket.username+' joined');
		addedUser = true;
		socket.emit('login', {
			numUsers: numUsers,
			log: log
		});
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('user joined', {
			username: socket.username,
			numUsers: numUsers
		});
	});

	socket.on('dab action', function(action){
		add_log(socket.username+' dabbed');
		socket.broadcast.emit('dab action', {
			action: action,
			user: socket.username
		});
	});

	socket.on('disconnect', function(){
		if (addedUser) {
			--numUsers;
			add_log(socket.username+' left');
			// echo globally that this client has left
			socket.broadcast.emit('user left', {
				username: socket.username,
				numUsers: numUsers
			});
		}
	});
});

http.listen(80, function(){
	console.log('listening on *:80');
});