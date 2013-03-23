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