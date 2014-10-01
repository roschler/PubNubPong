/// <reference path="bricks.js" />
/// <reference path="paddles.js" />
/// <reference path="walls.js" />
/// <reference path="skydome.js" />
/**
 * Balls
 */

function initBalls() {
	drawBalls();
}

function drawBalls() {
    var radius = 0.06,
		hSegments = 16,
		vSegments = 16,
		startPosX = 0,
		startPosY = 0.1; // 75;

	objects['balls']					= {type: "balls", objects: []};

	var ballObj							= new Ball(radius, startPosX, startPosY, hSegments, vSegments);
	ballObj.draw();
	objects['balls'].objects.push(ballObj);
}

function Ball(radius, startPosX, startPosY, hSegments, vSegments) {
	this.startPosX						= startPosX;
	this.startPosY						= startPosY;
	this.baseVelX						= 0.01;
	this.baseVelY						= 0.03;
	this.velX							= this.baseVelX;
	this.velY							= this.baseVelY;
	this.radius = radius;

    // ATI: Track the ID of the last paddle to collide with us.
	this.paddleNumberTouched           = -1;

	this.draw = function() {
		this.geometry					= new THREE.SphereGeometry(this.radius, hSegments, vSegments);
		this.material					= new THREE.MeshPhongMaterial({color: 0xdddddd, specular: 0xffffff, shininess: 200});
		this.mesh						= new THREE.Mesh(this.geometry, this.material);
		this.mesh.position.set(this.startPosX, this.startPosY, 0);
		scene.add(this.mesh);
	}

	this.reset = function() {
		this.mesh.position.set(this.startPosX, this.startPosY, 0);
		this.velX						= this.baseVelX;
		this.velY						= this.baseVelY;
	}

	this.update = function() {
		this.move();
	}

	this.move = function() {
		this.mesh.position.x			+= this.velX;
		this.mesh.position.y			+= this.velY;

		var collisionStatus = {};

	    // ATI: Need to know if a paddle was touched.
		var bIsAnyPaddleTouched         = false;

		// Test collision against walls
		collisionStatus					= this.testCollision(objects['walls']);
		if (collisionStatus.x) {
			this.velX					*= -1;
		} if (collisionStatus.y) {
			this.velY					*= -1;
		}

		// Test against paddles
		collisionStatus					= this.testCollision(objects['paddles']);
		if (collisionStatus)
		{
		    // A paddle was touched.
		    bIsAnyPaddleTouched         = true;

		    // ATI: If we have a collision reverse the Y direction of the ball.  The X direction is calculated
            //  by the testCollision() method.
			this.velY					*= -1;
		}

		// Test against bricks
		collisionStatus					= this.testCollision(objects['bricks']);
		switch (collisionStatus) {
			case 'top':
			case 'bottom':
			    this.velY *= -1;
                // ATI: Breaking bricks does not increase your score in our version of the game.
				// score++;
				break;

			case 'left':
			case 'right':
				this.velX				*= -1;
			    // ATI: Breaking bricks does not increase your score in our version of the game.
				// score++;
				break;
		}

	    // If our paddle and only our paddle was touched, send out an immediate SYNC message to
	    //  ensure the fastest delivery of a SYNC message where we are now master, instead of
	    //  waiting for the timer interval method that sends SYNC messages to get around to it.
		if (bIsAnyPaddleTouched && this.paddleNumberTouched == g_paddle_number)
		    localPaddleTouched();
	}

	this.testCollision = function(obj) {
		switch (obj.type) {
			// Test against walls
			case "walls":
				var collisionStatus		= {};

                // ATI: Check walls.
				if ((this.mesh.position.x  + this.radius) > obj.objects[0].rightWall
					|| (this.mesh.position.x  - this.radius) < obj.objects[0].leftWall)
				{
					collisionStatus.x	= true;
				}

                // ATI: Check ceiling.
				if ((this.mesh.position.y + this.radius) > obj.objects[0].topWall) {
					collisionStatus.y	= true;
					touchedCeiling = true;
                }

                // Check floor.
				if ((this.mesh.position.y - this.radius) < obj.objects[0].bottomWall)
				{
					touchedFloor = true;
				    collisionStatus.y = true;
				}

				return collisionStatus;
				break;

			// Test against paddles
			//case "paddles":
			//	// Check whether the ball is below the paddle (approximate calculation, which is sufficient for the
			//	// current velocity
			//	if ((this.mesh.position.y - this.radius) < obj.objects[0].mesh.position.y

			//		// So that the ball doesn't get in the weird state of collisions when below the paddle but also
			//		// within its length
			//		&& this.mesh.position.y > (obj.objects[0].mesh.position.y - 0.1)

			//		// Check whether the ball is within the length of the paddle
			//		&& this.mesh.position.x > (obj.objects[0].mesh.position.x - obj.objects[0].width / 2)
			//		&& this.mesh.position.x < (obj.objects[0].mesh.position.x + obj.objects[0].width / 2))
			//	{
			//		var velXChange		= (this.mesh.position.x - obj.objects[0].mesh.position.x) / (obj.objects[0].width / 2);
			//		this.velX			= this.baseVelX * (velXChange);
			//		return true;
			//	}

			//	break;
		    // ATI: Test against both paddles
		    case "paddles":
		        // ATI: ---------------------------- PADDLE # 1 =======================

		        // ATI: Test for a collision with Paddle #1, which is at the bottom of the display.
		        var bWithinPaddleWidth =
                    this.mesh.position.x > (obj.objects[0].mesh.position.x - obj.objects[0].width / 2)
					&& this.mesh.position.x < (obj.objects[0].mesh.position.x + obj.objects[0].width / 2);

		        var bWithinPaddleHeight = Math.abs( (this.mesh.position.y + this.radius) - obj.objects[0].mesh.position.y) < 0.1;

		        var bAbovePaddle = this.mesh.position.y > obj.objects[0].mesh.position.y;

		        // ATI: If the ball is within the paddle's width, and close enough to the paddle height, and above the paddle,
                //  then this is a collision.
		        if (bWithinPaddleWidth && bWithinPaddleHeight && bAbovePaddle)
		        {
		            var velXChange = (this.mesh.position.x - obj.objects[0].mesh.position.x) / (obj.objects[0].width / 2);
		            this.velX = this.baseVelX * (velXChange);

		            // Update the field in the ball that tracks the ID of the last paddle that it collided with.
		            this.paddleNumberTouched = 1;

                    // ATI: Collision detected.  
		            return true;
		        }

                
		        // ATI: ---------------------------- PADDLE # 2 =======================

		        // ATI: Test for a collision with Paddle #2, which is at the bottom of the display.
		        bWithinPaddleWidth =
                    this.mesh.position.x > (obj.objects[1].mesh.position.x - obj.objects[1].width / 2)
					&& this.mesh.position.x < (obj.objects[1].mesh.position.x + obj.objects[1].width / 2);

		        bWithinPaddleHeight = Math.abs(this.mesh.position.y - obj.objects[1].mesh.position.y) < 0.1;
		        // bWithinPaddleHeight = Math.abs((this.mesh.position.y - this.radius) - obj.objects[1].mesh.position.y) < 0.1;

		        var bBelowPaddle = this.mesh.position.y < obj.objects[1].mesh.position.y;

		        // ATI: If the ball is within the paddle's width, and close enough to the paddle height, and below the paddle,
		        //  then this is a collision.
		        if (bWithinPaddleWidth && bWithinPaddleHeight && bBelowPaddle)
		        {
		            var velXChange = (this.mesh.position.x - obj.objects[1].mesh.position.x) / (obj.objects[1].width / 2);
		            this.velX = this.baseVelX * (velXChange);

		            // Update the field in the ball that tracks the ID of the last paddle that it collided with.
		            this.paddleNumberTouched = 2;

		            // ATI: Collision detected.
		            return true;
		        }



		        // ATI: ---------------------------- PADDLE # 2 =======================

		        // ATI: Test for a collision with Paddle #1, which is at the bottom of the display.

		        // ATI: Check whether the ball is above (behind) the paddle. Use an approximate calculation, which is sufficient for the
		        // current velocity.
		        //if ((this.mesh.position.y - this.radius) > obj.objects[1].mesh.position.y

		        //    // So that the ball doesn't get in the weird state of collisions when below the paddle but also
		        //    // within its length
				//	&& this.mesh.position.y > (obj.objects[1].mesh.position.y - 0.1)

		        //    // Check whether the ball is within the length of the paddle
				//	&& this.mesh.position.x > (obj.objects[1].mesh.position.x - obj.objects[1].width / 2)
				//	&& this.mesh.position.x < (obj.objects[1].mesh.position.x + obj.objects[1].width / 2))
		        //{
		        //    var velXChange = (this.mesh.position.x - obj.objects[1].mesh.position.x) / (obj.objects[1].width / 2);
		        //    this.velX = this.baseVelX * (velXChange);
		        //    return true;
		        //}


		        break;
			// Test agains bricks
			case "bricks":
				// Save the reference to the current ball object, since 'this' won't refer to it inside the forEach loop
				var ballObj				= this,
					updatedBricks		= [],
					collisionStatus		= {},
					collisionThreshold  = 0.05;

				obj.objects.forEach(function(brick, i){
				    var bIsBrickTouched = false;

				    // Check collision with the bottom edge of the brick
					if (ballObj.mesh.position.x > brick.posXMin
						&& ballObj.mesh.position.x < brick.posXMax
						&& ballObj.mesh.position.y < brick.posYMin
						&& (ballObj.mesh.position.y + collisionThreshold) > brick.posYMin
						&& ballObj.mesh.position.y < brick.posYMax)
					{
//						collisionStatus.bottomEdge	= true;
						collisionStatus	= "bottom";
						bIsBrickTouched = true;
					}
					// Check collision with the top edge of the brick
					else if (ballObj.mesh.position.x > brick.posXMin
						&& ballObj.mesh.position.x < brick.posXMax
						&& ballObj.mesh.position.y > brick.posYMin
						&& ballObj.mesh.position.y > brick.posYMax
						&& (ballObj.mesh.position.y - collisionThreshold) < brick.posYMax)
					{
//						collisionStatus.topEdge	= true;
						collisionStatus	= "top";
						bIsBrickTouched = true;
					}

					// Check collision with the left edge of the brick
					else if (ballObj.mesh.position.y > brick.posYMin
						&& ballObj.mesh.position.y < brick.posYMax
						&& ballObj.mesh.position.x < brick.posXMin
						&& (ballObj.mesh.position.x + collisionThreshold) > brick.posXMin
						&& ballObj.mesh.position.x < brick.posXMax)
					{
//						collisionStatus.leftEdge	= true;
						collisionStatus	= "left";
						bIsBrickTouched = true;
					}
					// Check collision with the right edge of the brick
					else if (ballObj.mesh.position.y > brick.posYMin
						&& ballObj.mesh.position.y < brick.posYMax
						&& ballObj.mesh.position.x > brick.posXMin
						&& ballObj.mesh.position.x > brick.posXMax
						&& (ballObj.mesh.position.x - collisionThreshold) < brick.posXMax)
					{
//						collisionStatus.rightEdge	= true;
						collisionStatus	= "right";
						bIsBrickTouched = true;
					}
					//// No collision detected - add the current brick to the updated list of bricks to be rendered
					//else {
					//	updatedBricks.push(brick);
				    //}

					var bIsBrickBroken = false;

                    // Was the brick touched by the ball?
					if (bIsBrickTouched)
					{
					    // Track the number of times the brick was touched.
					    brick.collisionCount++;

                        /*
                         * NOTE: By allowing for unbreakable bricks we introduced a bug into the game play
                         *  where the ball can get trapped inside a brick by the mathematics at play.
                         *  Rather than fix the bug, we thought it might be fun to allow breakble bricks
                         *  to break when this happens after the ball bounce about 5 times, as if it
                         *  charges up and explodes.
                         * 
                         *  TODO: Add a cool sound effect when this happens.
                         */

					    // Yes.  Is the brick breakable or is it an unbreakable brick with a trapped
                        //  ball inside of it?
					    if (brick.isBreakable || brick.collisionCount >= 5)
					    {
					        // Yes.  The brick was broken.
					        bIsBrickBroken = true;

					        // Remove it from the WebGL scene. 
					        scene.remove(brick.mesh);
					    }

					}

				    // Was the brick broken?  If not, it will not be added to the updated bricks array and therefore
				    //  removed from the bricks array by omission when we replace it with the updated bricks array.
					if (!bIsBrickBroken)
					    // No it was not.  Add it to the updated bricks array (keep the brick).
					    updatedBricks.push(brick);
				});

                // Replace the bricks array with the bricks that were not broken.
				obj.objects				= updatedBricks;
				return collisionStatus;
				break;

			default:
				break;
		}
	}
}