/* Created by Monty Thibault
   Last updated Mar 23, 2013
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



//////////////////
// shaders.js

engine.shaders = {
	'selection_plane': new THREE.ShaderMaterial({
		vertexShader: $('#selection_plane_vertex').text(),
		fragmentShader: $('#selection_plane_fragment').text(),
		uniforms: {
			'uThickness': { type: 'f', value: 0.015 },
			'uColor': { type: "t", value: new THREE.ImageUtils.generateDataTexture(32, 32, new THREE.Color(0x45E2ED)) }
		}
	}),
	'grid_highlight': new THREE.ShaderMaterial({
		vertexShader: $('#grid_highlight_vertex').text(),
		fragmentShader: $('#grid_highlight_fragment').text()
	})
};



//////////////////
// keyboard.js

engine.Keyboard = (function() {

	var _vec = new THREE.Vector2();

	function Keyboard() {
		this.bindings = {
			// '^keyDown 32$': function() { console.log(':)'); }
			// 'p.*65.*83.*68': function() { console.log('ASD in that order.') }
			// 'p(?=.* 65)(?=.* 83)(?=.* 68)': function() { console.log('ASD in any order'); },
			// '^d 65$': function() { console.log('Exactly A'); },
			// 'd(?!.* 83).*': function() { console.log('Not S'); }
		};

		this._pressed = {};
		this._mouseBefore = new THREE.Vector2();
		this._mouseAfter = new THREE.Vector2();
		this._mouseE;

		this.initListeners();
	}	

	Keyboard.prototype.addBindings = function(bindings) {
		$.extend(this.bindings, bindings);
	};

	/* Scans all the bindings and executes any occurances. */
	Keyboard.prototype.searchKeys = function(bindings, eventType, data) {

		// Sort keypresses in chronological order
		var order = [];
		for(var key in this._pressed) {
			order.push([key, this._pressed[key]]);	
		}
		order.sort(function(a, b) {
			return a[1] - b[1];
		});

		// Form a 'trigger' string that characterizes this event
		var trigger = eventType;
		for(var i = 0; i < order.length; i++) {
			trigger += ' ' + order[i][0];
		}
		trigger.trim();

		// Test and execute callbacks
		for(var regex in bindings) {
			if(new RegExp(regex).test(trigger)) {

				var callback = bindings[regex];

				if(typeof callback === 'object') {
					searchKeys(callback, eventType, data);
				} else if(typeof callback === 'function') {
					callback(data);
				}
			}
		}
	};

	Keyboard.prototype._keydown = function(e) {
		var code = e.charCode || e.keyCode;
		// e.preventDefault();

		// Stop that repeating thing that happens when you hold a key down
		if(this._pressed[code]) {
			return;
		}

		console.log(code);

		this._pressed[code] = new Date().getTime();
		this.searchKeys(this.bindings, 'kd', { e: e });
	};

	Keyboard.prototype._keyup = function(e) {
		var code = e.charCode || e.keyCode;

		this.searchKeys(this.bindings, 'ku', { e: e });
		delete this._pressed[code];
	};

	Keyboard.prototype._mousedown = function(e) {
		var button = ([
			'left',
			'middle',
			'right'
		])[e.which - 1];

		this._pressed[button] = new Date().getTime();
		this.searchKeys(this.bindings, 'md', { e: e });
	};

	Keyboard.prototype._mouseup = function(e) {
		var button = ([
			'left',
			'middle',
			'right'
		])[e.which - 1];

		this.searchKeys(this.bindings, 'mu', { e: e });
		delete this._pressed[button];
	};

	Keyboard.prototype._mousemove = function(e) {
		this._mouseE = e;
		this._mouseAfter.set(e.clientX, e.clientY);
	};

	Keyboard.prototype._contextmenu = function(e) {
		e.preventDefault();
	};

	Keyboard.prototype._focus = function(e) {
		// Incase the user does something bad and a key gets stuck down
		this._pressed = {};
	};

	Keyboard.prototype.update = function() {
		this.searchKeys(this.bindings, 'u');

		// If the mouse has moved
		_vec.subVectors(this._mouseAfter, this._mouseBefore);
		if(_vec.x || _vec.y) {
			
			this.searchKeys(this.bindings, 'mm', {
				difference: _vec.clone(),
				e: this._mouseE
			});

			this._mouseBefore.copy(this._mouseAfter);
		}
	};


	Keyboard.prototype.initListeners = function() {
		window.addEventListener('keydown', engine.context(this._keydown, this), false);
		window.addEventListener('keyup', engine.context(this._keyup, this), false);
		window.addEventListener('mousedown', engine.context(this._mousedown, this), false);
		window.addEventListener('mouseup', engine.context(this._mouseup, this), false);
		window.addEventListener('mousemove', engine.context(this._mousemove, this), false);
		window.addEventListener('contextmenu', this._contextmenu, false);
		window.addEventListener('focus', engine.context(this._focus, this), false);
	};

	return Keyboard;
})();



//////////////////
// display.js

engine.Display = (function() {

	function Display() {
		this.renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		this.canvas = this.renderer.domElement;
		this.ctx = this.renderer.context;

		$(document.body).append(this.canvas);
		this.fullscreen();

		/////////////////////////////////////

		this.stats = new Stats();

		this.stats.domElement.style.position = 'absolute';
		this.stats.domElement.style.left = '0px';
		this.stats.domElement.style.top = '0px';

		$(document.body).append(this.stats.domElement);

		//////////////////////////////////////

		this.initListeners();
	};

	Display.prototype.render = function(scene, camera) {
		this.stats.update();
		this.renderer.render(scene, camera);
	};

	Display.prototype.fullscreen = function() {
		this.renderer.setSize(window.innerWidth, window.innerHeight - 5);
	};

	Display.prototype.initListeners = function() {
		window.addEventListener('resize', engine.context(this.fullscreen, this), false);
	};

	return Display;
})();



//////////////////
// camera.js

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



//////////////////
// grid.js

engine.grid = (function() {

	function NumberGrid(config) {
		this.x = config.x;
		this.y = config.y;
		
		this.datatype = config.datatype || window.Uint8Array;
		this.buffer = new ArrayBuffer(this.x * this.y * this.datatype.BYTES_PER_ELEMENT);
		this.view = new this.datatype(this.buffer);
	}

	NumberGrid.prototype.toIndex = function(vec) {
		return (vec.y * this.x) + vec.x;
	};

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

	BooleanGrid.prototype.union = function(other) {
		if(this.x !== other.x || this.y !== other.y) {
			console.error('Attempt to union grids with different dimensions');
			return false;
		}

		var newgrid = new BooleanGrid(this.config);
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
// visual_grid.js

engine.VisualGrid = (function() {
		
	

	function VisualGrid(grid) {
		var plane = new THREE.PlaneGeometry(grid.x, grid.y, 1, 1);

		plane.applyMatrix(new THREE.Matrix4().makeTranslation(grid.x / 2, grid.y / 2, 0));
		plane.computeCentroids();
		plane.computeBoundingBox();

		THREE.Mesh.call(this, plane, engine.shaders['selection_plane']);

		this.rotation.x = -Math.PI / 2;

		/////////////

		this.color = new THREE.Color(0x45E2ED);
		this.highlight = new THREE.ImageUtils.generateDataTexture(32, 32, this.color);
		this.material.uniforms.uColor.value = this.highlight;

		this.highlight.magFilter = THREE.NearestFilter;
		for(var i = 0; i < this.highlight.image.data.length; i++) {
			this.highlight.image.data[i] = Math.floor(Math.random() * 256);
		}

		//////////////

		this.startSquare = new THREE.Vector2();
		this.endSquare = new THREE.Vector2();

		this.bindings = {
			'^mm$': engine.context(function() {
				this.clear();

				// Update mouse highlight square
				var mouse = engine.raycastMouse()[0];
				if(engine.activePlayer.camera.active) return;
				if(mouse) {

					//this.highlightSingle(
					//	new THREE.Vector2(mouse.point.x, -mouse.point.z)
					//);
				}
			}, this),

			'^kd 32$': engine.context(function(e) {
				var t = engine.raycastMouse()[0].point;
				this.startSquare.set(t.x, -t.z);
				this.startSquare = this.snap(this.startSquare);

				this.endSquare.copy(this.startSquare);

				//console.log(this.startSquare, this.endSquare);
				var route = engine.pathfinding.dijkstra(grid, this.startSquare, this.endSquare);
				//var route = engine.pathfinding.direct(grid, this.startSquare, this.endSquare);
				//this.highlight(route);
			}, this),

			'^mm 32$': engine.context(function(e) {
				var t = engine.raycastMouse()[0].point;
				this.endSquare.set(t.x, -t.z);
				this.endSquare = this.snap(this.endSquare);
				this.clear();
				//console.log(this.startSquare, this.endSquare);
				var route = engine.pathfinding.dijkstra(grid, this.startSquare, this.endSquare);
				//var route = engine.pathfinding.direct(grid, this.startSquare, this.endSquare);
				//if(!route) return;
				
				//this.clear();
				//this.highlight(route);
			}, this)
		};
	}

	VisualGrid.prototype = Object.create(THREE.Mesh.prototype);
	VisualGrid.prototype.constructor = VisualGrid;

	VisualGrid.prototype.clear = function() {
		while(this.children.length) {
			this.remove(this.children[0]);
		}
	};

	VisualGrid.prototype.snap = function(vec) {
		return vec.set(
			Math.round(vec.x + 0.5) - 1,
			Math.round(vec.y + 0.5) - 1,
			0.001
		);
	};

	// VisualGrid.prototype.highlightSingle = function(vec, color) {
	// 	var highlight = new THREE.Mesh(
	// 		_highlightSquare,
	// 		engine.shaders['grid_highlight']
	// 	);

	// 	highlight.position.copy(vec);
	// 	this.snap(highlight.position);
	// 	highlight.position.x += 0.5;
	// 	highlight.position.y += 0.5;

	// 	this.add(highlight);

	// 	return highlight;
	// };

	// VisualGrid.prototype.highlight = function(vecs, color) {
	// 	for(var i = 0; i < vecs.length; i++) {
	// 		this.highlightSingle(vecs[i]);
	// 	}
	// };


	return VisualGrid;

})();



//////////////////
// terrain.js

engine.Terrain = (function() {

	function Terrain(grid) {
		this.grid = grid;
	}

	Terrain.prototype.generateTerrain = function() {

		// var shader = new THREE.ShaderMaterial({
		// 	vertexShader: $('#shaderVertex').text(),
		// 	fragmentShader: $('#shaderFragment').text(),
		// 	uniforms: {
		// 		'thickness': { type: 'f', value: 0.015 }
		// 	}
		// });

		// var plane = new THREE.Mesh(
		// 	new THREE.PlaneGeometry(this.grid.x, this.grid.y, 1, 1),
		// 	shader
		// );
		// plane.rotation.x = -Math.PI / 2;

		// console.log(this.grid);

		// plane.geometry.faceVertexUvs[0][0] = [
		// 	new THREE.Vector2(0, 0),
		// 	new THREE.Vector2(0, this.grid.y),
		// 	new THREE.Vector2(this.grid.x, this.grid.y),
		// 	new THREE.Vector2(this.grid.x, 0)
		// ];


		// return plane;
	};

	return Terrain;

})();



//////////////////
// castle.js

engine.Castle = (function() {

	function Castle(game) {
		// this.grid = new grid.BooleanGrid({
		// 	game.terrain.grid.x,
		// 	game.terrain.grid.y,
		// 	window.Uint32Array
		// });


	}

	Castle.prototype.generateMesh = function() {

	};

	return Castle;

})();



//////////////////
// game.js

engine.Game = (function() {

	function Game(terrain, players) {
		this.terrain = terrain;
		this.players = players;

		this.scene = new THREE.Scene();
		for(var i = 0; i < this.players.length; i++) {
			this.players[i].init(this);
			this.scene.add(this.players[i].publicScene);
		}

		this.scene.add(this.terrain.generateTerrain());
	}

	Game.prototype.update = function() {
		for(var i = 0; i < this.players.length; i++) {
			this.players[i].update();
		}
	};

	return Game;

})();



//////////////////
// player.js

engine.player = (function() {

	function Player() {
		this.units = new THREE.Object3D();
		this.structures = new THREE.Object3D();

		this.publicScene = new THREE.Object3D();
		this.publicScene.add(this.units);
		this.publicScene.add(this.structures);
	}

	Player.prototype.init = function(game) {
		// this.structureGrid = new engine.grid.NumberGrid({
		// 	x: game.terrain.grid.x,
		// 	y: game.terrain.grid.y,
		// 	datatype: window.Uint8Array
		// });
	};

	Player.prototype.update = function() {};

	/////////////////////////////////

	function Human() {
		Player.call(this);

		this.bindings = {};

		this.camera = new engine.Camera();
		$.extend(this.bindings, this.camera.bindings);

		this.privateScene = new THREE.Object3D();
		this.privateScene.add(this.camera.pivot);

		// this.bindings['^keyDown 32$'] = context(function() {
			
		// }, this);
	}

	Human.prototype = Object.create(Player.prototype);
	Human.prototype.constructor = Human;

	Human.prototype.init = function(game) {
		Player.prototype.init.call(this, game);

		this.visualGrid = new engine.VisualGrid(game.terrain.grid);
		$.extend(this.bindings, this.visualGrid.bindings);
		this.privateScene.add(this.visualGrid);
	};

	Human.prototype.update = function() {
		//this.visualGrid.update();
	};

	/////////////////////////////////

	function AI() {
		Player.call(this);

	}

	AI.prototype = Object.create(Player.prototype);
	AI.prototype.constructor = AI;

	/////////////////////////////////

	function Websocket() {
		Player.call(this);

	}

	Websocket.prototype = Object.create(Player.prototype);
	Websocket.prototype.constructor = Websocket;

	return {
		Player: Player,
		Human: Human,
		AI: AI,
		Websocket: Websocket
	};
})();



//////////////////
// main.js

engine.activeGame = null;
engine.activePlayer = null;
engine.core = {};

(function main(engine) {
	window.engine = engine; // Testing

	var keyboard = new engine.Keyboard();
	var display = new engine.Display();

	var sampleMap = new engine.grid.BooleanGrid({
		x: 32,
		y: 32
	});
	var terrain = new engine.Terrain(sampleMap);

	var player = new engine.player.Human();

	var game = new engine.Game(terrain, [player]);
	game.scene.add(player.privateScene);
	keyboard.addBindings(player.bindings);
	//player.camera.addHelpers(game.scene);


	engine.core.keyboard = keyboard;
	engine.core.display = display;
	engine.activeGame = game;
	engine.activePlayer = player;


	window.player = player;
	window.keyboard = keyboard;
	window.game = game;

	//var cube = engine.addPoint(new THREE.Vector3(), 0.1);
	//window.x = new THREE.DataTexture

	(function frame() {
		keyboard.update();
		game.scene.updateMatrixWorld();
		game.update();

		display.render(game.scene, player.camera.camera);
		
		window.requestAnimationFrame(frame);
	})();
})(engine);



//////////////////
// outro.js

})($, THREE);