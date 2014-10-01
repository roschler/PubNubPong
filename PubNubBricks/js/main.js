/// <reference path="objects/balls.js" />
/// <reference path="objects/bricks.js" />
/// <reference path="objects/paddles.js" />
/// <reference path="objects/skydome.js" />
/// <reference path="objects/walls.js" />
/// <reference path="global.js" />
/// <reference path="init.js" />
/// <reference path="start.js" />
/**
 * Base code:
 * DONE: All
 *
 * Additional:
 * DONE: Performance stats
 * TODO: Game stats (lives, level, etc.)
 * TODO: Code optimisation
 * DONE: Code refactoring and re-organisation
 * TODO: Code minification
 */

//init();
//animate();

window.requestAnimFrame = (function(){
	return (window.requestAnimationFrame
		||	window.webkitRequestAnimationFrame
		||	window.mozRequestAnimationFrame
		||	function(callback) {
				window.setTimeout(callback, 1000 / 60);
			}
	);
})();

(function gameLoop() {
    // if (lives > 0) {
    // ATI: Figuring this out right now.
	if (true) {
	        requestAnimFrame(gameLoop);
		if (gameStates[currentGameState].stateType == 'static' && !gameStates[currentGameState].running) {
			gameStates[currentGameState].run();
		} else if (gameStates[currentGameState].stateType == 'animation') {
			gameStates[currentGameState].run();
		}
	}
})();