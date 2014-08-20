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