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

	var sampleMap,
		loaded = false;

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

	(function frame() {
		window.frame = frame;

		if(loaded) {
			sampleMap.update();
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