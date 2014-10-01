/// <reference path="pubnub/pubnub_pong.js" />
/// <reference path="objects/balls.js" />
/// <reference path="objects/bricks.js" />
/// <reference path="objects/paddles.js" />
/// <reference path="objects/skydome.js" />
/// <reference path="objects/walls.js" />
/// <reference path="global.js" />
/// <reference path="init.js" />
/// <reference path="main.js" />
/// <reference path="objects/paddles.js" />
/// <reference path="global.js" />
/**
 * Actions
 */

//function start() {
//	$('#intro, #overlay').fadeIn(1500);
//	gameStates[currentGameState].running = true;

//	$('.start .button').on('click', function(e) {
//		e.preventDefault();
//		$('#intro, #overlay').fadeOut();
//		gameStates[currentGameState].running = false;
//		currentGameState = gameStates[currentGameState].transitions.play;
//		gameStates[currentGameState].running = true;
//	});
//}

// ATI: When the user presses the START button, show the DIV that tells them we are waiting
//  for their opponent to start the game.
function start()
{
    $('#intro, #overlay').fadeIn(1500);
    gameStates[currentGameState].running = true;

    $('.start .button').on('click', function (e)
    {
        e.preventDefault();
        // ATI: Hide the intro and overlay divs.
        $('#intro, #overlay').fadeOut();
        gameStates[currentGameState].running = false;

        // ATI: Show the waiting for opponent DIV.
        $('#waiting_for_remote_player').fadeIn();

        currentGameState = gameStates[currentGameState].transitions.play;
        // gameStates[currentGameState].running = true;

        // The user hit the START button, set the flag that tells everyone they are ready to play.
        g_local_player_is_ready = true;

        // Let the other player know we are ready to play by sending a READY message over the PubNub network.
        publishReadyMessage();

        // If the remote user already told us they are ready to play, start the game now.  Otherwise
        //  the game will start when we receive the READY message from them.
        if (g_remote_player_is_ready)
            startGame();
    });
}

// ATI: This method is called when we receive the READY message from the other player.
function startGame()
{
    // ATI: Hide the waiting for opponent DIV.
    $('#waiting_for_remote_player').fadeOut();

    // Start the game loop.
    // currentGameState = gameStates[currentGameState].transitions.play;
    gameStates[currentGameState].running = true;

}

function freeze()
{
	$('#paused, #overlay-small').fadeIn(500);
	gameStates[currentGameState].running = true;

	$('.continue .button').on('click', function(e) {
		e.preventDefault();
		$('#paused, #overlay-small').fadeOut();
		gameStates[currentGameState].running = false;
		currentGameState = gameStates[currentGameState].transitions.resume;
		gameStates[currentGameState].running = true;
	});
}

function lose() {
	$('#lose, #overlay').fadeIn(1500);
	gameStates[currentGameState].running = true;
}

function reset() {
	$('#reset, #overlay-small').fadeIn(1500);
	gameStates[currentGameState].running = true;

	$('.reset .button').on('click', function(e) {
		e.preventDefault();
		$('#reset, #overlay-small').fadeOut();
		objects['balls'].objects[0].reset();
		gameStates[currentGameState].running = false;
		currentGameState = gameStates[currentGameState].transitions.restart;
		gameStates[currentGameState].running = true;
	});
}

// ATI: Call the update method on all the objects in the given object container.
function updateObjects(collectionName)
{
    for (var i = 0; i < objects[collectionName].objects.length; i++)
        objects[collectionName].objects[i].update();
}

// ATI: Update the status of all balls in play.
function updateBalls()
{
    updateObjects('balls');
}

// ATI: Update the status of all paddles in play.
function updatePaddles()
{
    updateObjects('paddles');
}

//function update() {
//	if (objects['bricks'].objects.length > 0) {
//		if (lives > 0) {
//		    if (!touchedFloor)
//		    {
//		        updateBalls();
//		        updatePaddles();
//				$('dd.score').html(score);
//			} else
//			{
//                // ATI: Player lost a point.
//				lives--;
//				$('dd.lives').html(lives);
//				gameStates[currentGameState].running = false;
//				currentGameState = gameStates[currentGameState].transitions.reset;
//				touchedFloor = false;
//				if (lives == 0) {
//					$('#lose').fadeIn();
//					$('#overlay-small').fadeIn();
//				}
//			}
//		}
//		else {
//			gameStates[currentGameState].running = false;
//			currentGameState = gameStates[currentGameState].transitions.lose;
//			console.log(lives);
//		}
//	} else {
//		$('#win').fadeIn();
//	}
//	stats.update();
//}

// Update player 1's score on the web page with the given.
function updatePlayer1Score(score)
{
    if (typeof (score) == 'undefined' || score == null)
        throw "The score is unassigned.";

    $('#player1_score').html("Player 1: " + score);
}

// Update player 2's score on the web page with the given.
function updatePlayer2Score(score)
{
    if (typeof (score) == 'undefined' || score == null)
        throw "The score is unassigned.";

    $('#player2_score').html("Player 2: " + score);
}


// ATI: Update the game objects.  This method is called by the game loop when the game is in the
//  "run" state. (See globals.js).
function update()
{
    if (objects['bricks'].objects.length > 0)
    {
        // ATI: Has either player won yet?
        if (gPlayerScore1 < MAX_SCORE && gPlayerScore2 < MAX_SCORE)
        {
            // ATI: No.  Analyze the state of the game.
            if (touchedFloor)
            {
                // ATI: Player # 2 scores a point because Player # 1 missed the ball.
                gPlayerScore2++;
                updatePlayer2Score(gPlayerScore2);

                // gameStates[currentGameState].running = false;
                // currentGameState = gameStates[currentGameState].transitions.reset;

                // AIT: Reset the touched ceiling variable.
                touchedFloor = false;

                //if (lives == 0)
                //{
                //    $('#lose').fadeIn();
                //    $('#overlay-small').fadeIn();
                //}
            }
            else if (touchedCeiling)
            {
                // ATI: Player # 1 scores a point because Player # 2 missed the ball.
                gPlayerScore1++;
                updatePlayer1Score(gPlayerScore1);

                // AIT: Reset the touched ceiling variable.
                touchedCeiling = false;
            }

            // ATI: If the game is still running keep the balls and paddle supdated.
            if (gameStates[currentGameState].running)
            {
                updateBalls();
                updatePaddles();
            }
        }
        else
        {
            gameStates[currentGameState].running = false;
            currentGameState = gameStates[currentGameState].transitions.lose;

            console.log("Game over.");
            // console.log(lives);
        }
    } else
    {
        $('#win').fadeIn();
    }
    stats.update();
}

// Rendering
function render() {
	renderer.render(scene, camera);
}
