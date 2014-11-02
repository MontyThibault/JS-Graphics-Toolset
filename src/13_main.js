(function main(g) {

	window.g = g;

	g.display.init();
	g.topdownCamera.init();

	g.userInput.listen();
	g.display.listen();
	g.topdownCamera.listen();

	var scene = new THREE.Scene();
	scene.add(g.topdownCamera.obj);
	scene.add(g.player);

	var sampleWorld,
		loaded = false;

	g.shaders.load(function() {

		sampleWorld = new g.World({
			geometryPath: 'assets/sampleWorld/world.js',
			texturePath: 'assets/sampleWorld/Colormap.png'
		});

		sampleWorld.load(function(mesh) {

			$('#loader').fadeOut();

			scene.add(mesh);

			loaded = true;
		});
	});

	(function frame() {
		window.frame = frame;

		if(loaded) {
			sampleWorld.update();
		}
		g.topdownCamera.update();
		g.display.render(scene, g.topdownCamera.cam);


		if(g.fps === 60) {
            window.requestAnimationFrame(frame);
		} else if(g.fps === 0) {
			window.setZeroTimeout(frame); // MAXIMUM PERFORMANCE
		} else {
            window.setTimeout(frame, 1000 / g.fps);
		}
	})();
})(g);