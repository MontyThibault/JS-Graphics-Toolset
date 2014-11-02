(function main(engine) {

	window.engine = engine;

	engine.display.init();
	engine.topdownCamera.init();

	engine.userInput.listen();
	engine.display.listen();
	engine.topdownCamera.listen();

	var sampleMap;

	engine.shaders.load(function() {

		sampleMap = new engine.Map({
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
	scene.add(engine.topdownCamera.obj);
	scene.add(engine.player);

	window.scene = scene;
	var loaded = false;
	(function frame() {
		window.frame = frame;

		if(loaded) {

			// TODO refactor this into material's own update function? OR incorportate hierarchichcal world update function <----

			sampleMap.material.uniforms.uPlayerPosition.value.copy(engine.player.position);

			console.clear();
			sampleMap.material.uniforms.uVOEdges.value = sampleMap.generateVOEdges(engine.player.position, 10);

			console.log(sampleMap.viewOccluder.edgePairs);
		}
		engine.topdownCamera.update();
		engine.display.render(scene, engine.topdownCamera.cam);

		//if(loaded) return;

		if(engine.fps === 60) {
            window.requestAnimationFrame(frame);
		} else if(engine.fps === 0) {
			window.setZeroTimeout(frame); // MAXIMUM PERFORMANCE
		} else {
            window.setTimeout(frame, 1000 / engine.fps);
		}
	})();
})(engine);