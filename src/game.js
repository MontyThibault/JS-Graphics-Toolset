engine.Game = (function() {

	function Game(terrain, players) {
		this.terrain = terrain;
		this.players = players;

		this.scene = new THREE.Scene();
		for(var i = 0; i < this.players.length; i++) {
			this.players[i].init(this);
			this.scene.add(this.players[i].publicScene);
		}

		this.scene.add(this.terrain.generateTerrain());
	}

	Game.prototype.update = function() {
		for(var i = 0; i < this.players.length; i++) {
			this.players[i].update();
		}
	};

	return Game;

})();