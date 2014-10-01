/*
    This code is courtesy of PubNub via Ian Jennings excellent tutorial series:

    http://www.pubnub.com/blog/creating-private-chat-requests-with-popup-alerts/

    Modifications made by Android Technologies, Inc.  To find the modifications, look for the
     comment string prefix "ATI:".
*/


var g_game_url = "/game.html";

// ATI: Function to navigate to the chess game URL using the correct URL arguments to set up the  game.
//
// Launch a pong game between the local user and the user that accepted the challenge.
//  Create a new PubNub channel for the game, built from the two user names with the current
//  date appended to ensure a unique channel.
//
//
// EXAMPLE: /game.html?local_uuid=local_user&remote_uuid=remote_user&pubnub_pong_channel=pubnub_pong_channel_1&local_skill_level=beginner&paddle_number=1
//
//  PARAMETERS:
//
//  remoteUserID           : the user ID of the opponent
//  paddleNumber               : the paddle number for the game, 1 or 2.
//
// TODO: Later add access management so we can create a channel name guaranteed to be
//  unique to the two players.  Right now we are generating the player ID's randomly
//  and therefore there could be a collision between random names if a lot of people
//  begin to play online (or just bad luck of a collision).
function navigateToPongGame(remoteUserID, paddleNumber)
{
    var localUserID = me.uuid;

    var theDate = new Date();

    // Use the PubNub channel ID to service the private chat.
    var pubnubPongChannel = private_channel;

    var localSkillLevel = me.state.skill;

    // Validate the parameters since all must have valid non-empty values or the game
    //  will not load.
    if (typeof remoteUserID == "undefined" || remoteUserID == null)
        throw new Error("(navigateToPongGame) The remote  user ID is unassigned.");

    if (typeof paddleNumber == "undefined" || paddleNumber == null)
        throw new Error("(navigateToPongGame) The selected paddle number to play is unassigned.");

    if (paddleNumber != "1" && paddleNumber != "2")
        throw new Error("(navigateToPongGame) Only '1' and '2' are valid choices for the selected paddle number to play (Paddle #1 or Paddle #2).");

    if (typeof localUserID == "undefined" || localUserID == null)
        throw new Error("(navigateToPongGame) The local user ID is unassigned.");

    if (typeof pubnubPongChannel == "undefined" || pubnubPongChannel == null)
        throw new Error("(navigateToPongGame) The PubNub Pong channel ID is unassigned.");

    if (typeof localSkillLevel == "undefined" || localSkillLevel == null)
        throw new Error("(navigateToPongGame) The local user's skill level is unassigned.");

    // Build the URL to launch the game propertly.
    var url =
        g_game_url
        + "?"
        + "local_uuid" + "=" + localUserID
        + "&"
        + "remote_uuid" + "=" + remoteUserID
        + "&"
        + "pubnub_pong_channel" + "=" + pubnubPongChannel
        + "&"
        + "local_skill_level" + "=" + localSkillLevel
        + "&"
        + "paddle_number" + "=" + paddleNumber;

    // Launch the game.
    window.location.href = url;
}

var pubnub = null;
var me = null;
var Users = null;

var channel = 'pubnub-pong-chat-lobby';

// ATI: The private PubNub channel IU created for two chess players to user for chat and/or for
//  challenging one another to a game.  This is the channel ID passed on to the chess page for
//  managing the game.
var private_channel = null;

// Moved to App() object to make sure the DOM tree is fully constructed before storing element references.
//var $online_users = $('#online-users');
//var $input = $('#chat-input');
//var $output = $('#chat-output');

// Global references to important display elements, in order: the online user list, chat input window, chat output window.
var $online_users = null;
var $input = null;
var $output = null;

// Call this function from the window.onbeforeunload() event to make sure we unsubscribe from any PubNub
//  channels before leaving the web page.
function leavePage()
{
    pubnub.unsubscribe({
        channel: channel,
    })
}

// Function to create a random user name based on a combination of animal types and colors.
var randomName = function ()
{

    var animals = ['pigeon', 'seagull', 'bat', 'owl', 'sparrows', 'robin', 'bluebird', 'cardinal', 'hawk', 'fish', 'shrimp', 'frog', 'whale', 'shark', 'eel', 'seal', 'lobster', 'octopus', 'mole', 'shrew', 'rabbit', 'chipmunk', 'armadillo', 'dog', 'cat', 'lynx', 'mouse', 'lion', 'moose', 'horse', 'deer', 'raccoon', 'zebra', 'goat', 'cow', 'pig', 'tiger', 'wolf', 'pony', 'antelope', 'buffalo', 'camel', 'donkey', 'elk', 'fox', 'monkey', 'gazelle', 'impala', 'jaguar', 'leopard', 'lemur', 'yak', 'elephant', 'giraffe', 'hippopotamus', 'rhinoceros', 'grizzlybear'];

    var colors = ['silver', 'gray', 'black', 'red', 'maroon', 'olive', 'lime', 'green', 'teal', 'blue', 'navy', 'fuchsia', 'purple'];

    return colors[Math.floor(Math.random() * colors.length)] + '_' + animals[Math.floor(Math.random() * animals.length)];

};

// Return a random chess skill rating between 1 and 3.
var randomSkill = function ()
{
    return Math.floor(Math.random() * 3) + 1;
};

// This object maintains the list of all known users.
var User_factory = function ()
{

    var user_list = {};
    var self = this;

    // Remove a user from our list.
    self.remove = function (uuid)
    {

        // ATI: call the User object's leave() method on the target user to remove it from the online user's list.
        user_list[uuid].leave();
        delete user_list[uuid];
    };

    // Get a user from our list.
    self.get = function (uuid)
    {
        if (user_list.hasOwnProperty(uuid))
        {
            return user_list[uuid];
        } else
        {
            console.error('Trying to retrieve user that is not present.');
        }
    };

    // If a user with the given ID exists, return a reference to it.  Otherwise, add it to the list.
    self.set = function (uuid, data)
    {
        if (!user_list.hasOwnProperty(uuid))
        {
            user_list[uuid] = new User(uuid, data);
        }
        return user_list[uuid];
    };

    // Make our user list available with this property.
    self.all = function ()
    {
        return user_list;
    }

};

// A user.
//  uuid: The user ID.
//  state: Currently the user's skill lvel.
var User = function (uuid, state)
{

    var self = this;

    // If a user ID was not provided (NULL), then provide a random one, otherwise use the one given.
    self.uuid = uuid || randomName();

    // If a skill level was not provided (NULL), then assign a random one, otherwise use the one given.
    self.state = state || { skill: randomSkill() };

    // HTML snippet for a user element consisting of the user's ID and their skill level displayed
    //  in Twitter bootstrap badge format.
    var $tpl = $('<li id="' + self.uuid + '" class="list-group-item"> <span class="badge">' + self.state.skill + '</span><span id="' + self.uuid + '_uuid">' + self.uuid + '</span></li>');

    //var $tpl = $('\
    //<li id="' + self.uuid + '" class="list-group-item"> \
    //<span class="badge">' + self.state.skill + '</span> \
    //' + self.uuid + ' \
    //</li>');

    // Display an incoming chat in the correct chat window, either the shared lobby chat or a private chat window.
    //  text: The chat text.
    //  $target: The target chat window.
    self.chat = function (text, $target)
    {

        // Build the HTML for a line of chat consisting of the sending user's ID and the message sent.
        var $line = $('<li class="list-group-item"><strong>' + self.uuid + ':</strong> </span>');
        var $message = $('<span class="text" />').text(text).html();

        $line.append($message);
        $target.append($line);

        // Scroll the chat window to ensure that the latest chat message is visible to the user.
        $target.scrollTop($target[0].scrollHeight);

    };

    // The user is leaving the chat so remove the DOM element that was created for this user.
    self.leave = function ()
    {
        $tpl.remove();
    };

    // Initialize the user object.
    self.init = function ()
    {

        // When this user is clicked on, begin the ceremony for establishing a private chat.
        $tpl.click(function ()
        {
            me.private_chat(self);

            // Return FALSE to stop event bubbling of the click event handler.
            return false;
        });

        // Add this user to the online users list.
        $('#online-users').append($tpl);

    };

    // Return a reference to ourself to support method chaining.
    return self;

};

var Client = function ()
{

    var self = new User(randomName());

    self.on_request = function (caller)
    {

        var response = confirm(caller.uuid + ' is challenging you to a match! Press OK to accept or Cancel to deny.');

        pubnub.publish({
            channel: channel,
            message: {
                type: 'challenge',
                payload: {
                    action: 'response',
                    accepted: response,
                    uuid: self.uuid,
                    target: caller.uuid
                }
            },
            callback: function ()
            {
                // ATI: alert('Your response has been sent.');

                if (response)
                    // ATI: We accepted the remote user's request for a game.
                    //  Launch the chess game between the local user and the user 
                    //  that made the challenge.  We select White ("w") as the color/side
                    //  we are playing because we were challenged.
                    navigateToPongGame(caller.uuid, "w");
            }
        });
    };

    self.on_response = function (caller, accepted)
    {
        if (accepted)
        {
            // ATI: alert(caller.uuid + ' has accepted your challenge!');

            // The remote user we challenged accepted our request for a game.
            //  Launch the chess game between the local user and the user that 
            //  accepted the challenge.  We select Black ("b") as the color/side
            //  we are playing because we are the challenger.
            navigateToPongGame(caller.uuid, "b");
        } else
        {
            alert(caller.uuid + ' has rejected your challenge!');
        }
    };

    self.private_chat = function (target)
    {

        // Make sure we are not trying to chat with ourselves.
        if (self.uuid == target.uuid)
        {
            alert("You can not chat or challenge yourself.");
            return;
        }

        // open a modal for ourselves
        var new_chat = new PrivateChat(target);

        // tell the other user to open the modal too
        pubnub.publish({
            channel: channel,
            message: {
                type: 'new-private-chat',
                payload: {
                    uuid: self.uuid,
                    target: target.uuid
                }
            }
        });

    };

    Users.set(self.uuid, self.state);

    return self;

};

var PrivateChat = function (user)
{

    var self = this;

    var $tpl = $('\
    <div class="modal fade"> \
      <div class="modal-dialog"> \
        <div class="modal-content"> \
          <div class="modal-header"> \
            <button type="button" class="close" data-dismiss="modal">&times;</button> \
            <h4 class="modal-title">' + user.uuid + ' <span class="badge">' + user.state.skill + '</span></h4> \
          </div> \
          <div class="modal-body"> \
            <div class="panel panel-default"> \
              <div class="panel-heading">Private Chat</div> \
              <ul class="list-group private-chat-output"></ul> \
              <div class="panel-body"> \
                <form class="private-chat"> \
                  <div class="input-group"> \
                    <input type="text" class="form-control private-chat-input" /> \
                    <span class="input-group-btn"> \
                      <button type="submit" class="btn btn-default">Send Message</button> \
                    </span> \
                  </div> \
                </form> \
              </div> \
            </div> \
          </div> \
          <div class="modal-footer"> \
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button> \
            <button type="button" class="challenge-user btn btn-primary">Challenge</button> \
          </div> \
        </div> \
      </div> \
    </div>');

    var $chat_form = $tpl.find('.private-chat');
    var $output = $tpl.find('.private-chat-output');
    var $input = $tpl.find('.private-chat-input');
    var $challenge = $tpl.find('.challenge-user');

    // ATI: No modifications made.  Just highlighting the fact that the user IDs
    //  must be sorted to make sure each user in the private chat gets the
    //  same channel ID, otherwise each copy of this code might create
    //  a different channel ID if the user IDs got swapped and therefore
    //  the users would different channel IDs and would be orphaned from
    //  each other.
    private_channel = channel + ':' + [me.uuid, user.uuid].sort().join(':');

    self.hide = function (callback)
    {
        $tpl.on('shown.bs.modal', callback);
        $tpl.modal('hide');
    };

    self.show = function (callback)
    {
        $tpl.on('hidden.bs.modal', callback);
        $tpl.modal('show');
    };

    var init = function (callback)
    {

        $('body').append($tpl);

        pubnub.subscribe({
            channel: private_channel,
            message: function (data)
            {
                Users.get(data.payload.uuid).chat(data.payload.text, $output);

            }
        });

        $chat_form.submit(function ()
        {

            console.log($input);

            pubnub.publish({
                channel: private_channel,
                message: {
                    type: 'private-chat',
                    payload: {
                        text: $input.val(),
                        uuid: me.uuid
                    }
                }
            });

            $input.val('');

            return false;

        });

        $challenge.click(function ()
        {

            pubnub.publish({
                channel: channel,
                message: {
                    type: 'challenge',
                    payload: {
                        action: 'request',
                        uuid: me.uuid,
                        target: user.uuid
                    }
                }
            });

            alert('Challenging ' + user.uuid + '...');

        });

        self.show();

    };

    init();

    return self;

};

// Top level app object for the PubNub Chess Club app.  Should not be called until the DOM tree is
//  fully constructed.
var App = function ()
{

    // Create global references to the main page elements.
    $online_users = $('#online-users');
    $input = $('#chat-input');
    $output = $('#chat-output');

    // Create user factory.
    Users = new User_factory();

    // Create a client object for us.  The Client object extends the User object and returns a reference
    //  to that adorned object.
    me = new Client();

    // Initialize the PubNub module.
    pubnub = PUBNUB.init({
        publish_key: 'demo',
        subscribe_key: 'demo',
        uuid: me.uuid
    });

    // Subscribe to the channel we create to service this app.
    pubnub.subscribe({
        // The PubNub channel to subscribe to.
        channel: channel,
        // Our game related details.
        state: me.state,
        // Function to call when we receive a message from the PubNub channel.
        message: function (data)
        {

            // ============================ BEGIN: CHANNEL MESSAGE ROUTING CODE ======================

            // Show the new chat message.
            if (data.type == 'chat')
            {
                Users.get(data.payload.uuid).chat(data.payload.text, $output);
            }

            // Check to see if the message is for us.
            if (data.payload.target == me.uuid)
            {


                // ============================ BEGIN: (Private) CHANNEL MESSAGE ROUTING CODE ======================

                // A private chat request was received.  
                if (data.type == 'new-private-chat')
                {

                    // Create a private chat object with the challenging user's ID.
                    new PrivateChat(Users.get(data.payload.uuid));

                }

                // Check to see if we have been challenged.
                if (data.type == 'challenge')
                {

                    // Find out who challenged us.
                    var challenger = Users.get(data.payload.uuid);

                    if (data.payload.action == 'request')
                    {

                        // Respond to the challenge.
                        me.on_request(challenger);
                    }

                    if (data.payload.action == 'response')
                    {
                        // Process the response to our challenge.
                        me.on_response(challenger, data.payload.accepted);
                    }

                }

                // ============================ END: (Private) CHANNEL MESSAGE ROUTING CODE ======================
            }

            // ============================ BEGIN: CHANNEL MESSAGE ROUTING CODE ======================

        },
        // Handle messages from the PubNub Presence API, the API that makes coordinating an online user list easy.
        presence: function (data)
        {

            // Show the data.
            console.log(data);

            if (data.action == "join")
            {
                // Respond to the join event by handling the new user.
                Users.set(data.uuid, data.state).init();
            }

            if (data.action == "leave" || data.action == "timeout")
            {
                // Respond to a leave or timeout event by removing the new user from the user list.
                Users.remove(data.uuid);
            }

        }
    });

    // Event handler for the Find Match button.
    $('#find-match').click(function ()
    {

        var matches = [];
        var users = Users.all();

        // Find all users that are online that are at our skill level.
        for (var uuid in users)
        {
            if (uuid !== me.uuid && users[uuid].state.skill == me.state.skill)
            {
                matches.push(users[uuid]);
            }
        }

        if (!matches.length)
        {
            alert('Nobody is online with the same skill level.');
        } else
        {
            var opponent = matches[Math.floor(Math.random() * matches.length)];
            alert('Opponent Found: ' + opponent.uuid + ' with skill level ' + opponent.state.skill);
        }

    });

    // Send a chat message.
    $('#chat').submit(function ()
    {

        pubnub.publish({
            channel: channel,
            message: {
                type: 'chat',
                payload: {
                    text: $input.val(),
                    uuid: me.uuid
                }
            }
        });

        $input.val('');

        return false;

    });

    // Show our user handle.
    $('#whoami').text(me.uuid);

    // Show our skill level.
    $('#my_skill').text(me.state.skill);

    // Find ourselves in the online user's list and bold our entry, but find the span dedicted
    //  to showing the user ID.
    // Need to escape underscores because they are CSS element characters and JQuery will turn
    //  them into spaces in the selector it creates.
    var elemID = me.uuid + '_span';
    var strSelector = '#' + elemID.replace(/_/gi, '\\_');
    var $ourLine = $(strSelector);

    if (typeof $ourLine == "undefined" || $ourLine == null)
        throw new Error("(App) Unable to find the span that contains the local user ID in the online users list.");

    // Bold it.
    $ourLine.css("font-weight", "Bold");
};

// Call to App() moved to window onload event to make sure the DOM tree is fully constructed first.
// App();