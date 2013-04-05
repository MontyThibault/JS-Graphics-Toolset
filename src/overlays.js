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
			vertexShader: s.vStandard,
			fragmentShader: s.fOverlayConstant,
			uniforms: {
				uThickness: { type: 'f', value: 0.015 },
				uColor: { type: 'c', value: color }
			}
		});
	}

	Constant.prototype = Object.create(Overlay.prototype);
	Constant.prototype.constructor = Constant;


	function Alpha(box) {
		Overlay.call(this, box);
	}

	Alpha.prototype = Object.create(Overlay.prototype);
	Alpha.prototype.constructor = Alpha;


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
			vertexShader: s.vStandard,
			fragmentShader: s.fOverlayColor,
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
		Alpha: Alpha,
		Color: Color
	};
})();