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