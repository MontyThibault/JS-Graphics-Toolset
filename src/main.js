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
		});
	});

	var scene = new THREE.Scene();
	scene.add(engine.topdownCamera.obj);
	scene.add(engine.player);

	window.scene = scene;


	(function frame() {
		engine.topdownCamera.update();
		engine.display.render(scene, engine.topdownCamera.cam);

		if(engine.fps === 60) {
            window.requestAnimationFrame(frame);
		} else if(engine.fps === 0) {
			window.setZeroTimeout(frame); // MAXIMUM PERFORMANCE
		} else {
            window.setTimeout(frame, 1000 / engine.fps);
		}
	})();
})(engine);