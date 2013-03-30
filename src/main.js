engine.activeGame = null;
engine.activePlayer = null;
engine.core = {};

(function main(engine) {
	window.engine = engine; // Testing

	var keyboard = new engine.Keyboard();
	var display = new engine.Display();

	var sampleMap = new engine.grid.BooleanGrid({
		x: 128,
		y: 128
	});
	var terrain = new engine.Terrain(sampleMap);

	var player = new engine.player.Human();

	var game = new engine.Game(terrain, [player]);
	game.scene.add(player.privateScene);
	keyboard.addBindings(player.bindings);

	engine.core.keyboard = keyboard;
	engine.core.display = display;
	engine.activeGame = game;
	engine.activePlayer = player;


	window.player = player;
	window.keyboard = keyboard;
	window.game = game;


	function newColors() {
		var v = player.visualGrid.colorData.view;

		var square = Math.floor(Math.random() * 128 * 128 * 3);
		v[square] = Math.random() * 255;
		v[square + 1] = Math.random() * 255;
		v[square + 2] = Math.random() * 255;

		player.visualGrid.texture.needsUpdate = true;
	}

	//var cube = engine.addPoint(new THREE.Vector3(), 0.1);
	//window.x = new THREE.DataTexture

	var start = new Date().getTime(),
		testTime = 2000;

	(function frame() {
		keyboard.update();
		game.scene.updateMatrixWorld();
		game.update();

		newColors();

		display.render(game.scene, player.camera.camera);
	

		// if(new Date().getTime() - start < testTime) {
		// 	frame();
		// }
		window.requestAnimationFrame(frame);
	})();
})(engine);