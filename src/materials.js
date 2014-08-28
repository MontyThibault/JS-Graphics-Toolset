// Must be called after shaders have loaded
engine.materials = {};
engine.initMaterials = function() {

	engine.materials.darkness = function(config) {

		var vo = engine.map.viewOcclusion;

		var uniforms = THREE.UniformsUtils.merge([
			THREE.UniformsLib.common,
			THREE.UniformsLib.lights,
			{
				'uPlayerPosition': {
					type: 'v3',
					value: engine.player.position
				},

				'uVOVerts': {
					type: 'v3v',
					value: vo.vertices
				},

				'uVOEdges': {
					type: 'iv1',
					value: vo.edgePairs
				}
			}
		]);

		uniforms.map.value = config.map;


		var vertexShader = engine.shaders['darkness.vert'],
			fragmentShader = engine.shaders['darkness.frag'];

		// TODO find replaceALL
		fragmentShader = fragmentShader
			.replace('<uVOVertsLength>', vo.vertices.length)
			.replace('<uVOEdgesLength>', vo.edgePairs.length)
			.replace('<uVOEdgesLength>', vo.edgePairs.length)
			.replace('<uVOEdgesLength>', vo.edgePairs.length);

		var mat = new THREE.ShaderMaterial({
			lights: true,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			uniforms: uniforms
		});

		mat.map = config.map;

		return mat;
	}
};