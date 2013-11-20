// Require the functionality we need to use:
var http = require('http'),
    url = require('url'),
    path = require('path'),
    mime = require('mime'),
    path = require('path'),
    fs = require('fs'),
    io = require('socket.io');

var WINS_TO_GAME = 5;

// Make a simple fileserver for all of our static content.
// Everything underneath <STATIC DIRECTORY NAME> will be served.
var app = http.createServer(function(req, resp){
    //var filename = "./static/client.html";
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
var port = process.env.PORT || 3456;
app.listen(port);
io.listen(app).sockets.on("connection", function(socket){
    // This closure runs when a new Socket.IO connection is established

    socket.on("lookForPlayer", function(data){
        for(var i = 0; i < arrayOfPlayers.length; i++) {
            if(arrayOfPlayers[i].id == data.opponent)
                socket.opponent = arrayOfPlayers[i];
        }
        if(socket.opponent.opponent != null) {
            socket.emit("PlayerBusy");
            socket.opponent = null;
        } else {
            socket.opponent.emit("challenged", {name: socket.name, challenger: socket.id, challenged: socket.opponent.id});
        }
    	
    });

    socket.on("PlayGame", function(data){
        for(var i = 0; i < arrayOfPlayers.length; i++) {
            if(arrayOfPlayers[i].id == data.challenger)
                socket.opponent = arrayOfPlayers[i];
        }
        socket.score = 0;
        socket.opponent.score = 0;
        socket.opponent.emit("GameStart");
    });

    socket.on("declined", function(data) {
        socket.opponent = null;
        for(var i = 0; i < arrayOfPlayers.length; i++) {
            if(arrayOfPlayers[i].id == data.challenger)
                arrayOfPlayers[i].emit("challengeDeclined");
        }
        data.challenger.opponent = null;
    });

    // Listen for the "reflect" message from the server
	socket.on("reflect", function(data){
		socket.opponent.emit("OppReflect", data);
	});

	socket.on("launch", function(data){
		console.log("Ball launched. Angle: %f Direction: %f", data.angle, data.direction);
		socket.opponent.emit("launch", data);
	});

	socket.on("PaddleMoved", function(data){
		socket.opponent.emit("PaddleMoved", data);
	});

    socket.on("updateScore", function(data) {
        console.log(socket.opponent.name + " scored!");
        socket.opponent.score = socket.opponent.score + 1;
        if(socket.opponent.score >= WINS_TO_GAME) {
            socket.opponent.wins++; //can you do this?
            socket.losses++;
            console.log(socket.opponent.name + " won the game!");
            socket.emit("GameOver", {winner: socket.opponent.name});
            socket.opponent.emit("GameOver", {winner: socket.opponent.name});
            socket.score = 0;
            socket.opponent.score = 0;
            for(var i = 0; i < arrayOfPlayers.length; i++){
                arrayOfPlayers[i].emit("updateScoreboard", {p1Name: socket.name, p1id: socket.id, 
                                                            p1wins: socket.wins, p1losses: socket.losses,
                                                            p2Name: socket.opponent.name, p2id: socket.opponent.id, 
                                                            p2wins: socket.opponent.wins, p2losses: socket.opponent.losses});
            }
        } else {
            socket.emit("Score", {left: socket.score, right: socket.opponent.score});
            socket.opponent.emit("Score", {left: socket.opponent.score, right: socket.score});           
        }
    });

    socket.on("gameStarted", function(data) {
        console.log(socket.id + " started the game.");
        console.log("emitting game started to " + socket.opponent.id);
        socket.opponent.emit("gameStarted", data);
    });

    socket.on("newGame", function(data) {
        socket.opponent = null;
    })

    socket.on("joinedLobby", function(data) {
        socket.name = data.name;
        socket.opponent = null;
        socket.wins = 0;
        socket.losses = 0;
        console.log("new player joined the lobby.");
        var socketIndex = arrayOfPlayers.indexOf(socket);
        if( socketIndex == -1 ) {
            arrayOfPlayers.push(socket);
            console.log("Pushing player onto array.");
        }
        for(var i = 0; i < arrayOfPlayers.length; i++) {
            arrayOfPlayers[i].emit("addToScoreboard", {name: socket.name, id: socket.id, wins: socket.wins, losses: socket.losses});
            if(arrayOfPlayers[i].id != socket.id) {
                arrayOfPlayers[i].emit("newPlayer", {text: socket.name, value: socket.id});
                socket.emit("newPlayer", {text: arrayOfPlayers[i].name, value: arrayOfPlayers[i].id});
                socket.emit("addToScoreboard", {name: arrayOfPlayers[i].name, id: arrayOfPlayers[i].id, wins: arrayOfPlayers[i].wins, losses: arrayOfPlayers[i].losses});

            }
        }      
    });
});


