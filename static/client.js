//TODO

function start(event) {
	var socket = io.connect(window.location.origin);
	// generate an initial angle between -60 degrees and +60 degrees:
	var initAngle = -60 + 120*Math.random();
	 
	// randomly choose the initial direction of the ball:
	var initDirection = Math.random() < 0.5 ? -1 : 1;
	 
	// show the game canvas:
	document.getElementById("gameContainer").style.display = "block";
	 
	// initialize the game canvas:
	pong.init();
	 
	// move the ball to the center:
	pong.resetBall();
	 
	// set the ball into motion:
	pong.launch(initAngle, initDirection);
	 
	// tell the server about the ball's initial angle and direction.  For example:
	socket.emit("launch", {
		angle: initAngle,
		direction: initDirection
	});
}

document.addEventListener("DOMContentLoaded", function() {
	document.getElementById("startGame").addEventListener("click", start, false);
}, false);


