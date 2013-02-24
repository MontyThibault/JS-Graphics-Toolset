engine.Terrain = (function() {

	function Terrain(grid) {
		this.grid = grid;
	}

	Terrain.prototype.generateTerrain = function() {

		//var shader = new THREE.MeshNormalMaterial();

		var shader = new THREE.ShaderMaterial({
			vertexShader: $('#shaderVertex').text(),
			fragmentShader: $('#shaderFragment').text(),
			uniforms: {
				'thickness': { type: 'f', value: 0.025 }
			}
		});

		//mesh.geometry.faceVertexUvs

		console.log(this.grid.x);

		var plane = new THREE.Mesh(
			new THREE.PlaneGeometry(this.grid.x * 10, this.grid.y * 10, 1, 1),
			//new THREE.SphereGeometry(0.07, 100, 100),
			shader
			//new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true, wireframeLinewidth: 10 })
		);
		plane.rotation.x = -Math.PI / 2;

		console.log(this.grid);

		plane.geometry.faceVertexUvs[0][0] = [
			new THREE.Vector2(0, 0),
			new THREE.Vector2(0, this.grid.y),
			new THREE.Vector2(this.grid.x, this.grid.y),
			new THREE.Vector2(this.grid.x, 0)
		];


		return plane;
	};

	return Terrain;

})();