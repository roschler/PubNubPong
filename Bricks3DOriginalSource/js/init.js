/**
 * Initialise everything
 */

function init() {
	// Rendering settings
	renderer							= new THREE.WebGLRenderer();
	camera								= new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene								= new THREE.Scene();

	// Add camera to the scene
	scene.add(camera);
	camera.position.y					= 1;
	camera.position.z					= 5;

	// Set renderer size
	renderer.setSize(WIDTH, HEIGHT);

	// Add the DOM element generated by the renderer to the html body
	document.body.appendChild(renderer.domElement);

	// Stats
	stats								= new Stats();
	stats.domElement.style.position		= 'absolute';
	stats.domElement.style.top			= '20px';
	stats.domElement.style.left			= '20px';
	stats.domElement.style.zIndex		= '100';

	document.body.appendChild(stats.domElement);

	initLights();
	initObjects();

//	window.addEventListener('resize', onWindowResize, false);
	window.addEventListener('mousemove', trackPosition, true);
	window.addEventListener('keypress', trackKeyPress, false);
}

function initLights() {
	initPointLights();
}

function initObjects() {
	initBricks();
	initBalls();
	initPaddles();
	initWalls();
}

/**
 * Could be refactored and organised better in the long-run
 */
function trackPosition(e) {
	var x								= (e.clientX/WIDTH) * 2 - 1,
		y								= (e.clientY/HEIGHT) * 2 + 1;
	var vector							= new THREE.Vector3(x, y, 0.5);

	// Get a ray pointing in the direction of the mouse pointer from the camera
	var projector						= new THREE.Projector();
	projector.unprojectVector(vector, camera);

	var dir								= vector.sub(camera.position).normalize();

	// Extend the ray from the camera, until the z-coordinate of the tip of the ray is zero
	var ray								= new THREE.Raycaster(camera.position, dir);
	var distance						= -camera.position.z / dir.z;

	// Store the position of mouse as a point in 3D space, and in the plane z = 0
	var pos								= camera.position.clone().add(dir.multiplyScalar(distance));
	mouse.x								= pos.x;
	mouse.y								= pos.y;
}

function trackKeyPress(e) {
	if (currentGameState == 'game') {
		switch (e.charCode) {
			case 0:
				gameStates[currentGameState].running = false;
				currentGameState = gameStates[currentGameState].transitions.pause;
		}
	}
}

/**
 * Not currently used
 */
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}