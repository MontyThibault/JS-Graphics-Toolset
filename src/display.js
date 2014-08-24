engine.fps = 60;
engine.display = (function() {

	var canvas, ctx, renderer, stats,
		exports = {
			init: init,
			render: render,
			listen: listen,
			canvas: null,
			ctx: null
		};

	function init() {
		renderer = new THREE.WebGLRenderer({
				clearColor: 0xF5F5DC,
				alpha: true,
				antialias: true
		});
	    
	    exports.canvas = renderer.domElement;
	    exports.ctx = renderer.context;

		$(document.body).append(exports.canvas);

	    /////////////////////////////////////

		stats = new Stats();

		stats.domElement.style.position = 'absolute';
		stats.domElement.style.left = '0px';
		stats.domElement.style.top = '0px';

		$(document.body).append(stats.domElement);

	}

	function render(scene, camera) {
		stats.update();
		renderer.render(scene, camera);
	}

	function fullscreen() {
		renderer.setSize(window.innerWidth, window.innerHeight - 5);
	}

	function listen() {
		window.addEventListener('resize', fullscreen, false);
		fullscreen();
	}
	
	return exports;
})();