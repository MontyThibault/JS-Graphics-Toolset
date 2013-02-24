(function main(engine) {
	var keyboard = new engine.Keyboard();
	var display = new engine.Display();

	var sampleMap = new engine.grid.NumberGrid({
		x: 64,
		y: 64,
		datatype: window.Uint8Array
	});
	var terrain = new engine.Terrain(sampleMap);

	var player = new engine.player.Human();

	var game = new engine.Game(terrain, [player]);
	game.scene.add(player.privateScene);
	keyboard.addBindings(player.bindings);
	player.camera.addHelpers(game.scene);

	(function frame() {
		keyboard.update();
		game.update();
		display.render(game.scene, player.camera.camera);
	
		window.requestAnimationFrame(frame);
	})();
})(engine);