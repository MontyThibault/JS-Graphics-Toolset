engine.shaders = {
	'selection_plane': new THREE.ShaderMaterial({
		vertexShader: $('#selection_plane_vertex').text(),
		fragmentShader: $('#selection_plane_fragment').text(),
		uniforms: {
			'uThickness': { type: 'f', value: 0.015 },
			'uColor': { type: "t", value: null }
		}
	}),
	'grid_highlight': new THREE.ShaderMaterial({
		vertexShader: $('#grid_highlight_vertex').text(),
		fragmentShader: $('#grid_highlight_fragment').text()
	})
};