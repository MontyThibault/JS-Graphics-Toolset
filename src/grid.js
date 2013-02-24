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
		this.x = config.x;
		this.y = config.y;

		this.datatype = config.datatype || window.Uint32Array;
		this.buffer = new ArrayBuffer(this.x * this.y / 8);
		this.view = new this.datatype(this.buffer);
	}

	BooleanGrid.prototype.set = function(vec, value) {
		var index = (vec.y * this.x) + vec.x;

		var cellIndex = Math.floor(index / 8),
			bitIndex = index % 8;


		if(value) {
			this.view[cellIndex] |= (1 << bitIndex);
		} else {
			this.view[cellIndex] &= ~(1 << bitIndex);
		}
	};

	BooleanGrid.prototype.get = function(vec) {
		var index = (vec.y * this.x) + vec.x;

		var cellIndex = Math.floor(index / 8),
			bitIndex = index % 8;

		return !!(this.view[cellIndex] & (1 << bitIndex));
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