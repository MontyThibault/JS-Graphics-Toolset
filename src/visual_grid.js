engine.VisualGrid = (function() {
		
	var _highlightSquare = new THREE.PlaneGeometry(1, 1, 1, 1);

	function VisualGrid(grid) {
		var plane = new THREE.PlaneGeometry(grid.x, grid.y, 1, 1);

		plane.applyMatrix(new THREE.Matrix4().makeTranslation(grid.x / 2, grid.y / 2, 0));
		plane.computeCentroids();
		plane.computeBoundingBox();

		THREE.Mesh.call(this, plane, engine.shaders['selection_plane']);

		this.rotation.x = -Math.PI / 2;

		/////////////

		// this.defaultColor = new THREE.Color(0x45E2ED);
		// this.highlight = new THREE.ImageUtils.generateDataTexture(32, 32, this.defaultColor);
		// this.material.uniforms.uColor.value = this.highlight;

		// this.highlight.magFilter = THREE.NearestFilter;
		// for(var i = 0; i < this.highlight.image.data.length; i++) {
		// 	this.highlight.image.data[i] = Math.floor(Math.random() * 256);
		// }

		//////////////

		this.colorData = new engine.grid.ColorGrid({
			box: new THREE.Box2(
				new THREE.Vector2(0, 0), 
				new THREE.Vector2(32, 32))
		});

		this.clear();

		this.texture = new THREE.DataTexture(this.colorData.view, 32, 32, THREE.RGBFormat);
		this.material.uniforms.uColor.value = this.texture;

		this.texture.needsUpdate = true;

		/////////////

		this.startSquare = new THREE.Vector2();
		this.endSquare = new THREE.Vector2();

		this.bindings = {
			'^mm$': engine.context(function() {
				this.clear();

				// Update mouse highlight square
				var mouse = engine.raycastMouse()[0];
				if(engine.activePlayer.camera.active) return;
				if(mouse) {
					this.highlightSingle(
						new THREE.Vector2(mouse.point.x, -mouse.point.z)
					);
				}
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
			this.colorData.view[i] = 23;
			this.colorData.view[i + 1] = 100;
			this.colorData.view[i + 2] = 75;
		}

		var index = this.colorData.toIndex(0, 0);
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