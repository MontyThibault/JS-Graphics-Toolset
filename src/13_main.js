(function main(g) {

	window.g = g;

	g.display.init();
	g.topdownCamera.init();

	g.userInput.listen();
	g.display.listen();
	g.topdownCamera.listen();

	var sampleMap;

	g.shaders.load(function() {

		sampleMap = new g.Map({
			geometryPath: 'assets/samplemap/map.js',
			texturePath: 'assets/samplemap/Colormap.png'
		});

		sampleMap.load(function(mesh) {

			$('#loader').fadeOut();

			scene.add(mesh);

			loaded = true;
		});
	});

	var scene = new THREE.Scene();
	scene.add(g.topdownCamera.obj);
	scene.add(g.player);

	window.scene = scene;
	var loaded = false;
	(function frame() {
		window.frame = frame;

		if(loaded) {

			// TODO refactor this into material's own update function? OR incorportate hierarchichcal world update function <----

			sampleMap.material.uniforms.uPlayerPosition.value.copy(g.player.position);

			console.clear();
			sampleMap.material.uniforms.uVOEdges.value = sampleMap.generateVOEdges(g.player.position, 10);

			console.log(sampleMap.viewOccluder.edgePairs);
		}
		g.topdownCamera.update();
		g.display.render(scene, g.topdownCamera.cam);

		//if(loaded) return;

		if(g.fps === 60) {
            window.requestAnimationFrame(frame);
		} else if(g.fps === 0) {
			window.setZeroTimeout(frame); // MAXIMUM PERFORMANCE
		} else {
            window.setTimeout(frame, 1000 / g.fps);
		}
	})();
})(g);