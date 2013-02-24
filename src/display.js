engine.Display = (function() {

	function Display() {
		this.renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		this.canvas = this.renderer.domElement;
		this.ctx = this.renderer.context;

		$(document.body).append(this.canvas);
		this.fullscreen();

		/////////////////////////////////////

		this.stats = new Stats();

		this.stats.domElement.style.position = 'absolute';
		this.stats.domElement.style.left = '0px';
		this.stats.domElement.style.top = '0px';

		$(document.body).append(this.stats.domElement);

		//////////////////////////////////////

		this.initListeners();
	};

	Display.prototype.render = function(scene, camera) {
		this.stats.update();
		this.renderer.render(scene, camera);
	};

	Display.prototype.fullscreen = function() {
		this.renderer.setSize(window.innerWidth, window.innerHeight - 5);
	};

	Display.prototype.initListeners = function() {
		window.addEventListener('resize', context(this.fullscreen, this), false);
	};

	return Display;
})();