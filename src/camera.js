engine.Camera = (function() {
	
	var _vec = new THREE.Vector3();

	var _plane = new THREE.Mesh(
		new THREE.PlaneGeometry(10000, 10000, 1, 1),
		new THREE.MeshBasicMaterial({ color: 0x00FF00 })
	);
	_plane.rotation.x = -Math.PI / 2;
	_plane.visible = false;

	var _debug = new THREE.Mesh(
		new THREE.CubeGeometry(1, 1, 1),
		new THREE.MeshBasicMaterial({ color: 0x00FF00 })
	);
	//_debug.scale.multiplyScalar(0.01);

	var _debug2 = new THREE.Mesh(
		new THREE.CubeGeometry(1, 1, 1),
		new THREE.MeshNormalMaterial()//new THREE.MeshBasicMaterial({ color: 0x0000FF })
	);


	function Camera() {

		this.camera = new THREE.PerspectiveCamera(
			75, 
			window.innerWidth / window.innerHeight, 
			1e-2, 
			1e3);

		this.camera.position.set(0, 1, 0);
		this.camera.lookAt(new THREE.Vector3());

		this.yaw = new THREE.Object3D();
		this.yaw.rotation.y = 0;

		this.pitch = new THREE.Object3D();
		this.pitch.rotation.x = 0; //-Math.PI / 2;

		this.zoom = new THREE.Object3D();
		this.zoom.scale.set(10, 10, 10);

		this.pivot = new THREE.Object3D();

		this.pitch.add(this.camera);
		this.yaw.add(this.pitch);
		this.zoom.add(this.yaw);
		this.pivot.add(this.zoom);

		this.limits();
		this.initListeners();

		var mouseDragOld;
		this.active = false;

		this.bindings = {

			'^u 87$': engine.context(function(data) {
				this.zoom.scale.multiplyScalar(1 / 1.05);
				this.limits();
			}, this),

			'^u 83$': engine.context(function(data) {
				this.zoom.scale.multiplyScalar(1.05);
				this.limits();
			}, this),

			'^mm middle$': engine.context(function(data) {
				var factor = Math.pow(1.01, data.difference.y);
				this.zoom.scale.multiplyScalar(factor);
				this.limits();
			}, this),

			'^mm right$': engine.context(function(data) {
				this.yaw.rotation.y -= data.difference.x / 200;
				this.pitch.rotation.z += data.difference.y / 200;
				this.limits();
			}, this),

			'^md (middle|right)': engine.context(function(data) {
				this.active = true;
			}, this),

			'^mu (middle|right)': engine.context(function(data) {
				this.active = false;
			}, this),

			/////////////////////////////

			'^md left$': engine.context(function(data) {
				var mouse = engine.raycastMouse()[0];
				if(mouse) {
					mouseDragOld = mouse.point;
					this.active = true;
				}
			}, this),

			'^mu left$': engine.context(function(data) {
				mouseDragOld = undefined;
				this.active = false;
			}, this),

			'^u left$': engine.context(function(data) {
				if(!this.active) return;

				var mouseDragNew = engine.raycastMouse()[0];
				if(!mouseDragNew) return;
				mouseDragNew = mouseDragNew.point;

				var dist = this.pivot.position.distanceTo(mouseDragNew);

				_vec.subVectors(mouseDragOld, mouseDragNew);
				_vec.multiplyScalar(0.3);
				this.pivot.position.add(_vec);
			}, this)
		};
	}

	Camera.prototype.addHelpers = function(scene) {
		scene.add(_debug);
		scene.add(_debug2);
		scene.add(_plane);
	};

	Camera.prototype.limits = function() {
		//if(this.zoom.scale.length() > 50) this.zoom.scale.setLength(50);
		if(this.pitch.rotation.z > -0.1) this.pitch.rotation.z = -0.1;
		if(this.pitch.rotation.z < -1.2) this.pitch.rotation.z = -1.2;
	};

	Camera.prototype._resize = function() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
	};

	Camera.prototype.initListeners = function() {
		window.addEventListener('resize', engine.context(this._resize, this), false);
	};

	return Camera;
})();