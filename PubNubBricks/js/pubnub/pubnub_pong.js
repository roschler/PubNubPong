/// <reference path="../global.js" />
/// <reference path="../start.js" />
/*
    FILE: pubnub_pong.js

    PubNub related code for managing the link between to chess players playing chess via the chess.html web page.

    (c) 2014 Android Technologies, Inc.

    Published under the MIT license


    --------------------------- PubNub Pong: game board details synchronization notes -------------------

    This text explains how the two game boards belonging to the pair of players in a game are kept in sync 
    using the PubNub real-time message network.

    SYNC message format:

    - I_AM_MASTER_FLAG (Y/N)
    - Remote (sender's) paddle mesh location, X and Y.
    - Bricks map list of tuples one for each map cell (cell count = 11 rows x 33 columns) .  Tuple format: 
        brick_exists (T/F), collision count (0 - 9), brick color ID (a-z)
    - Current ball mesh X and Y, velocity, angle

    READY message format:  "READY"
 
    Messaging Strategy:

    The game waits for the READY message from the remote playerbefore launching the ball.  The 
        READY message is sent out when a user hits the START button in the game.  The game
        does not start until both READY messages have been published over PubNub.

    - The code maintains an I_AM_MASTER flag.  Initially TRUE for the for the side playing paddle #1, 
        and FALSE for the side playing paddle #2
    - The code maintains an IGNORE_REMOTE_MASTER_FLAG flag.  Initially FALSE for both sides.
    - Paddle #1 starts out as master.  That is the side that initially "launches" the ball at 
        the start of the game.
    - The code sends out a SYNC message 10 times a second on an interval timer.
    - When the ball touches a paddle, that side sets their IGNORE_REMOTE_MASTER_FLAG and starts a 1/2 second 
        timeout interval to clear the flag.  That side also sends out an immediate SYNC message.
    - When a SYNC message is received, the receiving side checks the SYNC message to see if the I_AM_MASTER 
        flag is Y (for Yes).  If the receiving side's IGNORE_REMOTE_MASTER_FLAG is set, then their I_AM_MASTER 
        flag is set to FALSE.  Then the SYNC message is processed using the following logic:  If the current 
        side is master than only the remote paddle location is processed, so the receiving side's paddle 
        location for the remote player is kept in sync.  Otherwise, all the fields are processed thereby 
        updating the receiving side's brick map, and the ball's velocity and angle too.

    Additional notes on the messaging strategy: The logic of the messaging strategy is based on the idea that 
        whoever hit the ball last has the best view of the game elements, especially ball direction and any 
        bricks that were recently broken.  The I_AM_MASTER flag in the SYNC message drives this process.  
        Whoever hit the ball last takes possession of this flag and the other side clears their I_AM_MASTER 
        flag in a cooperative manner.

    However, there is a risk of one player getting control of the I_AM_MASTER flag before the other side 
        has had a chance to clear theirs.  If left unchecked, this condition could lead the side that just 
        took control of the flag to relinquish it incorrectly due to lagging incoming SYNC messages that 
        still have the I_AM_MASTER flag set.  

    This "collision" is solved by the IGNORE_REMOTE_MASTER_FLAG flag.  The ball takes at least 1/2 second 
        to traverse the court between paddles even if the court is fully clear of bricks.  Therefore, there 
        is no chance of the other side hitting the ball within 1/2 second of our paddle hit.  The 
        IGNORE_REMOTE_MASTER_FLAG solves this potential message collision problem by filtering out any 
        incoming SYNC messages with the I_AM_MASTER flag set that are really just lagging SYNC messages.  
        The net result is that SYNC messages that were sent before the remote side had a chance to clear 
        their I_AM_MASTER flag after we told it to are properly ignored with one exception. We do stil
        update the remote paddle location from the SYNC message because the remote side is stil the
        only valid source for that information.

    NOTE: The side that *isn't* initially master uses the first SYNC message from the other side to
        completely replace it's game board contents with the remote side's, so they have the same
        bricks layout.  This is necessary because the game creates a new bricks layout randomly with
        each new game.

*/

// The chat related HTML elements.
var $chat_form = null;
var $output = null;
var $input = null;

// See the App object for an explanation of these three global variables.
var g_local_uuid = null;
var g_remote_uuid = null;
var g_pubnub_pong_channel = null;
var g_local_skill_level = null;

// What paddle the current user is, 1 or 2 (Paddle #1 or Paddle #2)
var g_paddle_number = null;

// The URL arguments passed to us.
var g_url_arguments = null;

// This flag is set to TRUE when the REMOTE user sends us the READY message, indicating they are ready to play.
var g_remote_player_is_ready = false;

// This flag is set to TRUE when the LOCAL user presses the START button, indicating they are ready to play.
var g_local_player_is_ready = false;

// The timer routine that executes 10 times a second and sends the SYNC message that updates the other side with
//  our current game board details.
var g_sync_timer_interval = null;

// This flag is set to TRUE when we are currently the sync source of game board details.
var g_i_am_master_flag = false;

// This flag is set to TRUE after we hit the ball and therefore take the master spot.  
var g_ignore_remote_master_flag = false;


// Publish the ready message over the game channel to let the other player know we are ready to play.
function publishReadyMessage()
{
    console.log("Publishing READY message to target: " + g_remote_uuid + " over Pubnub channel: " + g_pubnub_pong_channel);

    pubnub.publish({
        channel: g_pubnub_pong_channel,
        message: {
            type: 'ready',
            // Let the receiver know who sent the message and who it is for.
            payload: {
                sender: g_local_uuid,
                target: g_remote_uuid
            }
        }
    });
}

// The time-out function whose sole purpose is to clear the I_AM_MASTER flag after the ball's been hit by our side.
function clearIgnoreRemoteMasterFlag()
{
    g_ignore_remote_master_flag = false;
}

// Returns a reference to the given paddle number.
function getPaddle(paddleNumber)
{
    if (typeof (paddleNumber) == 'undefined' || paddleNumber == null)
        throw "The paddle number is unassigned.";

    var thePaddle = null;

    objects['paddles'].forEach(
        function (paddle)
        {
            if (paddle.paddleNumber == paddleNumber)
                // Found the paddle.
                thePaddle = paddle;
        });

    if (thePaddle == null)
        throw "Could not find a paddle object in the paddles list with the number: " + paddleNumber;
}

// Returns a reference to our paddle.
function getTheirPaddle()
{
    return getPaddle(g_paddle_number);
}


// Returns a reference to the remote paddle.
function getTheirPaddle()
{
    // If our paddle is #1 then their paddle must be #2, and vice-a-versa.
    return getPaddle(g_paddle_number == 1 ? 2 : 1);
}

// Returns a reference to the ball.
function getOurBall()
{
    var theBall = objects['balls'].objects[0];
}

// Builds the SYNC message that carries all the details of our current game board that
//  the other side needs to sync its board to ours.
function buildSyncMessage()
{
    // Get a reference to our paddle.
    var thePaddle = getOurPaddle();

    // Get a reference to the ball.
    var theBall = getOurBall();

    // Extract the salient details for each brick from the bricks objects container and
    //  convert it to an array of tuples.  Each tuple carries the ID, 
    //  current collision count, color, and location X/Y for each brick.
    var aryBrickSummaries = [];

    var aryBricks = objects['bricks'].objects;

    aryBrickSummaries.forEach(
        function (brick)
        {
            aryBrickSummaries.push(
                {
                    id: brick.id,
                    collsion_count: brick.collsionCount,
                    x: brick.mesh.x,
                    y: brick.mesh.y,
                    color: brick.color
                });
        });

    var syncMsg = {
        // The master flag status.
        master_flag: g_i_am_master_flag ? 'Y' : 'N',
        // Our paddle X/Y location.
        paddleLocXY:
            {
                x: thePaddle.mesh.x,
                y: thePaddle.mesh.y
            },
        // The ball X/Y location, velocity X/Y, and radius.
        ballDetails:
            {
                x: theBall.mesh.x,
                y: theBall.mesh.y,
                vel_x: theBall.velX,
                vel_y: theBall.velY,
                radius: theBall.radius
            },
        // The bricks summary map.
        bricks: aryBrickSummaries,

        // The current score
        scoreDetails:
            {
                player_1: gPlayerScore1,
                player_2: gPlayerScore2
            }
        
    } // syncMsg

    return syncMsg;
}

// ATI: This functioni should be called when our paddle is touched.  When that
//  happens we assume the role of master and set a timer to ignore incoming
//  SYNC messages that have the master flag set.  See the header notes.
function localPaddleTouched()
{
    // Our paddle was touched.  We are now master so update that flag.
    g_i_am_master_flag = true;

    // Publish a SYNC message now.
    publishSyncMessage();

    // Set the flag that tells us to ignore the master flag on incoming SYNC messages
    //  for a short while (See the header notes in pubnub_pong.js).
    g_ignore_remote_master_flag = true;

    // Start the timer that clears the flag to ignore the remote master flag setting
    //  in SYNC messages.  Wait 1/2 a second before clearing the flag.
    setTimeout(clearIgnoreRemoteMasterFlag, 500);
}

// Build a SYNC message from the current game details and publish it to the remote side: 
//
//  Master status, Our paddle location, ball location/velocity/angle, and bricks map.
function publishSyncMessage()
{
    var syncMsg = buildSyncMessage();

    // Publish the SYNC message to the other side.
    pubnub.publish({
        channel: g_pubnub_pong_channel,
        message: {
            type: 'sync',
            // Let the receiver know who sent the message and who it is for.
            payload: {
                sender      : g_local_uuid,
                target      : g_remote_uuid,

                // The sync message itself.
                sync_msg    : syncMsg
            }
        }
    });
}

// The interval function that is called on an interval that updates the other side with our game details
//  via a SYNC message.
function syncGameBoards()
{
    // Only send SYNC message if the game is in play.
    if (gameStates[currentGameState].running)
    {
        publishSyncMessage();
    }
}

// Update our image of the remote paddle.
function syncRemotePaddle(syncMsg)
{
    if (typeof (syncMsg) == 'undefined' || syncMsg == null)
        throw "The SYNC message is unassigned."

    // Update our image of the remote paddle location.
    var theirPaddle = getTheirPaddle();

    theirPaddle.mesh.x = syncMsg.paddle.x;
    theirPaddle.mesh.y = syncMsg.paddle.y;
}

// Update our ball's details to match theirs.
function syncBall(syncMsg)
{
    if (typeof (syncMsg) == 'undefined' || syncMsg == null)
        throw "The SYNC message is unassigned."

    var theBall = getOurBall();

    // Location X/Y.
    theBall.mesh.x = syncMsg.ballDetails.x;
    theBall.mesh.y = syncMsg.ballDetails.y;

    // Velocity X/Y.
    theBall.velX = syncMsg.ballDetails.velX;
    theBall.velY = syncMsg.ballDetails.velY;

    // Radius.
    theBall.radius = syncMsg.ballDetails.radius;
}

// Sync the contents of our player scores with that of the SYNC message.
function syncScores(syncMsg)
{
    if (typeof (syncMsg) == 'undefined' || syncMsg == null)
        throw "The SYNC message is unassigned."
}

// Replace the contents of our game board with that given to us in the SYNC message.
function replaceGameBoard(syncMsg)
{
    if (typeof (syncMsg) == 'undefined' || syncMsg == null)
        throw "The SYNC message is unassigned."

    // Remote paddle.
    syncRemotePaddle(syncMsg);
    // The ball.
    syncBall(syncMsg);
    // The bricks.
    syncBricks(syncMsg);
    // The scores.
    syncScores(syncMsg);
}

// Process an incoming SYNC message appropriately based on our master status and the
//  current value of the ignore-master-flag variable.
function processSyncMessage(syncMsg)
{
    if (typeof (syncMsg) == 'undefined' || syncMsg == null)
        throw "The SYNC message is unassigned."

    // Update our master status.  Is the remote master status flag set and are currently
    //  *not* ignoring master status updates?
    if (syncMsg.master_flag == 'Y' && g_ignore_remote_master_flag == false)
        // We are no longer master.  Update our flag.
        g_i_am_master_flag = false;

    // Always update the paddle location regardless of master status.
    syncRemotePaddle(syncMsg);

    // If we are not master, then update the ball, bricks, and scores to match that of our opponent's game board.
    if (!g_i_am_master_flag)
    {
        syncBall(syncMsg);
        syncBricks(syncMsg);
        syncScores(syncMsg);
    }
}

// Simple function that returns TRUE if the remote sender ID of the message matches the ID of
//  our opponent, and if the target of the message is US.
function isMessageFromOpponent(data)
{
    // Is it from our opponent and is it intended for us?
    return (data.payload.sender == g_remote_uuid && data.payload.target == g_local_uuid);
}

// The main object that provides the top level functionality for the PubNub enabled chess board page.
var App = function ()
{

    // Get the URL arguments passed to this page.
    g_url_arguments = getUrlVars();

    if (typeof (g_url_arguments) == "undefined" || g_url_arguments == null)
    {
        alert("No URL arguments were passed to this page!");
        return;
    }

    // EXPECTED URL ARGUMENTS (error any not found)
    //   local_uuid             : The ID for the local user.
    //   remote_uuid            : The ID for the remote user (the opponent).
    //   pubnub_pong_channel    : The pubnub channel ID shared by the two players.
    //   local_skill_level      : The skill level for the local user.
    //   paddle_number              : The side the local user is playing, "1" or "2" (Paddle #1 or Paddle #2).
    if (typeof (g_url_arguments["local_uuid"]) == undefined || g_url_arguments["local_uuid"] == null)
    {
        alert("The local user ID is missing from the URL arguments!");
        return;
    }
    g_local_uuid = g_url_arguments["local_uuid"]

    if (typeof (g_url_arguments["remote_uuid"]) == undefined || g_url_arguments["remote_uuid"] == null)
    {
        alert("The remote user ID is missing from the URL arguments!");
        return;
    }
    g_remote_uuid = g_url_arguments["remote_uuid"];

    if (typeof (g_url_arguments["pubnub_pong_channel"]) == undefined || g_url_arguments["pubnub_pong_channel"] == null)
    {
        alert("The PubNub channel ID is missing from the URL arguments!");
        return;
    }
    g_pubnub_pong_channel = g_url_arguments["pubnub_pong_channel"];

    if (typeof (g_url_arguments["local_skill_level"]) == undefined || g_url_arguments["local_skill_level"] == null)
    {
        alert("The local user's skill level is missing from the URL arguments!");
        return;
    }
    g_local_skill_level = g_url_arguments["local_skill_level"];

    if (typeof (g_url_arguments["paddle_number"]) == undefined || g_url_arguments["paddle_number"] == null)
    {
        alert("The color/side the local user is playing is missing from the URL arguments!");
        return;
    }
    g_paddle_number = g_url_arguments["paddle_number"];

    // If we are playing paddle #1 then we start out as the source for game board synchronization details.
    g_i_am_master_flag = (g_paddle_number == '1');

    // Ok, we have all the information we need to create a PubNub link between the players.
    //  Initialize the PubNub module.
    pubnub = PUBNUB.init({
        publish_key: 'demo',
        subscribe_key: 'demo',
        uuid: g_local_uuid
    });

    // Subscribe to the shared channel given to us in the URL arguments that binds us
    //  to our opponent.
    // Subscribe to the channel we create to service this app.
    pubnub.subscribe({
        // The PubNub channel to subscribe to.
        channel: g_pubnub_pong_channel,
        // Pass our skill level with the state data field so it is available to the Presence API
        //  event handler.  Remember, on the receiving end, skill will be attached directly to the 
        //  object, NOT to an object named state. 
        //
        //  (E.g. - presenceData.data.skill, NOT presenceData.data.state.skill).
        state: { skill: g_local_skill_level },
        // Function to call when we receive a message from the PubNub channel.
        message: function (data)
        {

            // ============================ BEGIN: CHANNEL MESSAGE ROUTING CODE ======================

            // Show the new chat message.
            //if (data.type == 'chat') {
            //    Users.get(data.payload.uuid).chat(data.payload.text, $output);
            //}

            // ------------------- START THE GAME, THE OTHER PLAYER IS READY ----------------

            // Is it a READY message from our opponent and intended for us?
            if (data.type == 'ready' && isMessageFromOpponent(data))
            {
                // Yes. Are we starting out as master?
                if (!g_i_am_master_flag)
                {
                    // No.  Then use the incoming SYNC message to replace the contents of our
                    //  game board with the remote side's game board since they are starting out as master.
                    replaceGameBoard(data.payload.sync_msg);
                }

                // Set the flag that tells everyone the remote player is ready.
                console.log("Setting remote player for local player: " + g_local_uuid);
                g_remote_player_is_ready = true;

                // Are we ready yet? (Has the local user hit the START button yet?).
                if (g_local_player_is_ready)
                {
                    // Yes. The local user is ready to play too.  Start the game.
                    console.log("Starting game for local player: " + g_local_uuid);
                    startGame();
                }
            } // if (data.type == 'ready')

            // ------------------- HANDLE INCOMING SYNC MESSAGES ----------------

            // Is it a SYNC message from our opponent and intended for us?
            if (data.type == 'sync' && isMessageFromOpponent(data))
                // Process it.
                processSyncMessage(data.payload.sync_msg);


            // ------------------- DISPLAY THE INCOMING CHAT MESSAGE ----------------

            if (data.type == 'chat')
            {
                // Build the HTML for a line of chat consisting of the sending user's ID and the message sent.
                var $line = $('<li class="list-group-item"><strong>' + data.payload.uuid + ':</strong> </span>');
                var $message = $('<span class="text" />').text(data.payload.text).html();

                $line.append($message);
                $output.append($line);

                // Scroll the chat window to ensure that the latest chat message is visible to the user.
                $output.scrollTop($output[0].scrollHeight);
            }

            // ------------------- EXECUTE THE REMOTE CHESS MOVE ---------------------

            if (data.type == 'chess_move')
            {
                // Show the data.
                console.log(data);

                // Is it intended for us to execute?
                if (data.target_uuid == g_local_uuid)
                {
                    if (typeof data.move == "undefined" || data.move == null)
                    {
                        console.log("Invalid move received from remote user!");
                        console.log(data);
                    }

                    // Yes, execute the move with full animation.
                    // var prettyMove = chess.move({ from: data.move.from, to: data.move.to, promotion: 'q' })
                    animateChessMove(data.move);

                }
            }
        },
        // Handle messages from the PubNub Presence API, the API that makes coordinating an online user list easy.
        presence: function (data)
        {

            // Show the presenceData.
            console.log(data);

            // Show the arrival of the opponent.
            if (data.action == "join" && data.uuid != g_local_uuid)
            {
                // Respond to the join event by showing the remote opponent's ID and skill level.
                $('#opponent').text(data.uuid);

                if (data.hasOwnProperty("skill"))
                    $('#opponent_skill').text(data.skill);
                else
                    $('#opponent_skill').text("unrated");
            }

            // Detect the exit of the opponent whether through a timeout condition or if they explicitlyi
            //  left the game.
            if (data.uuid != g_local_uuid && (data.action == "leave" || data.action == "timeout"))
            {
                alert(data.uuid + " has left the game.");

                // Respond to a leave or timeout event by removing the new user from the user list.
                $('#opponent').text("(nobody)");
                $('#opponent_skill').text("");
            }

            //if (data.action == "join") {
            //    // Respond to the join event by handling the new user.
            //    Users.set(data.uuid, data.state).init();
            //}

            //if (data.action == "leave" || data.action == "timeout") {
            //    // Respond to a leave or timeout event by removing the new user from the user list.
            //    Users.remove(data.uuid);
            //}

        }
    });

    // Show the local user's ID and skill level.
    $('#whoami').text(g_local_uuid);
    $('#my_skill').text(g_local_skill_level);

    // Establish easy references to important chat related HTML elements.
    $chat_form = $('#private-chat');
    $output = $('#private-chat-output');
    $input = $('#private-chat-input');

    // This is the function that will be called when the current user enters a chat message.
    //  It will publish it the chat message to the PubNub private channel the game is
    //  using.
    $chat_form.submit(function ()
    {

        console.log($input);

        pubnub.publish({
            channel: g_pubnub_pong_channel,
            message: {
                type: 'chat',
                payload: {
                    // Pass on the text message entered by the user.
                    text: $input.val(),
                    // The current user ID is the source ID for the chat message.
                    uuid: g_local_uuid
                }
            }
        });

        $input.val('');

        return false;

    });

    // Start the timer interval for SYNC messages.
    g_sync_timer_interval = setInterval(syncGameBoards(), 100);
}