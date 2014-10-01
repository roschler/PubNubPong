/// <reference path="../global.js" />
/// <reference path="C:\Users\Robert\Documents\Visual Studio 2012\Projects\WEB\PubNubBricks\PubNubBricks\data/game-data.js" />
/**
 * Paddles
 */

// ATI: Pertinent paddle values for player 1.
var PADDLE_COLOR_PLAYER_1 = 0xFF9F80;
var START_POS_X_PLAYER_1 = -1;
var START_POS_Y_PLAYER_1 = 0.4; // -0.25


// ATI: Pertinent paddle values for player 2.
var PADDLE_COLOR_PLAYER_2 = 0xcccccc;
// ATI: TODO - what are the correct values to put player 2's paddle just below the "ceiling"?
var START_POS_X_PLAYER_2  = 5;
var START_POS_Y_PLAYER_2 = -2.5;

// The number of paddles created.
var gNumPaddlesCreated = 0;

// ATI: Draw the paddles and initialize them for use for both players.
function initPaddles()
{
    // New paddle being created.
    gNumPaddlesCreated++;

    // ATI: Draw the paddle for player 1.
    drawPaddle(PADDLE_COLOR_PLAYER_1, START_POS_X_PLAYER_1, START_POS_Y_PLAYER_1, gNumPaddlesCreated);

    // New paddle being created.
    gNumPaddlesCreated++;

    // ATI: Draw the paddle for player 2.
    drawPaddle(PADDLE_COLOR_PLAYER_2, START_POS_X_PLAYER_2, START_POS_Y_PLAYER_2, gNumPaddlesCreated);
}

// ATI: Draw a paddle at the starting X, Y position and add it to the paddles collection in the objects container
//  using the given paddle number.
function drawPaddle(paddleColor, theStartPosX, theStartPosY, paddleNumber) {
	var width							= 0.6,
		height							= 0.05,
		breadth							= 0.2,
		startPosX						= theStartPosX,
		startPosY						= -theStartPosY,
//		color							= 0xffaa55;
//		color							= 0xcccccc;
		color                           = paddleColor;

    // ATI: Create the paddlel collection in the objects container if this is the first paddle to be created.
    if (typeof objects['paddles'] == 'undefined' || objects['paddles'] == null)
	    objects['paddles']					= {type: "paddles", objects: []};

    // ATI: Create the paddle object.
	var paddleObj = new Paddle(startPosX, startPosY, width, height, breadth, color, paddleNumber);

    // ATI: Draw it.
	paddleObj.draw();

    // ATI: Add it to the paddles collection.
	objects['paddles'].objects.push(paddleObj);
}

// ATI: A paddle object.
//  startPosX   : The starting X location for the paddle.
//  startPosY   : The starting Y location for the paddle.
//  width       : The width of the paddle.
//  height      : The height of the paddle.
//  color       : The paddle color.
//  paddleID    : The paddle ID.
function Paddle(startPosX, startPosY, width, height, breadth, color, paddleNumber) {
	this.width							= width;
	this.height							= height;
	this.breadth						= breadth;
	this.color                          = color;
	this.paddleNumber                   = paddleNumber;

	this.draw = function() {
		this.geometry					= new THREE.CubeGeometry(this.width, this.height, this.breadth);
		this.baseMaterial				= new THREE.MeshLambertMaterial({color: this.color});
		this.wireframeMaterial			= new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true, transparent: true});
		this.multiMaterial				= [this.baseMaterial, this.wireframeMaterial];
		this.mesh						= THREE.SceneUtils.createMultiMaterialObject(this.geometry, this.multiMaterial);
//		this.material					= new THREE.MeshPhongMaterial({color: this.color});
//		this.mesh						= new THREE.Mesh(this.geometry, this.material);
		this.mesh.position.set(startPosX, startPosY, 0);
		scene.add(this.mesh);
	}

	this.update = function() {
		this.move();
	}

	this.move = function ()
	{
		// Move with mouse
	    if (mouse.x && mouse.y)
	    {
            // if (this.paddleNumber == 1)
			this.mesh.position.x		= mouse.x;
		}
	}
}