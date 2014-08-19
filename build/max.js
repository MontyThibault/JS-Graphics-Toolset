/* Created by Monty Thibault
   Last updated Apr 04, 2014
   montythibault@gmail.com */


//////////////////
// intro.js

'use strict';
(function($, THREE, undefined) {

var engine = {};



//////////////////
// utils.js

// Little shim so that functions that will always be called in a given context
engine.context = function(func, context) {
	return function() {
		func.apply(context, arguments);
	};
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

	return function(v) {
		return projector.projectVector(
			vec.copy(v), 
			engine.camera.cam);
	};
})();

engine.unproject = (function() {
	var vec = new THREE.Vector3(),
		projector = new THREE.Projector();

	return function(v) {
		return projector.unprojectVector(
			vec.copy(v), 
			engine.camera.cam);
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

	return function(clientX, clientY, objects) {
		var camera = engine.camera.cam;

		if(!engine.userInput.pressed.l) return false;

		var mouse = new THREE.Vector3(
			clientX, 
			clientY, 
			0.5);
		mouse = engine.relativeCoord(mouse);
		mouse = engine.unproject(mouse, camera);

		return engine.intersect(
			camera.matrixWorld.getPosition(), 
			mouse, 
			objects || [plane]);
	};
})();

engine.addPoint = function(vector, scale) {
	var cube = new THREE.Mesh(
		new THREE.CubeGeometry(1, 1, 1),
		new THREE.MeshBasicMaterial({ color: 0x000000 }));
	cube.position = vector;
	cube.scale.multiplyScalar(scale);
	
	engine.activeGame.scene.add(cube);

	return cube;
};



//////////////////
// shaders.js

engine.shaders = (function() {

	var shaders = {},
		files = [
		'gridHighlightF',
		'gridHighlightV',
		'overlayColorF',
		'overlayConstantF',
		'selectionPlaneF',
		'selectionPlaneV',
		'standardV'];

	function load(callback) {
		var file = files.shift();
		engine.loader.path.text('shaders/' + file);

		$.get('shaders/' + file, function(text) {
			shaders[file] = text;

			if(files.length) {
				load(callback);
			} else {
				callback();
			}
		});
	}

	shaders.load = load;
	return shaders;
})();



//////////////////
// userinput.js

// state of keyboard and mouse
engine.userInput = (function() {
    
    var pressed = {};
    
    // Array of handlers for each type of event (keydown/up, mousedown/up/move)
    // Functions are added to these arrays by game objects so that they can 
    // respond to keypresses and such
    var kd = [],
        ku = [],
        md = [],
        mu = [],
        mm = [];
    
    
    function keydown(e) {
        var code = e.charCode || e.keyCode;
        pressed[code] = new Date().getTime();
        
        for(var i = 0; i < kd.length; i++) { 
            kd[i](code, e); 
        }
    }
    
    function keyup(e) {
        var code = e.charCode || e.keyCode;
        delete pressed[code];
        
        for(var i = 0; i < ku.length; i++) { 
            ku[i](code, e); 
        }
    }
    
    function mousedown(e) {
        var button = (['l', 'm', 'r'])[e.which - 1];
        pressed[button] = new Date().getTime();
        
        for(var i = 0; i < md.length; i++) { 
            md[i](button, e); 
        }
    }
    
    function mouseup(e) {
        var button = (['l', 'm', 'r'])[e.which - 1];
        delete pressed[button];
        
        for(var i = 0; i < mu.length; i++) { 
            mu[i](button, e); 
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
            
            clientX = e.clientX;
            clientY = e.clientY;
            
            for(var i = 0; i < mm.length; i++) {
                mm[i](e);   
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
        pressed = {};
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
	
	return {
        pressed: pressed,
        listen: listen,
        clientX: clientX,
        clientY: clientY,
        kd: kd,
        ku: ku,
        md: md,
        mu: mu,
        mm: mm
	};
})();



//////////////////
// display.js

engine.fps = 60;
engine.display = (function() {

	var renderer = new THREE.WebGLRenderer({
			clearColor: 0xF5F5DC,
			clearAlpha: 1,
			antialias: true
	});
    
    var canvas = renderer.domElement,
        ctx = renderer.context;

	$(document.body).append(canvas);

    /////////////////////////////////////

	var stats = new Stats();

	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';

	$(document.body).append(stats.domElement);

	//////////////////////////////////////


	function render(scene, camera) {
		stats.update();
		renderer.render(scene, camera);
	}

	function fullscreen() {
		renderer.setSize(window.innerWidth, window.innerHeight - 5);
	}
	fullscreen();

	function listen() {
		window.addEventListener('resize', fullscreen, false);
	}
	
	return {
        render: render,
        canvas: canvas,
        listen: listen,
        ctx: ctx
	};
})();



//////////////////
// camera.js

engine.camera = (function() {
	
	var cam = new THREE.PerspectiveCamera(
        75, 
		window.innerWidth / window.innerHeight, 
		0.01, 
		1000),
		
		zoom = new THREE.Object3D(),
		yaw = new THREE.Object3D(),
		pitch = new THREE.Object3D(),
		pivot = new THREE.Object3D();
	
	
	// As default, set cam one unit away, looking downwards.
	cam.position.set(0, 1, 0);
	cam.lookAt(new THREE.Vector3());
	
	pivot.position.set(0, 0, 0);
	zoom.scale.set(10, 10, 10);
	yaw.rotation.y = 0;
	pitch.rotation.x = 0;
	
	// Each object controls one aspect of the transform. They are parented in
	// the following order: pivot -> zoom -> yaw -> pitch -> camera
	pivot.add(zoom);
	zoom.add(yaw);
	yaw.add(pitch);
	pitch.add(cam);


	function limits() {
        //if(this.zoom.scale.length() > 50) { this.zoom.scale.setLength(50); }
		if(pitch.rotation.z > -0.1) { pitch.rotation.z = -0.1; }
		if(pitch.rotation.z < -1.2) { pitch.rotation.z = -1.2; }
	}
	
	function resize() {
        cam.aspect = window.innerWidth / window.innerHeight;
		cam.updateProjectionMatrix();
	}

	function listen() {
		window.addEventListener('resize', resize, false);
	}
	
	// Camera controls
	var activeButton = false,
        mouseDragOld,
        mouseDragNew,
        intersect;
	
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
        }
	}
	
	function mouseup() {
        activeButton = false;
        mouseDragOld = undefined;
	}
	
	var clientXOld, clientYOld;
	function mousemove(button, e) {
        if((activeButton !== 'r') && (activeButton !== 'm')) { return; }
        
        // Calculate how much the mouse have moved in screen space since the 
        // last frame
        var diffX = e.clientX - clientXOld,
            diffY = e.clientY - clientYOld;
        clientXOld = e.clientX;
        clientYOld = e.clientY;
        
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
        intersect = engine.raycastMouse(
            engine.userInput.clientX, 
            engine.userInput.clientY)[0];
        if(!intersect) return;
        mouseDragNew = intersect.point;
        
		var diff = new THREE.Vector3();
		diff.subVectors(mouseDragOld, mouseDragNew);
		
		// Move the camera 30% percent the displacement
        // This creates a neat smoothing effect. Otherwise it seems jittery
		diff.multiplyScalar(0.3);
		pivot.position.add(diff);
	}
	
	engine.userInput.md.push(mousedown);
	engine.userInput.mu.push(mouseup);
	engine.userInput.mm.push(mousemove);
	
	return {
        cam: cam,
        listen: listen,
        update: update
	};
})();



//////////////////
// grid.js

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
// pathfinding.js

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
// overlays.js

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

		plane.computeCentroids();
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

		//////////////////////////////////

		// this.startSquare = new THREE.Vector2();
		// this.endSquare = new THREE.Vector2();

		// this.bindings = {
		// 	'^mm$': engine.context(function() {
		// 		// this.clear();

		// 		// // Update mouse highlight square
		// 		// var mouse = engine.raycastMouse()[0];
		// 		// if(engine.activePlayer.camera.active) return;
		// 		// if(mouse) {
		// 		// 	this.highlightSingle(
		// 		// 		new THREE.Vector2(mouse.point.x, -mouse.point.z)
		// 		// 	);
		// 		// }
		// 	}, this),

		// 	'^kd 32$': engine.context(function(e) {
		// 		var t = engine.raycastMouse()[0].point;
		// 		this.startSquare.set(t.x, -t.z);
		// 		this.startSquare = this.snap(this.startSquare);

		// 		this.endSquare.copy(this.startSquare);

		// 		//console.log(this.startSquare, this.endSquare);
		// 		//var route = engine.pathfinding.dijkstra(grid, this.startSquare, this.endSquare);
		// 		var route = engine.pathfinding.direct(grid, this.startSquare, this.endSquare);
		// 		this.highlightGroup(route);
		// 	}, this),

		// 	'^mm 32$': engine.context(function(e) {
		// 		var t = engine.raycastMouse()[0].point;
		// 		this.endSquare.set(t.x, -t.z);
		// 		this.endSquare = this.snap(this.endSquare);
		// 		this.clear();
		// 		//console.log(this.startSquare, this.endSquare);
		// 		//var route = engine.pathfinding.dijkstra(grid, this.startSquare, this.endSquare);
		// 		var route = engine.pathfinding.direct(grid, this.startSquare, this.endSquare);
		// 		//if(!route) return;
				
		// 		//this.clear();
		// 		this.highlightGroup(route);
		// 	}, this)
		// };
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
// loader.js

engine.loader = {
	path: $('#path'),
	hide: $('#loader').hide,
	show: $('#loader').show,
	fadeIn: $('#loader').fadeIn,
	fadeOut: $('#loader').fadeOut
};



//////////////////
// main.js

(function main(engine) {
	window.engine = engine; // Testing
	
	engine.userInput.listen();
	engine.display.listen();
	engine.camera.listen();

	engine.shaders.load(function() {
		engine.loader.fadeOut();
	});


	var sampleMap = new engine.grid.BooleanGrid({
		x: 128,
		y: 128
	});
	
	var scene = new THREE.Scene();

    var grid = new engine.overlays.Color(new THREE.Box2(new THREE.Vector2(), new THREE.Vector2(128, 128)));

	function newColors() {
		var v = grid.colorData.view;

		var square = Math.floor(Math.random() * 128 * 128 * 3);
		v[square] = Math.random() * 255;
		v[square + 1] = Math.random() * 255;
		v[square + 2] = Math.random() * 255;

		grid.texture.needsUpdate = true;
	}

	(function frame() {
		engine.camera.update();
		newColors();
		engine.display.render(scene, engine.camera.cam);

		if(engine.fps === 60) {
            window.requestAnimationFrame(frame);
		} else {
            window.setTimeout(frame, 1000 / engine.fps);
		}
	})();
})(engine);



//////////////////
// outro.js

})($, THREE);