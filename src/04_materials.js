g.materials = {

	// Must be called after shaders have loaded
	init: function(shaders) {

		this.darkness = function(texture, map) {

			var vo = map.viewOccluder;

			var uniforms = THREE.UniformsUtils.merge([
				THREE.UniformsLib.common,
				THREE.UniformsLib.lights,
				{
					'uPlayerPosition': {
						type: 'v3',
						value: g.player.position
					},

					'uVOVerts': {
						type: 'v3v',
						value: vo.vertices
					},

					'uVOEdges': {
						type: 'iv1',
						value: [] // map.generateVOEdges
					},

					'uVOTexture': {
						type: 't',
						value: 1,
						texture: vo.dataTexture
					}
				}
			]);

			uniforms.map.value = texture;

			var defines = {
				'uVOVertsLength': vo.vertices.length,
				'uVOEdgesLength': vo.edgePairs.length
			};

			var vertexShader = g.shaders['darkness.vert'],
				fragmentShader = g.shaders['darkness.frag'];

			var mat = new THREE.ShaderMaterial({
				lights: true,
				vertexShader: vertexShader,
				fragmentShader: fragmentShader,
				uniforms: uniforms,
				defines: defines
			});

			mat.map = texture;

			return mat;
		};
	}
};