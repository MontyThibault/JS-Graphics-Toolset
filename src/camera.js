engine.tumbleCamera = (function() {

	var zoom, yaw, pitch, pivot,
		exports = {
			init: init,
			listen: listen,
			update: update,
			obj: null,
			cam: null
		};

	function init() {
		exports.cam = new THREE.PerspectiveCamera(
	        60, 
			window.innerWidth / window.innerHeight, 
			0.01, 
			10000);

		zoom = new THREE.Object3D();
		yaw = new THREE.Object3D();
		pitch = new THREE.Object3D();
		pivot = new THREE.Object3D();

		// As default, set cam one unit away, looking downwards.
		exports.cam.position.set(0, 1, 0);
		exports.cam.lookAt(new THREE.Vector3());
		
		pivot.position.set(0, 0, 0);
		zoom.scale.set(10, 10, 10);
		yaw.rotation.y = 0;
		pitch.rotation.x = 0;
		
		// Each object controls one aspect of the transform. They placed in
		// the following hierarchy: pivot -> zoom -> yaw -> pitch -> camera
		pivot.add(zoom);
		zoom.add(yaw);
		yaw.add(pitch);
		pitch.add(exports.cam);

		// Since pivot is the topmost object, it will be one that is added to
		// the scene
		exports.obj = pivot;
	}

	function limits() {
        //if(this.zoom.scale.length() > 50) { this.zoom.scale.setLength(50); }
		if(pitch.rotation.z > -0.1) { pitch.rotation.z = -0.1; }
		if(pitch.rotation.z < -1.2) { pitch.rotation.z = -1.2; }
	}
	
	function resize() {
        exports.cam.aspect = window.innerWidth / window.innerHeight;
		exports.cam.updateProjectionMatrix();
	}

	function listen() {
		window.addEventListener('resize', resize, false);

		engine.userInput.md.push(mousedown);
		engine.userInput.mu.push(mouseup);
		engine.userInput.mm.push(mousemove);
	}
	
	// Controls
	var activeButton = false,
        mouseDragOld,
        mouseDragNew,
        intersect,
        clientXOld, 
        clientYOld;
	
	function mousedown(button, e) {
        if(button === 'l') {
            // Project the current mouse position to a (mostly) infinite ground 
            // plane. This allows us to compute camera movements in world space,
            // rather than screen space.
            var intersect = engine.raycastMouse(e.clientX, e.clientY)[0];
            if(intersect) {
                activeButton = 'l';
                mouseDragOld = intersect.point;
            }
        } else {
            activeButton = button;

            clientXOld = e.clientX;
            clientYOld = e.clientY;
        }
	}
	
	function mouseup() {
        activeButton = false;
        mouseDragOld = undefined;
	}
	
	function mousemove(e) {
        if((activeButton !== 'r') && (activeButton !== 'm')) { return; }


        // Calculate how much the mouse have moved in screen space since the 
        // last frame
        var diffX = e.clientX - clientXOld,
            diffY = e.clientY - clientYOld;
        clientXOld = e.clientX;
        clientYOld = e.clientY;

        // 
        if((diffX === NaN) || (diffY === NaN)) {
        	return;
        }
        
        if(activeButton === 'r') {
            
            yaw.rotation.y -= diffX / 200;
            pitch.rotation.z += diffY / 200;
            limits();
     
        } else if(activeButton === 'm') {
            
            var factor = Math.pow(1.01, diffY);
			zoom.scale.multiplyScalar(factor);
			limits();
        }
	}
	
	function update() {
        if(activeButton !== 'l') { return; }

        // Find how much the mouse has moved in world space since the last frame
        var intersect = engine.raycastMouse(
            engine.userInput.clientX, 
            engine.userInput.clientY)[0];

        if(!intersect) return;

        mouseDragNew = intersect.point;
        
		var diff = new THREE.Vector3();
		diff.subVectors(mouseDragOld, mouseDragNew);
		
		// Move the camera 50% percent the displacement
        // This creates a neat smoothing effect. Otherwise it seems jittery
		diff.multiplyScalar(0.5);
		pivot.position.add(diff);
	}

	return exports;
})();

engine.topdownCamera = (function() {
	var zoom, yaw, pivot,
		exports = {
			init: init,
			listen: listen,
			update: update,
			obj: null,
			cam: null
		};

	function init() {
		exports.cam = new THREE.PerspectiveCamera(
	        60, 
			window.innerWidth / window.innerHeight, 
			0.01, 
			10000);

		
		yaw = new THREE.Object3D();
		pivot = new THREE.Object3D();
		zoom = new THREE.Object3D();

		// As default, set cam one unit away, looking downwards.
		exports.cam.position.set(0, 1, 0.3);
		exports.cam.lookAt(new THREE.Vector3());
		
		yaw.rotation.y = 0;
		pivot.position.set(0, 0, 0);
		zoom.scale.set(10, 10, 10);
		
		// Each object controls one aspect of the transform. They placed in
		// the following hierarchy: yaw -> pivot -> zoom -> camera;
		yaw.add(pivot);
		pivot.add(zoom);
		zoom.add(exports.cam);

		// Since pivot is the topmost object, it will be one that is added to
		// the scene
		exports.obj = yaw;
	}

	function listen() {
		window.addEventListener('resize', resize, false);;
	}

	function resize() {
        exports.cam.aspect = window.innerWidth / window.innerHeight;
		exports.cam.updateProjectionMatrix();
	}


	var w = 'W'.charCodeAt(0),
		s = 'S'.charCodeAt(0),
		a = 'A'.charCodeAt(0),
		d = 'D'.charCodeAt(0),

		keySensitivity = 0.15;


	function update() {
		if(w in engine.userInput.pressed) {
			pivot.position.z -= keySensitivity;
		}

		if(s in engine.userInput.pressed) {
			pivot.position.z += keySensitivity;
		}

		if(a in engine.userInput.pressed) {
			pivot.position.x -= keySensitivity;
		}

		if(d in engine.userInput.pressed) {
			pivot.position.x += keySensitivity;
		}
	}

	return exports;

})();