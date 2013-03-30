engine.VisualGrid = (function() {
		
	var _highlightSquare = new THREE.PlaneGeometry(1, 1, 1, 1);

	var _height = 0;

	function VisualGrid(grid) {
		var plane = new THREE.PlaneGeometry(grid.x, grid.y, 1, 1);

		// Make the plane start at 0, 0 instead of being centered
		// And increment the height so it doesn't interfere with other grids
		var translate = new THREE.Matrix4();
		translate.makeTranslation(grid.x / 2, grid.y / 2, _height += 0.001);
		plane.applyMatrix(translate);	

		plane.computeCentroids();
		plane.computeBoundingBox();

		var shader = new THREE.ShaderMaterial(engine.shaders.selection_plane);

		THREE.Mesh.call(this, plane, shader);

		this.rotation.x = -Math.PI / 2;

		/////////////

		this.colorData = new engine.grid.ColorGrid({
			box: new THREE.Box2(
				new THREE.Vector2(0, 0), 
				new THREE.Vector2(128, 128))
		});

		this.clear();

		this.texture = new THREE.DataTexture(this.colorData.view, 128, 128, 
			THREE.RGBFormat);
		this.texture.magFilter = THREE.NearestFilter;
		this.texture.minFilter = THREE.NearestFilter;
		this.texture.generateMipmaps = false;

		this.material.uniforms.uColor = {
			type: 't',
			value: this.texture
		};

		this.texture.needsUpdate = true;

		/////////////

		this.startSquare = new THREE.Vector2();
		this.endSquare = new THREE.Vector2();

		this.bindings = {
			'^mm$': engine.context(function() {
				// this.clear();

				// // Update mouse highlight square
				// var mouse = engine.raycastMouse()[0];
				// if(engine.activePlayer.camera.active) return;
				// if(mouse) {
				// 	this.highlightSingle(
				// 		new THREE.Vector2(mouse.point.x, -mouse.point.z)
				// 	);
				// }
			}, this),

			'^kd 32$': engine.context(function(e) {
				var t = engine.raycastMouse()[0].point;
				this.startSquare.set(t.x, -t.z);
				this.startSquare = this.snap(this.startSquare);

				this.endSquare.copy(this.startSquare);

				//console.log(this.startSquare, this.endSquare);
				//var route = engine.pathfinding.dijkstra(grid, this.startSquare, this.endSquare);
				var route = engine.pathfinding.direct(grid, this.startSquare, this.endSquare);
				this.highlightGroup(route);
			}, this),

			'^mm 32$': engine.context(function(e) {
				var t = engine.raycastMouse()[0].point;
				this.endSquare.set(t.x, -t.z);
				this.endSquare = this.snap(this.endSquare);
				this.clear();
				//console.log(this.startSquare, this.endSquare);
				//var route = engine.pathfinding.dijkstra(grid, this.startSquare, this.endSquare);
				var route = engine.pathfinding.direct(grid, this.startSquare, this.endSquare);
				//if(!route) return;
				
				//this.clear();
				this.highlightGroup(route);
			}, this)
		};
	}

	VisualGrid.prototype = Object.create(THREE.Mesh.prototype);
	VisualGrid.prototype.constructor = VisualGrid;

	VisualGrid.prototype.clear = function() {
		while(this.children.length) {
			this.remove(this.children[0]);
		}

		for(var i = 0; i < this.colorData.view.length; i += 3) {
			this.colorData.view[i] = 45;
			this.colorData.view[i + 1] = 45;
			this.colorData.view[i + 2] = 45;
		}

		var index = this.colorData.toIndex(63, 63);
		this.colorData.view[index] = 127;
		this.colorData.view[index + 1] = 142;
		this.colorData.view[index + 2] = 207;

		//console.log(this.texture);
		//window.x = this.texture;
		this.texture && (this.texture.needsUpdate = true);
	};

	VisualGrid.prototype.snap = function(vec) {
		return vec.set(
			Math.round(vec.x + 0.5) - 1,
			Math.round(vec.y + 0.5) - 1,
			0.001
		);
	};

	VisualGrid.prototype.update = function() {};

	VisualGrid.prototype.highlightSingle = function(vec, color) {
		var highlight = new THREE.Mesh(
			_highlightSquare,
			engine.shaders['grid_highlight']
		);

		highlight.position.copy(vec);
		this.snap(highlight.position);
		highlight.position.x += 0.5;
		highlight.position.y += 0.5;

		this.add(highlight);

		return highlight;
	};

	VisualGrid.prototype.highlightGroup = function(vecs, color) {
		for(var i = 0; i < vecs.length; i++) {
			this.highlightSingle(vecs[i]);
		}
	};


	return VisualGrid;

})();