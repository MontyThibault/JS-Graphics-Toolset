/* Created by Monty Thibault
   Last updated Nov 2, 2014
   montythibault@gmail.com */


//////////////////
// 01_intro.js

'use strict';
(function($, THREE, undefined) {

var engine = {};



//////////////////
// 02_utils.js

// Little shim so that functions that will always be called in a given context
engine.context = function(func, context) {
	return function() {
		func.apply(context, arguments);
	};
};

engine.flatten = function(arr) {
	return arr.concat.apply([], arr);
};

// Converts from normal screen space coordinates to relative coordinates, where
// x's and y's range from -1 to 1 with (0, 0) being the exact center of the screen
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
	var vec = new THREE.Vector3(),
		raycaster = new THREE.Raycaster();

	return function(v1, v2, objects) {
		raycaster.set(v1, vec.copy(v2).sub(v1).normalize());
		return raycaster.intersectObjects(objects);
	};
})();

engine.project = (function() {
	var vec = new THREE.Vector3(),
		projector = new THREE.Projector();

	return function(v, cam) {
		return projector.projectVector(
			vec.copy(v), 
			cam);
	};
})();

engine.unproject = (function() {
	var vec = new THREE.Vector3(),
		projector = new THREE.Projector();

	return function(v, cam) {
		return projector.unprojectVector(
			vec.copy(v), 
			cam);
	};
})();

// Given a set of mouse coordinates in absolute screen space, this will project
// a ray and return any intersections in the provided list of objects. If no 
// objects are given, it will default to giant plane. Useful for seeing which
// 3d objects the mouse is currently hovering over/clicking on.
engine.raycastMouse = (function() {
	var plane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000, 1, 1));
	plane.rotation.x = -Math.PI / 2; // Flat
	plane.updateMatrixWorld(); // Or else raycasting doesn't work properly

	return function(clientX, clientY, cam, objects) {
		var cameraPosition = 
				new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);

		// if(!engine.userInput.pressed.l) return false;

		var mouse = new THREE.Vector3(
			clientX, 
			clientY, 
			0.5);
		mouse = engine.relativeCoord(mouse);
		mouse = engine.unproject(mouse, cam);

		return engine.intersect(
			cameraPosition, 
			mouse, 
			objects || [plane]);
	};
})();

engine.addPoint = function(vector, scale) {
	var cube = new THREE.Mesh(
		new THREE.BoxGeometry(1, 1, 1),
		new THREE.MeshBasicMaterial({ color: 0x00FF00 }));
	cube.position.copy(vector);
	cube.scale.multiplyScalar(scale || 1);
	
	window.scene.add(cube);

	return cube;
};




// Only add setZeroTimeout to the window object, and hide everything
// else in a closure.
(function() {
    var timeouts = [];
    var messageName = "zero-timeout-message";

    // Like setTimeout, but only takes a function argument.  There's
    // no time argument (always zero) and no arguments (you have to
    // use a closure).
    function setZeroTimeout(fn) {
        timeouts.push(fn);
        window.postMessage(messageName, "*");
    }

    function handleMessage(event) {
        if (event.source == window && event.data == messageName) {
            event.stopPropagation();
            if (timeouts.length > 0) {
                var fn = timeouts.shift();
                fn();
            }
        }
    }

    window.addEventListener("message", handleMessage, true);

    // Add the one thing we want added to the window object.
    window.setZeroTimeout = setZeroTimeout;
})();



//////////////////
// 03_shaders.js

engine.shaders = (function() {

	var	files = [
		'darkness.vert',
		'darkness.frag'];

	var shaders = {},
		$pathLabel = $('#pathLabel');

	function load(callback) {
		var file = files.shift(),
			t = new Date().getTime(); // force browser refresh
			
		$pathLabel.text('shaders/' + file);

		$.get('shaders/' + file + '?t=' + t, function(text) {
			shaders[file] = text;

			if(files.length) {
				load(callback);
			} else {
				engine.materials.init(shaders);
				callback();
			}
		});
	}

	shaders.load = load;
	return shaders;
})();



//////////////////
// 04_materials.js

engine.materials = {

	// Must be called after shaders have loaded
	init: function(shaders) {

		this.darkness = function(texture, map) {

			var vo = map.viewOccluder;

			var uniforms = THREE.UniformsUtils.merge([
				THREE.UniformsLib.common,
				THREE.UniformsLib.lights,
				{
					'uPlayerPosition': {
						type: 'v3',
						value: engine.player.position
					},

					'uVOVerts': {
						type: 'v3v',
						value: vo.vertices
					},

					'uVOEdges': {
						type: 'iv1',
						value: [] // map.generateVOEdges
					},

					'uVOTexture': {
						type: 't',
						value: 1,
						texture: vo.dataTexture
					}
				}
			]);

			uniforms.map.value = texture;

			var defines = {
				'uVOVertsLength': vo.vertices.length,
				'uVOEdgesLength': vo.edgePairs.length
			};

			var vertexShader = engine.shaders['darkness.vert'],
				fragmentShader = engine.shaders['darkness.frag'];

			var mat = new THREE.ShaderMaterial({
				lights: true,
				vertexShader: vertexShader,
				fragmentShader: fragmentShader,
				uniforms: uniforms,
				defines: defines
			});

			mat.map = texture;

			return mat;
		};
	}
};



//////////////////
// 05_userinput.js

// state of keyboard and mouse
engine.userInput = (function() {
        

    var exports = {
        pressed: {},
        listen: listen,

    // Array of handlers for each type of event (keydown/up, mousedown/up/move)
    // Functions are added to these arrays by game objects so that they can 
    // respond to keypresses and such
        kd: [],
        ku: [],
        md: [],
        mu: [],
        mm: [],

        clientX: null,
        clientY: null
    };
    
    function keydown(e) {
        var code = e.charCode || e.keyCode;
        exports.pressed[code] = new Date().getTime();
        
        for(var i = 0; i < exports.kd.length; i++) { 
            exports.kd[i](code, e); 
        }
    }
    
    function keyup(e) {
        var code = e.charCode || e.keyCode;
        delete exports.pressed[code];
        
        for(var i = 0; i < exports.ku.length; i++) { 
            exports.ku[i](code, e); 
        }
    }
    
    function mousedown(e) {
        var button = (['l', 'm', 'r'])[e.which - 1];
        exports.pressed[button] = new Date().getTime();
        
        for(var i = 0; i < exports.md.length; i++) { 
            exports.md[i](button, e); 
        }
    }
    
    function mouseup(e) {
        var button = (['l', 'm', 'r'])[e.which - 1];
        delete exports.pressed[button];
        
        for(var i = 0; i < exports.mu.length; i++) { 
            exports.mu[i](button, e); 
        }
    }
    
    var lastcalled = 0,
        clientX, 
        clientY;
    function mousemove(e) {
        // Limit to video framerate. Browsers call this at 999fps for some reason
        var timestamp = new Date().getTime();
        if((timestamp - lastcalled) >= (1000 / engine.fps)) {
            lastcalled = timestamp;
            
            exports.clientX = e.clientX;
            exports.clientY = e.clientY;
            
            for(var i = 0; i < exports.mm.length; i++) {
                exports.mm[i](e);   
            }
        }
    }
    
    function contextmenu(e) {
        e.preventDefault();
    }
    
    function focus(e) {
        // If the user does something weird, no keyup event will be fired and 
        // a key will seem to be stuck down. This will let them refocus the page
        // to reset everything.
        exports.pressed = {};
    }
    
    function listen() {
		window.addEventListener('keydown', keydown, false);
		window.addEventListener('keyup', keyup, false);
		window.addEventListener('mousedown', mousedown, false);
		window.addEventListener('mouseup', mouseup, false);
		window.addEventListener('mousemove', mousemove, false);
		window.addEventListener('contextmenu', contextmenu, false);
		window.addEventListener('focus', focus, false);
	}
	
	return exports;
})();



//////////////////
// 06_display.js

engine.fps = 60;
engine.display = (function() {

	var renderer, stats,
		exports = {
			init: init,
			render: render,
			listen: listen,
			canvas3d: null,
			canvas2d: null,
			ctx3d: null,
			ctx2d: null,
			onRender: [],
		};

	function init() {
		renderer = new THREE.WebGLRenderer({
				clearColor: 0xF5F5DC,
				alpha: true,
				antialias: true
		});
	    
	    exports.canvas3d = renderer.domElement;
	    exports.ctx3d = renderer.context;

	    /////////////////////////////////////

		stats = new Stats();

		stats.domElement.style.position = 'absolute';
		stats.domElement.style.left = '0px';
		stats.domElement.style.top = '0px';

		/////////////////////////////////////

		exports.canvas2d = $('<canvas></canvas>');
		exports.canvas2d.css({
			'z-index': 10,
			'position': 'absolute',
			'top': 0,
			'left': 0
		});
		exports.canvas2d = exports.canvas2d[0]; // Don't store as JQuery object

		exports.ctx2d = exports.canvas2d.getContext('2d');


		$(document.body).append(exports.canvas3d);
		$(document.body).append(stats.domElement);
		$(document.body).append(exports.canvas2d);
	}

	function render(scene, camera) {
		stats.update();
		renderer.render(scene, camera);


		if(exports.onRender.length) {
			exports.canvas2d.width = window.innerWidth;
			// exports.ctx2d.clearRect(0, 0, window.innerWidth, window.innerHeight);
		}
		
		for(var i = 0; i < exports.onRender.length; i++) {
			exports.onRender[i](exports.ctx2d);
		}
	}

	function fullscreen() {
		renderer.setSize(window.innerWidth, window.innerHeight);

		exports.canvas2d.width = window.innerWidth;
		exports.canvas2d.height = window.innerHeight;
	}

	function listen() {
		window.addEventListener('resize', fullscreen, false);
		fullscreen();
	}
	
	return exports;
})();



//////////////////
// 07_camera.js

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
            var intersect = engine.raycastMouse(e.clientX, e.clientY, exports.cam)[0];
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

	function mousemove(e) {

        // Calculate how much the mouse have moved in screen space since the 
        // last frame
        var diffX = e.clientX - clientXOld,
            diffY = e.clientY - clientYOld;
        clientXOld = e.clientX;
        clientYOld = e.clientY;
        
        if('r' in engine.userInput.pressed) {
            
            yaw.rotation.y -= diffX / 200;
            pitch.rotation.z += diffY / 200;
            limits();
     
        } 

        if('m' in engine.userInput.pressed) {
       
            var factor = Math.pow(1.01, diffY);
			zoom.scale.multiplyScalar(factor);
			limits();
        }
	}
	
	function update() {
        if(!('l' in engine.userInput.pressed)) { return; }

        // Find how much the mouse has moved in world space since the last frame
        var intersect = engine.raycastMouse(
            engine.userInput.clientX, 
            engine.userInput.clientY,
            exports.cam)[0];

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
	        80, 
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
		zoom.scale.set(7, 7, 7);
		
		// Each object controls one aspect of the transform. They placed in
		// the following hierarchy: pivot -> yaw -> zoom -> camera;
		pivot.add(yaw);
		yaw.add(zoom);
		zoom.add(exports.cam);

		// Since pivot is the topmost object, it will be one that is added to
		// the scene
		exports.obj = pivot;
	}

	function listen() {
		window.addEventListener('resize', resize, false);
		engine.userInput.md.push(mousedown);
	}

	function resize() {
        exports.cam.aspect = window.innerWidth / window.innerHeight;
		exports.cam.updateProjectionMatrix();
	}

	// Here, the `target` object holds the ideal values for positioning/rotation/scale.
	// moveTowardsTarget() will interpolate some percentage between the values
	// Thus creating a nice smoothing effect

	var w = 'W'.charCodeAt(0),
		s = 'S'.charCodeAt(0),
		a = 'A'.charCodeAt(0),
		d = 'D'.charCodeAt(0),
		q = 'Q'.charCodeAt(0),
		e = 'E'.charCodeAt(0),

		target = new THREE.Object3D(),
		moveSensitivity = 0.2,
		rotateSensitivity = 0.05, 
		smoothness = 0.1;

	engine.target = target;

	function update() {
		moveTarget();
		moveTowardsTarget();
		updateDrag();


		engine.player.position.copy(target.position);
	}

	function moveTarget() {
		if('l' in engine.userInput.pressed) return;

		if(16 in engine.userInput.pressed) {
			moveSensitivity = 0.01;
			rotateSensitivity = 0.01;
		} else {
			moveSensitivity = 0.2;
			rotateSensitivity = 0.05;
		}

		if(w in engine.userInput.pressed) {
			target.position.z -= Math.cos(yaw.rotation.y) * moveSensitivity;
			target.position.x -= Math.sin(yaw.rotation.y) * moveSensitivity;
		}

		if(s in engine.userInput.pressed) {
			target.position.z += Math.cos(yaw.rotation.y) * moveSensitivity;
			target.position.x += Math.sin(yaw.rotation.y) * moveSensitivity;
		}

		var r = Math.PI / 2;
		if(a in engine.userInput.pressed) {
			target.position.z -= Math.cos(yaw.rotation.y + r) * moveSensitivity;
			target.position.x -= Math.sin(yaw.rotation.y + r) * moveSensitivity;
		}

		if(d in engine.userInput.pressed) {
			target.position.z -= Math.cos(yaw.rotation.y - r) * moveSensitivity;
			target.position.x -= Math.sin(yaw.rotation.y - r) * moveSensitivity;
		}

		if(q in engine.userInput.pressed) {
			target.rotation.y -= rotateSensitivity;
		}

		if(e in engine.userInput.pressed) {
			target.rotation.y += rotateSensitivity;
		}
	}

	function moveTowardsTarget() {
		if(!target || !pivot) return;

		// Position

		var diff = new THREE.Vector3();
		diff.subVectors(target.position, pivot.position);
		
		// Move the camera only a fraction of the displacement
		diff.multiplyScalar(smoothness);
		pivot.position.add(diff);


		// Rotation

		diff = target.rotation.y - yaw.rotation.y;
		diff *= smoothness;
		yaw.rotation.y += diff;
	}

	var mouseDragOld, mouseDragNew;
	function mousedown(button, e) {
        if(button === 'l') {
            // Project the current mouse position to a (mostly) infinite ground 
            // plane. This allows us to compute camera movements in world space,
            // rather than screen space.
            var intersect = engine.raycastMouse(e.clientX, e.clientY, 
            		exports.cam)[0];

            if(intersect) {
                mouseDragOld = intersect.point;
            }
        }
    }

    function updateDrag() {
    	if(!('l' in engine.userInput.pressed)) { return; }

        // Find how much the mouse has moved in world space since the last frame
        var intersect = engine.raycastMouse(
            engine.userInput.clientX, 
            engine.userInput.clientY,
            exports.cam)[0];

        if(!intersect) return;

        mouseDragNew = intersect.point;
        
		var diff = new THREE.Vector3();
		diff.subVectors(mouseDragOld, mouseDragNew);

		diff.multiplyScalar(smoothness);
		pivot.position.add(diff);
    }

	return exports;

})();



//////////////////
// 08_grid.js

engine.grid = (function() {

	function NumberGrid(config) {
		this.box = config.box;

		this.datatype = config.datatype || window.Uint8Array;

		var cells = (this.box.max.x - this.box.min.x) * 
					(this.box.max.y - this.box.min.y);
		this.buffer = new ArrayBuffer(cells * this.datatype.BYTES_PER_ELEMENT);
		this.view = new this.datatype(this.buffer);
	}

	NumberGrid.prototype.toIndex = function(x, y) {
		var min = this.box.min;
		return ((y - min.y) * (this.box.max.x - min.x)) + (x - min.x);

		//return (vec.y * this.x) + vec.x;
	};

	NumberGrid.prototype.overlap = function(other, transparent, destination) {

		var newgrid = destination || new NumberGrid({
			box: this.box.clone().union(other),
			datatype: this.datatype
		});

		var x, y, val;
		for(x = newgrid.box.min.x; x < newgrid.box.max.x; x++) {
			for(y = newgrid.box.min.y; y < newgrid.box.max.y; y++) {

				val = this.view[this.toIndex(x, y)];
				if(val !== undefined && val !== transparent) {
					newgrid.view[newgrid.toIndex(x, y)] = val;
					continue;
				}

				val = other.view[other.toIndex(x, y)];
				if(val !== undefined) {
					newgrid.view[newgrid.toIndex(x, y)] = val;
				}
			}
		}

		return newgrid;
	};

	///////////////////////////////////////////////////

	// Used in conjunction with THREE.DataTexture
	// Goes [r, g, b, r, g, b, r, g, b, et cetera]
	// So it must have 3 integers for every pixel
	function ColorGrid(box) {
		this.box = box;


		var cells = (this.box.max.x - this.box.min.x) * 
					(this.box.max.y - this.box.min.y) * 3;

		this.buffer = new ArrayBuffer(cells);
		this.view = new Uint8Array(this.buffer);
	}

	ColorGrid.prototype.toIndex = function(x, y) {
		var min = this.box.min,
			pixel = ((y - min.y) * (this.box.max.x - min.x)) + (x - min.x);

		return pixel * 3;
	};

	ColorGrid.prototype.overlap = NumberGrid.prototype.overlap;

	///////////////////////////////////////////////////
	
	function BooleanGrid(config) {
		this.config = config;

		this.x = config.x;
		this.y = config.y;

		this.datatype = config.datatype || window.Uint32Array;
		this.buffer = new ArrayBuffer(this.x * this.y / 8);
		this.view = new this.datatype(this.buffer);
	}

	BooleanGrid.prototype.set = function(x, y, value) {
		var index = (y * this.x) + x;

		var cellIndex = Math.floor(index / 8),
			bitIndex = index % 8;


		if(value) {
			this.view[cellIndex] |= (1 << bitIndex);
		} else {
			this.view[cellIndex] &= ~(1 << bitIndex);
		}
	};

	BooleanGrid.prototype.get = function(x, y) {
		var index = (y * this.x) + x;

		var cellIndex = Math.floor(index / 8),
			bitIndex = index % 8;

		return !!(this.view[cellIndex] & (1 << bitIndex));
	};

	BooleanGrid.prototype.union = function(other, destination) {
		if(this.x !== other.x || this.y !== other.y) {
			console.error('Attempt to union grids with different dimensions');
			return false;
		}

		var newgrid = destination || new BooleanGrid(this.config);
		for(var i = 0; i < newgrid.view.length; i++) {
			newgrid.view[i] = this.view[i] | other.view[i];
		}

		return newgrid;
	};

	/////////////////////////////////////////////////////

	function Quadtree(config) {
		this.divided = false;
		this.depth = config.depth || 0;

		this.x = config.x;
		this.y = config.y;
		this.width = config.width;
		this.height = config.height;

		this.parent = config.parent || null;
		this.children = [];
		this.maxChildren = config.maxChildren;
		this.maxDepth = config.maxDepth;
	}

	Quadtree.prototype.add = function(obj) {
		if(this.divided) {
			this.children[this.sort(obj.position)].add(obj);
		} else {
			obj.quad = this;
			this.children.push(obj);

			if(this.children.length > this.maxChildren) {
				this.divide();
			}
		}
	};

	Quadtree.prototype.remove = function(obj) {
		if(divided) {
			var quadrant = this.children[this.sort(obj.position)];
			quadrant.remove(obj);

		} else {
			var index = this.children.indexOf(obj);
			
			if(index !== -1) {
				this.children.splice(index, 1);
			}
		}
	};

	// Calls the given function on all of the objects in the quadtree
	Quadtree.prototype.traverse = function(func) {
		if(this.divided) {
			func(this);
			for(var i = 0; i < this.children.length; i++) {
				this.children[i].traverse(func);
			}
		} else {
			for(var i = 0; i < this.children.length; i++) {
				func(this.children[i]);
			}
		}
	};

	Quadtree.prototype.refresh = function() {
		this.join();
		if(this.children.length > this.maxChildren) {
			this.divide();
		}
	};

	// Specifies which quadrant this object belongs in
	Quadtree.prototype.sort = function(vec) {
		var halfX = this.x + (this.width / 2),
			halfY = this.y + (this.height / 2);

		if(vec.x < halfX && vec.y < halfY) {
			return 0;
		} 
		if(vec.x >= halfX && vec.y < halfY) {
			return 1;
		}
		if(vec.x < halfX && vec.y >= halfY) {
			return 2;
		}
		if(vec.x >= halfX && vec.y >= halfY) {
			return 3;
		}
	};

	Quadtree.prototype.divide = function() {
		if(this.depth >= this.maxDepth) {
			return;
		}

		var halfWidth = this.width / 2,
			halfHeight = this.height / 2;

		var quads = [
			new Quadtree({ 
				depth: this.depth + 1,
				x: this.x, 
				y: this.y, 
				width: halfWidth, 
				height: halfHeight,
				parent: this,
				maxDepth: this.maxDepth,
				maxChildren: this.maxChildren
			}),
			new Quadtree({
				depth: this.depth + 1,
				x: this.x + halfWidth,
				y: this.y,
				width: halfWidth,
				height: halfHeight,
				parent: this,
				maxDepth: this.maxDepth,
				maxChildren: this.maxChildren
			}),
			new Quadtree({
				depth: this.depth + 1,
				x: this.x,
				y: this.y + halfHeight,
				width: halfWidth,
				height: halfHeight,
				parent: this,
				maxDepth: this.maxDepth,
				maxChildren: this.maxChildren
			}),
			new Quadtree({
				depth: this.depth + 1,
				x: this.x + halfWidth,
				y: this.y + halfHeight,
				width: halfWidth,
				height: halfHeight,
				parent: this,
				maxDepth: this.maxDepth,
				maxChildren: this.maxChildren
			})
		];

		for(var i = 0, obj; i < this.children.length; i++) {
			obj = this.children[i];
			quads[this.sort(obj.position)].add(obj);
		}

		this.children = quads;
		this.divided = true;
	};

	Quadtree.prototype.join = function() {
		if(!this.divided) {
			return;
		}

		var objs = [];
		for(var i = 0, child; i < this.children.length; i++) {
			child = this.children[i];
			child.join();
			objs = objs.concat(child.children);
		}

		this.children = objs;
	};

	Quadtree.prototype.draw = function(ctx) {
		ctx.beginPath();
		ctx.moveTo(this.x, this.y);
		ctx.lineTo(this.x + this.width, this.y);
		ctx.lineTo(this.x + this.width, this.y + this.height);
		ctx.lineTo(this.x, this.y + this.height);
		ctx.lineTo(this.x, this.y);
		ctx.closePath();
		ctx.stroke();

		for(var i = 0; i < this.children.length; i++) {
			if(this.children[i] instanceof Quadtree) {
				this.children[i].draw(ctx);
			} else {
				var obj = this.children[i];
				ctx.fillRect(obj.position.x, obj.position.y, 2, 2);
			}
		}
	};

	//////////////////////////////////////////////

	/**
	 * A special scenegraph object to implement octree division for its children
	 * This works for quadtrees and binary trees as well, just set the boundary 
	 * box coordinates `-Infinity` and `Infinity`  for the dimension(s) you want 
	 * to ignore.
	 * 
	 * @class Octree
	 * @constructor
	 * @extends THREE.Object3D
	 * 
	 * @author Monty Thibault
	**/
	function Octree(box, config) {
	    THREE.Object3D.call(this);
	 
	    this.divided = false;
	    this.box = box || new THREE.Box3();
	    
	    this.config = config || {};
	    this.config.maxDepth = this.config.maxDepth || 5;
	    this.config.splitThreshold = this.config.splitThreshold || 10;
	    this.config.joinThreshold =  this.config.joinThreshold || 5;
	}
	 
	Octree.prototype = Object.create(THREE.Object3D.prototype);
	Octree.prototype.constructor = Octree;
	 
	/**
	 * Emulates the standard `object.add` API found in THREE.js. Automatically 
	 * sorts the object into the appropriate region of the tree.
	 * 
	 * @returns true on success, false if the object is not within bounds
	**/
	Octree.prototype.add = function(object, update) {
	    if(this.box.containsPoint(object.position)) {
	        if(this.divided) {
	            var region;
	            for(var i = 0; i < this.children.length; i++) {
	                region = this.children[i];
	                
	                if(region.add(object, update)) {
	                    return true;
	                }
	            }
	        } else {
	            THREE.Object3D.prototype.add.call(this, object);
	            (update !== false) && this.update();
	            return true;
	        }
	    }
	    
	    return false;
	};
	 
	/**
	 * Emulates the standard `object.remove` API found in THREE.js.
	**/
	Octree.prototype.remove = function(object, update) {
	    if(object.parent !== this) {
	        object.parent.remove(object, update);
	        return;
	    }
	    
	    THREE.Object3D.prototype.remove.call(this, object);
	    if(this.parent instanceof Octree) {
	        (update !== false) && this.parent.update();
	    }
	};
	 
	/**
	 * Returns the region that the given point belongs to, without adding it as
	 * an object
	**/
	Octree.prototype.point = function(vec) {
	    if(this.box.containsPoint(vec)) {
	        if(this.divided) {
	            var region;
	            for(var i = 0; i < this.children.length; i++) {
	                region = this.children[i].point(vec);
	                if(region) {
	                    return region;
	                }
	            }
	        } else {
	            return this;
	        }
	    }
	    
	    return false;
	};
	 
	/**
	 * Splits this object into several smaller regions and sorts children
	 * appropriately. This only performs the operation 1 level deep.
	**/
	Octree.prototype.split = function() {
	    if(this.divided || (this.config.maxDepth <= 1)) return false;
	    
	    var config = {
	        joinThreshold: this.config.joinThreshold,
	        splitThreshold: this.config.splitThreshold,
	        maxDepth: this.config.maxDepth - 1
	    };
	    
	    var regions = this.generateRegions(),
	        objects = this.children;
	        
	    this.children = [];
	    for(var i = 0; i < regions.length; i++) {
	        THREE.Object3D.prototype.add.call(this, new Octree(regions[i], config));
	    } 
	    
	    this.divided = true;
	    for(i = 0; i < objects.length; i++) {
	        objects[i].parent = undefined;
	        this.add(objects[i], false);
	    }
	    
	    return true;
	};
	 
	/**
	 * Merges child regions back into this one.
	**/
	Octree.prototype.join = function() {
	    if(!this.divided) return false;
	    
	    var newChildren = [];
	    for(var i = 0; i < this.children.length; i++) {
	        this.children[i].join();
	        newChildren = newChildren.concat(this.children[i].children);
	    }
	    
	    this.children = newChildren;
	    this.divided = false;
	};
	 
	/**
	 * Determines the new bounding boxes when this will be split. (8 octants if 
	 * using an octree and 4 quadrants if using a quadtree)
	**/
	Octree.prototype.generateRegions = function() {
	    var regions = [this.box.clone()],
	        center = this.box.center(), 
	        i, l, boxA, boxB;
	    
	    if(isFinite(this.box.max.x)) {
	        boxA = regions[0];
	        boxB = boxA.clone();
	 
	        boxA.max.x = center.x;
	        boxB.min.x = center.x;
	        
	        // The first box is already part of the array
	        regions.push(boxB);
	    }
	    
	    if(isFinite(this.box.max.y)) {
	        for(i = 0, l = regions.length; i < l; i++) {
	            boxA = regions[i];
	            boxB = boxA.clone();
	            
	            boxA.max.y = center.y;
	            boxB.min.y = center.y;
	            
	            regions.push(boxB);
	        }
	    }
	    
	    if(isFinite(this.box.max.z)) {
	        for(i = 0, l = regions.length; i < l; i++) {
	            boxA = regions[i];
	            boxB = boxA.clone();
	            
	            boxA.max.z = center.z;
	            boxB.min.z = center.z;
	            
	            regions.push(boxB);
	        }
	    }
	    
	    return regions;
	};
	/**
	 * Splits or joins the tree if there are too many/few children
	**/
	Octree.prototype.update = function() {
	    var totalChildren = 0;
	    
	    if(this.divided) {
	        for(var i = 0; i < this.children.length; i++) {
	            totalChildren += this.children[i].update();
	        }
	        
	        if(totalChildren <= this.config.joinThreshold) {
	            this.join();
	        }
	    } else {
	        totalChildren = this.children.length;
	        
	        if(totalChildren >= this.config.splitThreshold) {
	            if(this.split()) {
	                // If it split successfully, see if we can do it again
	                this.update();
	            }
	        }
	    }
	    
	    return totalChildren;
	};
	 
	/**
	 * Sorts object into the correct region. This should be called on objects  
	 * that may have moved out of their regions since the last update. Since it 
	 * will be called frequently, this method does not update the octree structure.
	**/
	Octree.prototype.updateObject = function(object) {
	    // If object is no longer inside this region
	    if(!object.parent.box.containsPoint(object.position)) {
	        object.parent.remove(object, false);
	        
	        // Loop through parent regions until the object is added successfully
	        var oct = object.parent.parent;
	        
	        while(oct instanceof Octree) {
	            if(oct.add(object, false)) {
	                break;
	            }
	            oct = oct.parent;
	        }
	    }
	};
	 
	/** 
	 * Generates a wireframe object to visualize the tree.
	**/
	Octree.prototype.generateGeometry = function() {
	    var container = new THREE.Object3D();
	    var material = new THREE.MeshBasicMaterial({ 
	        color: 0x000000, 
	        wireframe: true });
	    
	    this.traverse(function(object) {
	        if(object instanceof Octree) {
	            var size = object.box.size(),
	                center = object.box.center();
	            
	            var geo = new THREE.CubeGeometry(
	                isFinite(size.x) ? size.x : 0, 
	                isFinite(size.y) ? size.y : 0, 
	                isFinite(size.z) ? size.z : 0, 
	                1, 1, 1);
	            
	            var mesh = new THREE.Mesh(geo, material);
	            mesh.position.set(
	                isFinite(center.x) ? center.x : 0, 
	                isFinite(center.y) ? center.y : 0, 
	                isFinite(center.z) ? center.z : 0);
	            
	            container.add(mesh);
	        } 
	    });
	    
	    return container;
	};

	/////////////////////////////////////////////////////

	return {
		NumberGrid: NumberGrid,
		ColorGrid: ColorGrid,
		BooleanGrid: BooleanGrid,
		Quadtree: Quadtree,
		Octree: Octree
	};
})();



//////////////////
// 09_pathfinding.js

engine.pathfinding = (function() {

	var valid = function(node, grid) {
		// Do not return nodes that are outside the grid
		if(node.x < 0 || 
			node.x >= grid.x ||
			node.y < 0 ||
			node.y >= grid.y) {
			return false;
		}

		// Do not return nodes that are on obstacles
		if(grid.get(node.x, node.y)) return false;

		return true;
	};

	var adjacent = function(source, grid) {
		var nodes = [], t,
			xOffset, yOffset;

		for(xOffset = -1; xOffset <= 1; xOffset++) {
			for(yOffset = -1; yOffset <= 1; yOffset++) {

				// Do not return the source square
				if(xOffset === 0 && yOffset === 0) continue;

				t = new THREE.Vector2(source.x + xOffset, source.y + yOffset);
				if(valid(t, grid)) {
					t.parent = source;
					nodes.push(t);
				}
			}
		}

		return nodes;
	};
	window.a = adjacent;

	// Basically A* minus the heuristic, and a cool name of course.
	// http://en.wikipedia.org/wiki/Dijkstra's_algorithm
	function dijkstra(grid, start, end) {

		if(!valid(start, grid) || !valid(end, grid)) return false;

		start.set(Math.round(start.x), Math.round(start.y));
		end.set(Math.round(end.x), Math.round(end.y));

		var open = [],
			closed = [start],
			latest = start;

		var counter = 0;

		while(true) {

			// If we reached the destination
			if(latest.equals(end)) {
				break;
			}

			var children = adjacent(latest, grid);
			var i, j, a, b, occupied;

			// Add the new nodes to the open list if they're not in it already
			for(i = 0; i < children.length; i++) {
				a = children[i];
				occupied = false;

				for(j = 0; j < open.length; j++) {
					b = open[j];
					if(a.equals(b)) {
						occupied = true;
						break;
					}
				}
				for(j = 0; j < closed.length; j++) {
					b = closed[j];
					if(a.equals(b)) {
						occupied = true;
						break;
					}
				}

				if(!occupied) {
					open.push(children[i]);
				}
			}

			// If we already checked the whole grid
			if(!open.length) {
				return false;
			}

			open.sort(function(a, b) {
				//return Math.random() < 0.5;
				return a.distanceToSquared(end) < b.distanceToSquared(end);
			});

			if(++counter >= 1) {
				engine.activePlayer.visualGrid.highlight(open);
				break;
			}

			latest = open.shift();
			closed.push(latest);
		}

		// Retrace a path
		var path = [latest];

		while(path[path.length - 1].parent) {
			path.push(path[path.length - 1].parent);
		}

		return path;
	}

	function astar() {

	}

	// World's lamest implementation of Bresenham's line algorithm
	// http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
	function direct(grid, start, end) {

		if(!valid(start, grid) || !valid(end, grid)) return false;

		var delta = end.clone().sub(start),
			slope = delta.y / delta.x;

		var path = [];

		if(Math.abs(delta.x) > Math.abs(delta.y)) {
			for(var x = 0; x != delta.x; x += (delta.x > 0) ? 1 : -1) {
				path.push(new THREE.Vector2(x, Math.round(x * slope)).add(start));
			}
		} else {
			for(var y = 0; y != delta.y; y += (delta.y > 0) ? 1 : -1) {
				path.push(new THREE.Vector2(Math.round(y / slope), y).add(start));
				
			}
		}
		
		path.push(end);

		return path;
	}

	function projectile() {

	}

	return {
		dijkstra: dijkstra,
		astar: astar,
		direct: direct,
		projectile: projectile
	};
})();



//////////////////
// 10_overlays.js

engine.overlays = (function() {

	var _height = 0;
	var _translate = new THREE.Matrix4();

	var s = engine.shaders;
	
	function Overlay(box) {
		this.box = box; // THREE.Box2
		var size = box.size();

		var plane = new THREE.PlaneGeometry(size.x, size.y, 1, 1);

		// Un-center the geometry so it starts at (0, 0)
		_translate.makeTranslation(size.x / 2, size.y / 2, 0);
		plane.applyMatrix(_translate);	

		// Translate the geometry so that it matches the box dimensions
		// * Also increment the height so it doesn't interfere with other grids
		_translate.makeTranslation(box.min.x, box.min.y, _height += 0.001);
		plane.applyMatrix(_translate);	

		// plane.computeCentroids();
		plane.computeBoundingBox();

		// Shaders are specific to the subtypes
		THREE.Mesh.call(this, plane, undefined);

		this.rotation.x = -Math.PI / 2;
	}

	Overlay.prototype = Object.create(THREE.Mesh.prototype);
	Overlay.prototype.constructor = Overlay;


	function Constant(box, color) {
		Overlay.call(this, box);

		this.material = new THREE.ShaderMaterial({
			vertexShader: s.standardV,
			fragmentShader: s.overlayConstantF,
			uniforms: {
				uThickness: { type: 'f', value: 0.015 },
				uColor: { type: 'c', value: color }
			}
		});
	}

	Constant.prototype = Object.create(Overlay.prototype);
	Constant.prototype.constructor = Constant;

	function Color(box) {
		Overlay.call(this, box);
		var size = box.size();

		this.colorData = new engine.grid.ColorGrid(box);

		this.texture = new THREE.DataTexture(
			this.colorData.view, 
			size.x, 
			size.y, 
			THREE.RGBFormat);
		this.texture.magFilter = THREE.NearestFilter;
		this.texture.minFilter = THREE.NearestFilter;
		this.texture.generateMipmaps = false; // Optimization woohoo!

		this.material = new THREE.ShaderMaterial({
			vertexShader: s.standardV,
			fragmentShader: s.overlayColorF,
			uniforms: {
				uThickness: { type: 'f', value: 0.015 },
				uColor: { type: 't', value: this.texture }
			}
		});

		this.clearColor = new THREE.Color(0x111111);

		this.clear(this.clearColor);
	}

	Color.prototype = Object.create(Overlay.prototype);
	Color.prototype.constructor = Color;

	Color.prototype.clear = function(color) {
		for(var i = 0; i < this.colorData.view.length; i += 3) {
			this.colorData.view[i] = color.r * 255;
			this.colorData.view[i + 1] = color.g * 255;
			this.colorData.view[i + 2] = color.b * 255;
		}

		this.texture.needsUpdate = true;
	};


	return {
		Overlay: Overlay, 
		Constant: Constant,
		Color: Color
	};
})();



//////////////////
// 11_map.js

engine.Map = (function() {

    // Create a wrapper for the parsing function, which is automatically called
    // by JSONLoader
    var oldParse = THREE.JSONLoader.prototype.parse;
    THREE.JSONLoader.prototype.parse = function(json, texturePath) {

        if(json.metadata.type !== 'map') {
            return oldParse(json, texturePath);
        }

        var obj = oldParse(json, texturePath),
            geo = obj.geometry;

        geo.viewOccluder = oldParse(json.viewOccluder, texturePath).geometry;

        geo.viewOccluder.edgeVerts = json.viewOccluder.edgeVerts;
        geo.viewOccluder.edgePairs = makeEdgePairs(json.viewOccluder.edgeVerts);
        geo.viewOccluder.dataTexture = vertTexture(geo.viewOccluder);

        return obj;
    };

    // Generates viewOccluder.edgePairs of the form [[A1, B1], [A2, B2]]
    // which can collapse into an array of ints [A1, B1, A2, B2 ... ] 
    // that can be fed into a shader
    function makeEdgePairs(edgeVerts) {
        var edgePairs = [];

        for(var i = 0; i < edgeVerts.length; i++) {
            for(var j = 0; j < edgeVerts[i].length; j++) {
                edgePairs.push([i, edgeVerts[i][j]]);
            }
        }

        return edgePairs;
    }

    function vertTexture(vo) {

        // Vertices
        var length = vo.vertices.length,
            data = new Float32Array(length * 3);

        for(var i = 0; i < length; i++) {
            data[length * 3] = vo.vertices[i].x;
            data[(length * 3) + 1] = vo.vertices[i].y;
            data[(length * 3) + 2] = vo.vertices[i].z;
        }

        var texture = new THREE.DataTexture(
            data, 
            length, // width
            1,  // height
            THREE.RGBFormat, 
            THREE.FloatType);

        return texture;
    }


    // TODO rename to prevent confusion between gameworld maps and texture maps

    /** Playable terrain in the game world. Must have geometry, a view occluder,
     * and a texture.
     *
     * @class Map
     * @constructor
    **/
    function Map(config) {
        this.geometryPath = config.geometryPath || 'NOPATH';
        this.texturePath = config.texturePath || 'NOPATH';

        this.geometry = null;
        this.texture = null;
        this.viewOccluder = null;
        this.material = null;
        this.mesh = null;

        // Array of view occluder vertex indicies, arranged from closest to 
        // farthest from a designated target - usually the player position
        this.vertexOrder = [];
    }


    var $pathLabel = $('#pathLabel'), 
        loader = new THREE.JSONLoader();

    /** Loads geometry, texture, and sets properties
     *
     * @param callback
     * @class Map
     * @method load
     */
    Map.prototype.load = function(callback) {
        var t = new Date().getTime(), // force browser refresh
            that = this;

        $pathLabel.text(this.geometryPath);
        loader.load(this.geometryPath + '?t=' + t, function (geometry) {

            that.geometry = geometry;
            that.viewOccluder = geometry.viewOccluder;

            $pathLabel.text(that.texturePath);
            THREE.ImageUtils.loadTexture(that.texturePath + '?t=' + t, 
                THREE.UVMapping, function(texture) {

                that.texture = texture;

                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                texture.anisotropy = 16;

                that.material = new engine.materials.darkness(texture, that);

                var lines = that.generateVOLines(that.viewOccluder);

                that.mesh = new THREE.Mesh(geometry, that.material);

                //callback(exports.mesh);
                var obj = new THREE.Object3D();
                // obj.add(lines);
                obj.add(that.mesh);
                callback(obj);
            });
        });
    };

    /** Returns scenegraph object composed of individual lines for visualization
     * of the view occluder.
     *
     * @class Map
     * @method generateVOLines
     **/
    Map.prototype.generateVOLines = function() {

        var v = this.viewOccluder,
            material = new THREE.LineBasicMaterial({
                color: 0x7777ff,
                linewidth: 2
        });

        // material.depthWrite = false;
        // material.depthTest = false;

        var bigObj = new THREE.Object3D(),  
            geo, line;

        // for(var i = 0; i < v.edges.length; i++) {
        //     for(var j = 0; j < v.edges[i].length; j++) {
        //         console.log(v.vertices[i], v.vertices[v.edges[i][j]]);
        //         geo = new THREE.Geometry();
        //         geo.vertices.push(v.vertices[i], v.vertices[v.edges[i][j]]);
        //         line = new THREE.Line(geo, material);
        //         bigObj.add(line);
        //     }
        // }

        for(var i = 0; i < v.edgePairs.length; i += 2) {
            var mat = new THREE.LineBasicMaterial({
                color: new THREE.Color().setHSL(i / v.edgePairs.length, 1, 0.5),
                linewidth: 2
            });

             geo = new THREE.Geometry();
            geo.vertices.push(v.vertices[v.edgePairs[i]], 
                              v.vertices[v.edgePairs[i + 1]]);
                
            line = new THREE.Line(geo, mat);
            bigObj.add(line);
        }

     
        bigObj.position.set(0, 1, 0);
        // bigObj.renderDepth = 1e20;

        return bigObj;
    };

    /** Sorts view occluder vertices by distance (closest first) to the target
     *
     * @class Map
     * @method updateVertexOrder
     * @private
     **/
    function updateVertexOrder(self, target) {
        var verts = self.viewOccluder.vertices;

        self.vertexOrder.length = 0;
        
        for(var i = 0; i < verts.length; i++) {
            self.vertexOrder.push(i);
        }

        self.vertexOrder.sort(function(a, b) {
            return verts[a].distanceToSquared(target) - 
                   verts[b].distanceToSquared(target);
        });
    }


    /** Returns an array of the form [A1, B1, A2, B2 ...] that is fed as a 
      * uniform into a shader that implements view occlusion. Edges are sorted
      * by distance (closest first) to the target.
      *
      * @ param {Vector3} target Usually player.position
      * @ param {Int} cutoff The max number of edges in the array
      */
    Map.prototype.generateVOEdges = function(target, cutoff) {

        updateVertexOrder(this, target);

        var vo = this.viewOccluder,
            that = this;

        vo.edgePairs.sort(function(a, b) {

            var a1 = that.vertexOrder.indexOf(a[0]),
                a2 = that.vertexOrder.indexOf(a[1]),
                b1 = that.vertexOrder.indexOf(b[0]),
                b2 = that.vertexOrder.indexOf(b[1]);

            // Math.min(x1, x2) refers to the closest vertex
            // Math.max(x1, x2) refers to the farthest vertex

            // Sort by closest vertex first; if they're the same, sort by
            // the far one.

            if(Math.min(a1, a2) === Math.min(b1, b2)) {

                return Math.max(a1, a2) < Math.max(b1, b2) ? -1 : 1;

            } else {

                return Math.min(a1, a2) < Math.min(b1, b2) ? -1 : 1;
            }
        }); 

        // Return no more than <cutoff> number of edges.
        // Perhaps useful for optimization 
        var trimmed = cutoff ? vo.edgePairs.slice(0, cutoff) : vo.edgePairs;

        return engine.flatten(trimmed);
    };

    return Map;
})();



//////////////////
// 12_player.js

engine.player = (function() {

	var obj = new THREE.Object3D(),
		pointLight = new THREE.PointLight(0xFFFFFF, 2, 50),
		box = new THREE.BoxGeometry(1, 1, 1),
		mat = new THREE.MeshBasicMaterial({ color: 0x00FF00 }),
		mesh = new THREE.Mesh(box, mat);

	pointLight.position.set(0, 3, 0);
	mesh.scale.multiplyScalar(0.3);

	obj.add(pointLight);
	obj.add(mesh);


	return obj;
})();



//////////////////
// 13_main.js

(function main(engine) {

	window.engine = engine;

	engine.display.init();
	engine.topdownCamera.init();

	engine.userInput.listen();
	engine.display.listen();
	engine.topdownCamera.listen();

	var sampleMap;

	engine.shaders.load(function() {

		sampleMap = new engine.Map({
			geometryPath: 'assets/samplemap/map.js',
			texturePath: 'assets/samplemap/Colormap.png'
		});

		sampleMap.load(function(mesh) {

			$('#loader').fadeOut();

			scene.add(mesh);

			loaded = true;
		});
	});

	var scene = new THREE.Scene();
	scene.add(engine.topdownCamera.obj);
	scene.add(engine.player);

	window.scene = scene;
	var loaded = false;
	(function frame() {
		window.frame = frame;

		if(loaded) {

			// TODO refactor this into material's own update function? OR incorportate hierarchichcal world update function <----

			sampleMap.material.uniforms.uPlayerPosition.value.copy(engine.player.position);

			console.clear();
			sampleMap.material.uniforms.uVOEdges.value = sampleMap.generateVOEdges(engine.player.position, 10);

			console.log(sampleMap.viewOccluder.edgePairs);
		}
		engine.topdownCamera.update();
		engine.display.render(scene, engine.topdownCamera.cam);

		//if(loaded) return;

		if(engine.fps === 60) {
            window.requestAnimationFrame(frame);
		} else if(engine.fps === 0) {
			window.setZeroTimeout(frame); // MAXIMUM PERFORMANCE
		} else {
            window.setTimeout(frame, 1000 / engine.fps);
		}
	})();
})(engine);



//////////////////
// 14_outro.js

})($, THREE);