/// <reference path="../pubnub/pubnub_pong.js" />
/// <reference path="C:\Users\Robert\Documents\Visual Studio 2012\Projects\WEB\PubNubBricks\PubNubBricks\data/game-data.js" />
/// <reference path="../global.js" />
/**
 * Bricks
 */

// ATI: This method will return TRUE the given percent of the time otherwise FALSE.
//  It won't be exactly the given percent but close enough for our purposes.  Default is 50.
function flipACoin(percent)
{
    if (typeof (percent) == 'undefined' || percent == null)
        throw "The percent is invalid.";

    if (percent < 1)
        throw "The percent is less than 1.";

    if (percent > 99)
        throw "The percent is greater than 99.";

    return (Math.random() <= (percent / 100));
}

// ATI: Returns a random color identifier from the given brick types element.  The brick types element
//  is found in a level beloning to the global levels array found in game-data.js.
function selectRandomColorAsLetter(brickTypes)
{
    if (typeof (brickTypes) == 'undefined' || brickTypes == null)
        throw "The brick types table is unassigned.";

    // Get access to the array of property names for the brick types object.
    var aryBrickTypesKeys = Object.keys(brickTypes);

    if (aryBrickTypesKeys.length < 1)
        throw "The brick types table contains no properties.";

    // Convert the brick types currently in object property form into an array.
    var aryBrickTypes = [];

    for (var i = 0; i < aryBrickTypesKeys.length; i++)
    {
        aryBrickTypes.push(aryBrickTypesKeys[i]);
    }

    // See if the resulting array contains any valid elements.
    if (aryBrickTypes.length < 1)
        throw "No brick types were found in the object that should contain them.";

    // Use Math.floor() to make sure we never get the array length for a color
    //  index, since that would trigger an out of range error.  
    var colorNdx = Math.floor(Math.random() * aryBrickTypes.length);

    // We should never get the array length for an index since Math.random() returns
    // a number that is exclusive of the value of 1, but we check anyways.
    if (colorNdx >= aryBrickTypes.length)
        // Index is beyond the end of the array.  Use the last element in the array.
        colorNdx == aryBrickTypes.length - 1;

    // Return the color.
    return aryBrickTypes[colorNdx];
}

// ATI: Convert the brick map to actual brick objects.  The brick map uses letters to indicate brick 
//  presence and color for each available row and column location in map.
function initBricks()
{
	var bricks = [];

    /* ATI: OLD method that used static brick maps 
	// Use 'for' loop if performance is poor
	levels[currLevel].levelDesign.forEach(function (row, i) {
		if (row != "") {
			bricks.push(tokenise(row));
		} else {
			bricks.push("");
		}
	});
    */

    /* ATI: We create the brick map randomly using the following heuristics:

    - There's a (percent) chance a brick will be drawn in any location.
    - The brick color is selected randomly from the available colors (See colorSchemes.melonBallSurprise in game-data.js)

    */
	for (var row = 0; row < 11; row++)
	{
	    // ATI: Build a row.
	    var strRow = "";

	    for (var col = 0; col < 33; col++)
	    {
	        // Add a brick at this row/column location?
	        if (flipACoin(25))
	        {
	            // Yes.  Choose a color randomly from the current level's brick types array.
	            var colorID = selectRandomColorAsLetter(levels[currLevel].brickTypes);

	            if (typeof (colorID) == 'undefined' || colorID == null)
	                throw "The randomly selected colorID is unassigned.";

	            // Add the color ID to the row we are building.
	            strRow += colorID;
	        }
	        else
	        {
	            // Add a space to act as a spacer, letting the rest of the code know not to 
	            //  put a brick at this row/column location.
	            strRow += " ";
	        }
	    } // for(col)

        // Row is built.  Transform it to a new row of actual bricks in the bricks array.
	    if (row != "")
	    {
	        bricks.push(tokenise(strRow));
	    } else
	    {
	        bricks.push("");
	    }
    } // for(row)

    // ATI: Now draw the bricks created on to the screen.
	drawBricks(bricks);
}

/* This utility function will send back a row in the following format:
 row = [
 ['', 1],
 ['a',3],	// format: 'brick type', length
 ...
 ];
 */
function tokenise(str) {
	var row = [],
		currBrickLen = 1;
	for (i = 0, len = str.length; i < len; i++) {
		if (str[i] == str[i + 1]) {
			currBrickLen++;

		} else {
			currBrickType = str[i];
			var brick = [currBrickType, currBrickLen];
			row.push(brick);
			currBrickLen = 1;
		}
	}
	return row;
}

// ATI: Brick layout details.
var BRICKS_START_TOP = 2.25;
var BRICKS_START_LEFT = -3.5;
var BRICKS_GRID_WIDTH = 0.22;
var BRICKS_GRID_HEIGHT = 0.15;
var BRICKS_GRID_BREADTH = 0.2;

var BRICKS_GRID_PADDING_X = 0.05; // not needed right now as edge-face rendering is segregating bricks nicely
var BRICKS_GRID_PADDING_Y = 0.01; // not needed right now as edge-face rendering is segregating bricks nicely

// To compensate for the fact that the grid's local axes are center aligned to the grid, instead of left and top
var BRICKS_OFFSET_X = BRICKS_GRID_WIDTH / 2;
var BRICKS_OFFSET_Y = BRICKS_GRID_HEIGHT / 2;

// ATI: Using the given SYNC message from the remote side, create/replace our bricks map with theirs.
//  This method is used to sync our game board layout to a remote party.
function syncBricks(syncMsg)
{
    if (typeof (syncMsg) == 'undefined' || syncMsg == null)
        throw "The SYNC message is unassigned."

    // Iterate the bricks summary map in the SYNC message to build the bricks.
    objects['bricks']					= {type: "bricks", objects: []};

    syncMsg.bricks.forEach(function(remoteBrick) {

        // Create a phony brick description to keep the Brick() object constructor happy.
        var brickDesc = ['a', remoteBrick.width];

        var brickObj		= new Brick(
                                    brickDesc, 
                                    remoteBrick.x,
                                    remoteBrick.y,
                                    remoteBrick.width,
                                    remoteBrick.height,
                                    remoteBrick.breadth);

        // Replace the new brick's auto-increment ID with the one found in the summary map.
        brickObj.id = remoteBrick.id;

        // Replace the collision count with the remote count.
        brickObj.collisionCount = remoteBrick.collisionCount;

        // Replace the color with the remote color.
        brickObj.color = remoteBrick.color;

        // Draw it.
        brickObj.draw();

        // Add it to the bricks map.
        objects['bricks'].objects.push(brickObj);
    });
}

// ATI: Draw the bricks on the game canvas using the currently selected level (See currLevel in globals.js)
function drawBricks(bricks) {
    var startTop        = BRICKS_START_TOP,
		startLeft       = BRICKS_START_LEFT,

		gridWidth       = BRICKS_GRID_WIDTH,
		gridHeight      = BRICKS_GRID_HEIGHT,
		gridBreadth     = BRICKS_GRID_BREADTH,

		gridPaddingX    = BRICKS_GRID_PADDING_X,
		gridPaddingY    = BRICKS_GRID_PADDING_Y,

		offsetX = BRICKS_OFFSET_X,
		offsetY = BRICKS_OFFSET_Y,

		totalRows						= bricks.count,
		currRow							= 0;

	objects['bricks']					= {type: "bricks", objects: []};

	bricks.forEach(function(row, i) {

		if (row == "") {
			currRow++;
		} else {
			var localStartLeft			= startLeft,
				posX					= localStartLeft,
				posY					= startTop - (gridHeight * currRow),
				currCol					= 0,
				currBrick				= 0;

			row.forEach(function(brick, j) {
				if (brick[0] != " ") {

					var brickWidth		= (brick[1] * gridWidth),
						brickHeight		= gridHeight,
						brickBreadth	= gridBreadth;

					var offsetX			= brickWidth / 2;
//						posX			= offsetX +  startLeft + (gridWidth * currCol) + (gridPaddingX * currBrick);
					// posX			= posX + offsetX + 0.3;
//						posX			= (posX / 2) + (brickWidth / 2);
					// posX			= posX + brickWidth / 2;
					posX				= localStartLeft + offsetX;

					localStartLeft      = posX + offsetX;

					var brickObj		= new Brick(brick, posX, posY, brickWidth, brickHeight, brickBreadth);
					brickObj.draw();
					objects['bricks'].objects.push(brickObj);

//					currCol				+= brick[1];
//					currBrick++;
				} else {
//					currCol++;

					var blankBrickWidth	= brick[1] * gridWidth;
					var offsetX			= blankBrickWidth / 2;
					posX				= localStartLeft + offsetX
					localStartLeft		= posX + offsetX;
				}
			});
			currRow++;
		}
	});
}

// ATI: We increment this variable with each brick created to give each brick a simple,
//  quick, unique ID.  Starting at 1.
var g_next_brick_id = 1;

function Brick(brick, posX, posY, brickWidth, brickHeight, brickBreadth)
{
    // ATI: Assign this brick an ID and increment the ID tracker.
    this.id                             = g_next_brick_id;
	this.type							= brick[0].toLowerCase();
	this.width							= brickWidth;
	this.height							= brickHeight;
	this.breadth						= 0.2;
	this.color							= levels[currLevel].brickTypes[this.type];

	this.posXMin						= posX - this.width / 2;
	this.posXMax						= posX + this.width / 2;
	this.posYMin						= posY - this.height / 2;
	this.posYMax                        = posY + this.height / 2;

    // Keeps count of the number of times the brick was touched by the ball.
	this.collisionCount                 = 0;

    // ATI: If the brick color is that defined by the
    //  global unbreakble color variable, the it is not breakable.
	this.isBreakable                    = (this.color != gUnBreakableBrickColor);

	this.draw = function () {
		if (this.type != " ") {
			this.geometry				= new THREE.CubeGeometry(this.width, this.height, this.breadth);
			this.baseMaterial			= new THREE.MeshLambertMaterial({color: this.color});
			this.wireframeMaterial		= new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true, transparent: true});
			this.multiMaterial			= [this.baseMaterial, this.wireframeMaterial];
			this.mesh					= THREE.SceneUtils.createMultiMaterialObject(this.geometry, this.multiMaterial);
			this.mesh.position.set(posX, posY, 0);
			scene.add(this.mesh);
		}
	};
}