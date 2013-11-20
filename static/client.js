var socket = io.connect(window.location.origin);

function newGame(event) {
	document.getElementById("gameContainer").style.display = "none";
	document.getElementById("gameMessage").style.display = "none";
	document.getElementById("newGame").style.display = "none";
	document.getElementById("launchBall").style.display = "none";
	document.getElementById("hideWhilePlaying").style.display = "";
	socket.emit("newGame", {junk: "here"});
}

function joinLobby(event) {
	if(document.getElementById("playerName").value.length <= 50) {
		document.getElementById("playerList").style.display = "";
		document.getElementById("scores").style.display ="";
		socket.emit("joinedLobby", {name: document.getElementById("playerName").value});
	}
}

function start(event) {
	// generate an initial angle between -60 degrees and +60 degrees:
	var initAngle = -60 + 120*Math.random();
	 
	// randomly choose the initial direction of the ball:
	var initDirection = Math.random() < 0.5 ? -1 : 1;

	// move the ball to the center:
	pong.resetBall();
	 
	// set the ball into motion:
	pong.launch(initAngle, initDirection);
	 
	// tell the server about the ball's initial angle and direction.  For example:
	socket.emit("launch", {
		angle: initAngle,
		direction: initDirection
	});

	document.getElementById("launchBall").style.display = "none";
}

function matchMake(event) {
	var e = document.getElementById("players");
	var strUser = e.options[e.selectedIndex].value;
	socket.emit("lookForPlayer", {
		name: document.getElementById("playerName").value,
		opponent: strUser
	});
	console.log("matching player");
}

document.addEventListener("DOMContentLoaded", function() {
	document.getElementById("launchBall").addEventListener("click", start, false);
	document.getElementById("lookForPlayer").addEventListener("click", matchMake, false);
	document.getElementById("newGame").addEventListener("click", newGame, false);
	document.getElementById("joinLobby").addEventListener("click", joinLobby, false);
	document.getElementById("challenge").addEventListener("click", matchMake, false);
}, false);

window.addEventListener("paddlehit-left", function(e){
	// e.detail.hit will be true if the client hit the ball with his/her paddle.
	if (e.detail.hit) {
		console.log("HIT PADDLE.  New angle: %f", e.detail.angle); // log a message to the console
 
		// Tell our opponent via Socket.IO about the ball's new angle and position:
		socket.emit("reflect", {
			angle: e.detail.angle,
			position: e.detail.position
		});
 
		// Note: The game automatically launches the ball and determines the angle based on the ball's position relative to the paddle position.  
		// We therefore do not need to call pong.launch() in here (but our opponent will, as shown below).
	}else{
		document.getElementById("launchBall").style.display = "";
		socket.emit("updateScore")
 
		// in here, we will update the score, check for victory condition, launch a new ball (perhaps after a timeout), etc.
	}
});

window.addEventListener("paddlemove", function(e)
{
	socket.emit("PaddleMoved", {position: e.detail.position});
});

socket.on("PaddleMoved", function(data) {
	pong.updateOpponentPaddle(data.position);
});

socket.on("OppReflect", function(data) {
	pong.resetBall(960, data.position);
	pong.launch(data.angle, -1);
});

socket.on("launch", function(data) {
	document.getElementById("gameContainer").style.display = "block";
	pong.resetBall();
	pong.launch(data.angle, -data.direction);
});

socket.on("gameStarted", function(data) {
	console.log("game started");
	document.getElementById("gameContainer").style.display = "block";
	document.getElementById("matchMaking").style.display = "none";
	document.getElementById("hideWhilePlaying").style.display = "none";
	pong.init();
	pong.resetBall();
	pong.launch(data.angle, -data.direction);
});

socket.on("GameStart", function(data) {
	// generate an initial angle between -60 degrees and +60 degrees:
	var initAngle = -60 + 120*Math.random();
	 
	// randomly choose the initial direction of the ball:
	var initDirection = Math.random() < 0.5 ? -1 : 1;
	 
	// show the game canvas:
	document.getElementById("gameContainer").style.display = "block";
	document.getElementById("matchMaking").style.display = "none";
	document.getElementById("hideWhilePlaying").style.display = "none";
	 
	// initialize the game canvas:
	pong.init();
	 
	// move the ball to the center:
	pong.resetBall();
	 
	// set the ball into motion:
	pong.launch(initAngle, initDirection);

	console.log("game started");
	 
	// tell the server about the ball's initial angle and direction.  For example:
	socket.emit("gameStarted", {
		angle: initAngle,
		direction: initDirection
	});
});

socket.on("PlayerDoesNotWantToPlay", function(data) {
	alert(data.name + " does not want to play.");
});

socket.on("Score", function(data) {
	pong.setScore(data);
});

socket.on("GameOver", function(data) {
	document.getElementById("gameContainer").style.display = "none";
	document.getElementById("gameMessage").innerHTML = data.winner + " won the game!";
	document.getElementById("newGame").style.display = "";
	document.getElementById("launchBall").style.display = "none";
});

socket.on("newPlayer", function(data) {
	var opt = document.createElement("option");	
	// Add an Option object to Drop Down/List Box
	document.getElementById("players").options.add(opt);
	// Assign text and value to Option object
	opt.text = data.text;
	opt.value = data.value;
});

socket.on("challenged", function(data) {
	var r = confirm("Player " + data.name + " would like to play.");
	if(r) {
		socket.emit("PlayGame", data);
	} else {
		socket.emit("declined", data);
	}

});

socket.on("challengeDeclined", function(data) {
	alert("Your challenge was declined. :(");
});

socket.on("PlayerBusy", function(data) {
	alert("that player is unavailable right now.");
});

socket.on("addToScoreboard", function(data) {
	var ul = document.getElementById("scoreboard");
	var li = document.createElement("li");
	li.innerHTML = "" + encodeURIComponent(data.name) + ": " + " wins: " + data.wins +" losses: " + data.losses;
	li.id = data.id;
	ul.appendChild(li);
});

socket.on("updateScoreboard", function(data) {
	var li1 = document.getElementById(data.p1id);
	var li2 = document.getElementById(data.p2id);
	li1.innerHTML = "" + encodeURIComponent(data.p1Name) + ": " + " wins: " + data.p1wins +" losses: " + data.p1losses;
	li2.innerHTML = "" + encodeURIComponent(data.p2Name) + ": " + " wins: " + data.p2wins +" losses: " + data.p2losses;
});

