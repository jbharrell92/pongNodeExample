// Require the functionality we need to use:
var http = require('http'),
    url = require('url'),
    path = require('path'),
    mime = require('mime'),
    path = require('path'),
    fs = require('fs'),
    io = require('socket.io');

// Make a simple fileserver for all of our static content.
// Everything underneath <STATIC DIRECTORY NAME> will be served.
var app = http.createServer(function(req, resp){
    var filename = path.join(__dirname, "./static/", url.parse(req.url).pathname);
    (fs.exists || path.exists)(filename, function(exists){
        if (exists) {
	    fs.readFile(filename, function(err, data){
	        if (err) {
		    // File exists but is not readable (permissions issue?)
		    resp.writeHead(500, {
			"Content-Type": "text/plain"
		    });
		    resp.write("Internal server error: could not read file");
		    resp.end();
		    return;
		}

		// File exists and is readable
		var mimetype = mime.lookup(filename);
		resp.writeHead(200, {
  		    "Content-Type": mimetype
		});
		resp.write(data);
		resp.end();
		return;
	    });
	}else{
	    // File does not exist
	    resp.writeHead(404, {
		"Content-Type": "text/plain"
	    });
	    resp.write("Requested file not found: "+filename);
	    resp.end();
	    return;
	}
   });
});
var arrayOfPlayers = [];
app.listen(3456);
io.listen(app).sockets.on("connection", function(socket){
    // This closure runs when a new Socket.IO connection is established

    socket.on("lookForPlayer", function(data){
    	socket.name = data.name;
    	socket.opponent = null;
    	console.log("Server received lookForPlayer request");
    	var socketIndex = arrayOfPlayers.indexOf(socket);
    	if( socketIndex == -1 ) {
    		arrayOfPlayers.push(socket);
    		console.log("Pushing player onto array.");
    	}
    	for(var i = 0; i < arrayOfPlayers.length; i++) {
    		if(arrayOfPlayers[i].opponent == null && arrayOfPlayers[i] != socket) {
    			console.log("Found player " + arrayOfPlayers[i].name + " for " + socket.name);
    			socket.opponent = arrayOfPlayers[i];
    			socket.opponent.opponent = socket;
    		}
    	}
    	if(socket.opponent != null){
    		socket.emit("PlayerFound", {name: socket.opponent.name});
    		socket.opponent.emit("PlayerFound", {name: socket.name});
    	} else {
    		socket.emit("PlayerNotFound");
    	}
    });

    socket.on("PlayGame", function(data){
    	socket.play = data.play;
    	if (socket.play && socket.opponent.play)
    	{
    		socket.emit("GameStart");
    		socket.opponent.emit("GameStart");
    	}
    	else if (socket.play && !socket.opponent.play)
    	{
    		socket.emit("CheckOpponent");
    	}
    	else
    	{
    		socket.opponent.emit("PlayerDoesNotWantToPlay", {name: socket.name});
    	}
    })

    // Send a message from the server to the client:
    socket.emit("message", {some:"data"});

    // Listen for the "reflect" message from the server
	socket.on("reflect", function(data){
		socket.opponent.emit("reflect", data);
	});

	socket.on("launch", function(data){
		console.log("Ball launched. Angle: %f Direction: %f", data.angle, data.direction);
		socket.opponent.emit("launch", data);
	});
});


