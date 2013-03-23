engine.activeGame = null;
engine.activePlayer = null;
engine.core = {};

(function main(engine) {
	window.engine = engine; // Testing

	var keyboard = new engine.Keyboard();
	var display = new engine.Display();

	var sampleMap = new engine.grid.BooleanGrid({
		x: 32,
		y: 32
	});
	var terrain = new engine.Terrain(sampleMap);

	var player = new engine.player.Human();

	var game = new engine.Game(terrain, [player]);
	game.scene.add(player.privateScene);
	keyboard.addBindings(player.bindings);
	//player.camera.addHelpers(game.scene);


	engine.core.keyboard = keyboard;
	engine.core.display = display;
	engine.activeGame = game;
	engine.activePlayer = player;


	window.player = player;
	window.keyboard = keyboard;
	window.game = game;

	//var cube = engine.addPoint(new THREE.Vector3(), 0.1);
	//window.x = new THREE.DataTexture

	(function frame() {
		keyboard.update();
		game.scene.updateMatrixWorld();
		game.update();

		display.render(game.scene, player.camera.camera);
		
		window.requestAnimationFrame(frame);
	})();
})(engine);