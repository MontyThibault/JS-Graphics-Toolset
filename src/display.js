engine.fps = 60;
engine.display = (function() {

	var renderer = new THREE.WebGLRenderer({
			clearColor: 0xF5F5DC,
			clearAlpha: 1,
			antialias: true
	});
    
    var canvas = renderer.domElement,
        ctx = renderer.context;

	$(document.body).append(canvas);

    /////////////////////////////////////

	var stats = new Stats();

	stats.domElement.style.position = 'absolute';
	stats.domElement.style.left = '0px';
	stats.domElement.style.top = '0px';

	$(document.body).append(stats.domElement);

	//////////////////////////////////////


	function render(scene, camera) {
		stats.update();
		renderer.render(scene, camera);
	}

	function fullscreen() {
		renderer.setSize(window.innerWidth, window.innerHeight - 5);
	}
	fullscreen();

	function listen() {
		window.addEventListener('resize', fullscreen, false);
	}
	
	return {
        render: render,
        canvas: canvas,
        listen: listen,
        ctx: ctx
	};
})();