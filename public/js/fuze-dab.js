(function($) {
	$.fn.fuze_dab = function(options) {
		console.log('DAB INIT');
		//Set defaults
		var o = $.extend({
			txt_dab: 'DAB!',
			txt_nodab: 'No dab...',
			dab_button: $('#do_dab'),
		}, options);

		var $this = $(this);
		var $usernameInput = $('#nickname');
		var $loginPage = $('#loginform');
		var $mainPage = $('#mainpage');
		var $log = $('#log ul');
		var $username = $('#username');
		var socket = io();

		var username;
		var current_frame = 1;
		var video;
		var videoFrames = {};

		var dabbing = false;

		var fps = 100;
		var videoframes = 22;
		
		var plugin = {

			cleanInput:  function(input) {
				return $('<div/>').text(input).text();
			},

			set_username: function () {
				username = plugin.cleanInput($usernameInput.val().trim());

				// If the username is valid
				if (username) {
					$loginPage.fadeOut(function() {
						$mainPage.fadeIn(function() {
							plugin.play(videoframes, fps, 'forward');
						});
					});
					
					
					
					// Tell the server your username
					socket.emit('add user', username);
				}
			},

			play: function(numFrames, fps, direction) {
				plugin.stop();
				if(!numFrames) { console.log('Parameters needed: <number of frames>, (<fps>)'); return; }
				fps = typeof fps !== 'undefined' ? fps : 25;
				fps = 1000/fps;
				video = setInterval(function() { 
					plugin.next_frame(numFrames, direction) 
				}, fps);
			},
			
			stop: function() {
				clearInterval(video);
				plugin.show_frame(0, current_frame);
			},

			next_frame: function(numFrames, direction) {
				switch(direction) {
					case 'forward':
						var prev = current_frame;
						if(current_frame == numFrames-1) {
							if(dabbing) {
								plugin.stop();
							} else {
								plugin.play(videoframes, fps, 'backward');
							}
						}
						else {
							current_frame++;
						}
					break;
					case 'backward': 
						var prev = current_frame+1;

						if(prev > numFrames) {
							prev = 0;
						}
						if(current_frame == -1) {
							current_frame = 0;
							plugin.stop();
						} else {
							current_frame--;
						}
					break;
				}
				if(current_frame == -1) {
					current_frame = 0;
				}
				plugin.show_frame(prev ,current_frame);
			},

			show_frame: function(prev, frame) {
				var number = plugin.pad2(frame,5);
				var prevNumber = plugin.pad2(prev,5);
				var prevFrame = 'img_'+prevNumber;
				var frameName = 'img_'+number;
				document.getElementById(prevFrame).className = 'none';
				document.getElementById(frameName).className = 'on';
			},

			do_dab: function() {
				plugin.play(videoframes, fps, 'forward');
				dabbing = true;
				$this.addClass('dab');
			},

			dont_dab: function() {
				plugin.play(videoframes, fps, 'backward');
				dabbing = false;
				$this.removeClass('dab');
			},

			pad: function(n){
				return n<10 ? '0'+n : n;
			},
			
			pad2: function(number, length) {
				var str = '' + number;
				while (str.length < length) {
					str = '0' + str;
				}
				return str;
			},

			log: function(msg, nostamp) {
				if (typeof nostamp === 'undefined') {
					nostamp = false;
				}
				var timestamp = '';
				if(!nostamp) {
					var now = new Date();
					timestamp = plugin.pad(now.getHours())+':'+plugin.pad(now.getMinutes())+':'+plugin.pad(now.getSeconds())+' - ';
				}
				$log.prepend('<li>'+timestamp+msg+'</li>');
				$log.find('li').removeClass('first');
				$log.find('li:first').addClass('first');
			}
		}
		
		$('#loginform form').submit(function() {
			plugin.set_username();
			return false;
		});

		var dabstart = ('ontouchstart' in document.documentElement)  ? 'touchstart' : 'mousedown';
		var dabend = ('ontouchstart' in document.documentElement)  ? 'touchend' : 'mouseup';

		o.dab_button.on(dabstart, function() {
			socket.emit('dab action', 'dab');
			plugin.log('You dabbed');
			plugin.do_dab();
		});

		o.dab_button.on(dabend, function() {
			socket.emit('dab action', 'nodab');
			plugin.dont_dab();
		});

		socket.on('dab action', function(data){
			switch(data.action) {
				case 'dab':
					plugin.do_dab();
					plugin.log(data.user+' dabbed');
					break;
				case 'nodab':
					plugin.dont_dab();
					break;
			}
		});

		socket.on('login', function (data) {
			if(data.log.length) {
				for(var i=0;i<data.log.length;i++) {
					plugin.log(data.log[i], true);
				}
			}
			
		})

		socket.on('user joined', function (data) {
			plugin.log(data.username + ' joined');
		});

		socket.on('user left', function (data) {
			plugin.log(data.username + ' left');
		});

		socket.on('reconnect', function () {
			plugin.log('you have been reconnected');
			if (username) {
				socket.emit('add user', username);
			}
		});
		
		$username.focus();
		
		
		return this;
	}
}(jQuery));