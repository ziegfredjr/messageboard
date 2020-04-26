$(function() {
	var socket = io();
	socket.on('connect', function() {
		socket.emit('new online', userData);
	});

	socket.on('refresh list', function(data) {
		onlineList = data;

		$('#online').empty();
		for (var i = 0; i < data.length; i++) {
			if (
				typeof data[i] !== 'undefined' && 
				data[i] !== null &&
				typeof data[i].name !== 'undefined' && 
				typeof data[i].id !== 'undefined' &&
				data[i].id !== userData.id
			) {
					$('#online').append("<li><a href='/chat?user=" + data[i].id + "'>" + data[i].name + "</a></li>");
			}
		}
	});

	//send chat
    $('form').submit(function(e) {
    	e.preventDefault(); // prevents page reloading
    	if ($('#m').val().trim().length !== 0) {
	      	socket.emit('chat message', {"sendId": chatId, "msg": $('#m').val().trim()});
	      	$('#m').val('');
	    }
      	return false;
    });

    //receive message
	socket.on('chat message', function(data) {
		if (userData.id == data.sendId) {
			$('#messages').append($('<li class="mychat">').text(data.msg));
		} else {
			$('#messages').append($('<li>').text(data.msg));
		}
	});    
});