/// <reference path="start.js" />
/// <reference path="objects/paddles.js" />
/// <reference path="objects/bricks.js" />
/// <reference path="objects/balls.js" />
/// <reference path="objects/skydome.js" />
/// <reference path="objects/walls.js" />
/**
 * Global variables
 */

// ATI: Once this score is reached by either player the game ends.
var MAX_SCORE = 5;

// Scene sizes
var WINDOW_WIDTH						= window.innerWidth,
	WINDOW_HEIGHT						= window.innerHeight - 4;

// Camera settings
var ASPECT								= WINDOW_WIDTH / WINDOW_HEIGHT,
	VIEW_ANGLE							= 45,
	NEAR								= 0.1,
	FAR									= 1000;

ASPECT = 1.7778;	// Manually overridden in order to keep the aspect ratio, which helps making the game look uniform

var WIDTH								= WINDOW_WIDTH,
	HEIGHT								= WIDTH / ASPECT;

// Rendering variables
var renderer = "tset", camera, scene, stats;
var objects								= [];
var lights								= [];
var mouse								= {};

var defaultGameState					= 'menu',
	currentGameState					= defaultGameState,
	touchedFloor                        = false,
    // ATI: We check to see if the ball hit the ceiling too now.
    touchedCeiling                      = false;

// ATI: The current score for Player 1;
var gPlayerScore1 = 0;

// ATI: The current score for Player 1;
var gPlayerScore2 = 0;

// ATI: The concept of lives no longer applies to our version of the game.
//	lives								= 2;

var gameStates							= {
	menu								: {
		transitions						: {
			play						: 'game'
		},
		run								: function() {
			init();
			start();
			render();
		},
		stateType						: 'static',
		running							: false
	},
	game								: {
		transitions						: {
			lose						: 'over',
			abandon						: 'menu',
			pause						: 'paused',
			reset						: 'reset'
		},
		run								: function() {
			update();
			render();
		},
		stateType						: 'animation',
		running							: false
	},
	paused								: {
		transitions						: {
			resume						: 'game'
		},
		run								: function() {
			freeze();
		},
		stateType						: 'static',
		running							: false
	},
	over								: {
		transitions						: {
			restart						: 'game'
		},
		run								: function() {
			lose();
		},
		stateType						: 'static',
		running							: false
	},
	reset								: {
		transitions						: {
			restart						: 'game'
		},
		run								: function() {
			reset();
		},
		stateType						: 'static',
		running							: false
	}
};

var currLevel = 5; // 2;