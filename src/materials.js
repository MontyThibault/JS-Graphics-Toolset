// Must be called after shaders have loaded
engine.materials = {};
engine.initMaterials = function() {

	engine.materials.terrain = function(config) {

		var uniforms = THREE.UniformsUtils.merge([
			THREE.UniformsLib.common,
			THREE.UniformsLib.lights
		]);

		uniforms.map.value = config.map;

		var mat = new THREE.ShaderMaterial({
			lights: true,
			vertexShader: engine.shaders['blackWhite.vert'],
			fragmentShader: engine.shaders['blackWhite.frag'],
			uniforms: uniforms
		});

		mat.map = config.map;

		return mat;
	}
};