g.fps = 60;
g.display = (function() {

	var renderer, stats,
		exports = {
			init: init,
			render: render,
			listen: listen,
			canvas3d: null,
			canvas2d: null,
			ctx3d: null,
			ctx2d: null,
			onRender: [],
		};

	function init() {
		renderer = new THREE.WebGLRenderer({
				clearColor: 0xF5F5DC,
				alpha: true,
				antialias: true
		});
	    
	    exports.canvas3d = renderer.domElement;
	    exports.ctx3d = renderer.context;

	    /////////////////////////////////////

		stats = new Stats();

		stats.domElement.style.position = 'absolute';
		stats.domElement.style.left = '0px';
		stats.domElement.style.top = '30px';

		/////////////////////////////////////

		exports.canvas2d = $('<canvas></canvas>');
		exports.canvas2d.css({
			'z-index': 10,
			'position': 'absolute',
			'top': 0,
			'left': 0
		});
		exports.canvas2d = exports.canvas2d[0]; // Don't store as JQuery object

		exports.ctx2d = exports.canvas2d.getContext('2d');


		$(document.body).append(exports.canvas3d);
		$(document.body).append(stats.domElement);
		$(document.body).append(exports.canvas2d);
	}

	function render(scene, camera) {
		stats.update();
		renderer.render(scene, camera);


		if(exports.onRender.length) {
			exports.canvas2d.width = window.innerWidth;
			// exports.ctx2d.clearRect(0, 0, window.innerWidth, window.innerHeight);
		}
		
		for(var i = 0; i < exports.onRender.length; i++) {
			exports.onRender[i](exports.ctx2d);
		}
	}

	function fullscreen() {
		renderer.setSize(window.innerWidth, window.innerHeight);

		exports.canvas2d.width = window.innerWidth;
		exports.canvas2d.height = window.innerHeight;
	}

	function listen() {
		window.addEventListener('resize', fullscreen, false);
		fullscreen();
	}
	
	return exports;
})();