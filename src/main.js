(function main(engine) {

	window.engine = engine;

	engine.display.init();
	engine.topdownCamera.init();

	engine.userInput.listen();
	engine.display.listen();
	engine.topdownCamera.listen();

	engine.shaders.load(function() {
		engine.map.load(function(mesh) {

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
			engine.map.material.uniforms.uPlayerPosition.value.copy(engine.player.position);

			console.clear();
			engine.map.viewOcclusion.edgePairs = engine.map.sortEdges(engine.player.position, engine.map.viewOcclusion, false);
			engine.map.material.uniforms.uVOEdges.value = engine.map.viewOcclusion.edgePairs;
			
			console.log(engine.map.viewOcclusion.edgePairs);
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