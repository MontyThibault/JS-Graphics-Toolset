(function main(engine) {

	window.engine = engine;

	engine.display.init();
	engine.camera.init();

	engine.userInput.listen();
	engine.display.listen();
	engine.camera.listen();

	engine.shaders.load(function() {
		$('#loader').fadeOut();
	});

	var scene = new THREE.Scene();

	(function frame() {
		engine.camera.update();
		engine.display.render(scene, engine.camera.cam);



		if(engine.fps === 60) {
            window.requestAnimationFrame(frame);
		} else {
            window.setTimeout(frame, 1000 / engine.fps);
		}
	})();
})(engine);