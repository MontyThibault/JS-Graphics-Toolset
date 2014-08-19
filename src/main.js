(function main(engine) {
	window.engine = engine; // Testing
	
	engine.userInput.listen();
	engine.display.listen();
	engine.camera.listen();

	engine.shaders.load(function() {
		engine.loader.fadeOut();
	});


	var sampleMap = new engine.grid.BooleanGrid({
		x: 128,
		y: 128
	});
	
	var scene = new THREE.Scene();

    var grid = new engine.overlays.Color(new THREE.Box2(new THREE.Vector2(), new THREE.Vector2(128, 128)));

	function newColors() {
		var v = grid.colorData.view;

		var square = Math.floor(Math.random() * 128 * 128 * 3);
		v[square] = Math.random() * 255;
		v[square + 1] = Math.random() * 255;
		v[square + 2] = Math.random() * 255;

		grid.texture.needsUpdate = true;
	}

	(function frame() {
		engine.camera.update();
		newColors();
		engine.display.render(scene, engine.camera.cam);

		if(engine.fps === 60) {
            window.requestAnimationFrame(frame);
		} else {
            window.setTimeout(frame, 1000 / engine.fps);
		}
	})();
})(engine);