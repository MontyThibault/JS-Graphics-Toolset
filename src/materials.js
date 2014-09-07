// Must be called after shaders have loaded
engine.materials = {
	init: function() {

		this.darkness = function(texture, map) {

		var vo = map.viewOccluder;

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
				},

				'uVOTexture': {
					type: 't',
					value: 1,
					texture: vo.dataTexture
				}
			}
		]);

		uniforms.map.value = config.map;

		var defines = {
			'uVOVertsLength': vo.vertices.length,
			'uVOEdgesLength': vo.edgePairs.length
		};

		var vertexShader = engine.shaders['darkness.vert'],
			fragmentShader = engine.shaders['darkness.frag'];

		var mat = new THREE.ShaderMaterial({
			lights: true,
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			uniforms: uniforms,
			defines: defines
		});

		mat.map = config.map;

		return mat;
	}
};