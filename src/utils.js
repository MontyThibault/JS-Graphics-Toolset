// Little shim so that functions that will always be called in a given context
engine.context = function(func, context) {
	return function() {
		func.apply(context, arguments);
	};
};

engine.relativeCoord = function(vec) {
	vec.x = (vec.x / window.innerWidth) * 2 - 1;
	vec.y = -(vec.y / window.innerHeight) * 2 + 1;

	return vec;
};

engine.absoluteCoord = function(vec) {
	vec.x = (vec.x + 1) / 2 * window.innerWidth;
	vec.y = (vec.y - 1) / 2 * -window.innerHeight;

	return vec;
};

engine.intersect = (function() {
	var _vec = new THREE.Vector3(),
		_raycaster = new THREE.Raycaster();

	return function(v1, v2, objects) {
		_raycaster.set(v1, _vec.copy(v2).sub(v1).normalize());
		return _raycaster.intersectObjects(objects);
	};
})();

engine.project = (function() {
	var _vec = new THREE.Vector3(),
		_projector = new THREE.Projector();

	return function(v) {
		return _projector.projectVector(
			_vec.copy(v), 
			engine.activePlayer.camera.camera);
	};
})();

engine.unproject = (function() {
	var _vec = new THREE.Vector3(),
		_projector = new THREE.Projector();

	return function(v) {
		return _projector.unprojectVector(
			_vec.copy(v), 
			engine.activePlayer.camera.camera);
	};
})();

engine.raycastMouse = (function() {
	var _plane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000, 1, 1));
	_plane.rotation.x = -Math.PI / 2;
	_plane.updateMatrixWorld(); // Or else raycasting doesn't work properly

	return function(objects) {
		var keyboard = engine.core.keyboard,
			camera = engine.activePlayer.camera.camera;

		if(!keyboard._mouseE) return false;

		var mouse = new THREE.Vector3(
			keyboard._mouseE.clientX, 
			keyboard._mouseE.clientY, 
			0.5);
		mouse = engine.relativeCoord(mouse);
		mouse = engine.unproject(mouse, camera);

		return engine.intersect(
			camera.matrixWorld.getPosition(), 
			mouse, 
			objects || [_plane]);
	};
})();

engine.addPoint = function(vector, scale) {
	var scene = engine.activeGame.scene;

	var cube = new THREE.Mesh(
		new THREE.CubeGeometry(1, 1, 1),
		new THREE.MeshBasicMaterial({ color: 0x000000 }));
	cube.position = vector;
	cube.scale.multiplyScalar(scale);
	
	scene.add(cube);

	return cube;
};