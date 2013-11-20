//TODO

var socket = io.connect(window.location.origin);

function newGame(event) {

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
	socket.emit("lookForPlayer", {
		name: document.getElementById("playerName").value
	});
	console.log("Looking for player");
}

document.addEventListener("DOMContentLoaded", function() {
	document.getElementById("launchBall").addEventListener("click", start, false);
	document.getElementById("lookForPlayer").addEventListener("click", matchMake, false);
	document.getElementById("newGame").addEventListener("click", newGame, false);
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
	document.getElementById("gameContainer").style.display = "block";
	document.getElementById("matchMaking").style.display = "none";
	pong.init();
	pong.resetBall();
	pong.launch(data.angle, -data.direction);
});

socket.on("PlayerFound", function(data) {
	var r = confirm("Player " + data.name + " would like to play.");
	socket.emit("PlayGame", {play: r});
});

socket.on("PlayerNotFound", function(data) {
	alert("No player found. Searching...");
});

socket.on("GameStart", function(data) {
	// generate an initial angle between -60 degrees and +60 degrees:
	var initAngle = -60 + 120*Math.random();
	 
	// randomly choose the initial direction of the ball:
	var initDirection = Math.random() < 0.5 ? -1 : 1;
	 
	// show the game canvas:
	document.getElementById("gameContainer").style.display = "block";
	document.getElementById("matchMaking").style.display = "none";
	 
	// initialize the game canvas:
	pong.init();
	 
	// move the ball to the center:
	pong.resetBall();
	 
	// set the ball into motion:
	pong.launch(initAngle, initDirection);
	 
	// tell the server about the ball's initial angle and direction.  For example:
	socket.emit("gameStarted", {
		angle: initAngle,
		direction: initDirection
	});
});

socket.on("PlayerDoesNotWantToPlay", function(data) {
	alert(data.name + " does not want to play.");
});

socket.on("CheckOpponent", function(data) {
	alert("Waiting on Opponent");
});

socket.on("Score", function(data) {
	pong.setScore(data);
});

socket.on("GameOver", function(data) {
	document.getElementById("gameContainer").style.display = "none";
	document.getElementById("gameMessage").innerHTML = data.winner + " won the game!";
	document.getElementById("newGame").style.display = "";
	document.getElementById("launchBall").style.display = "none";
})

