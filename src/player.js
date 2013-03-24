engine.player = (function() {

	function Player() {
		this.units = new THREE.Object3D();
		this.structures = new THREE.Object3D();

		this.publicScene = new THREE.Object3D();
		this.publicScene.add(this.units);
		this.publicScene.add(this.structures);
	}

	Player.prototype.init = function(game) {
		// this.structureGrid = new engine.grid.NumberGrid({
		// 	x: game.terrain.grid.x,
		// 	y: game.terrain.grid.y,
		// 	datatype: window.Uint8Array
		// });
	};

	Player.prototype.update = function() {};

	/////////////////////////////////

	function Human() {
		Player.call(this);

		this.bindings = {};

		this.camera = new engine.Camera();
		$.extend(this.bindings, this.camera.bindings);

		this.privateScene = new THREE.Object3D();
		this.privateScene.add(this.camera.pivot);

		// this.bindings['^keyDown 32$'] = context(function() {
			
		// }, this);
	}

	Human.prototype = Object.create(Player.prototype);
	Human.prototype.constructor = Human;

	Human.prototype.init = function(game) {
		Player.prototype.init.call(this, game);

		this.visualGrid = new engine.VisualGrid(game.terrain.grid);
		$.extend(this.bindings, this.visualGrid.bindings);
		this.privateScene.add(this.visualGrid);
	};

	Human.prototype.update = function() {
		this.visualGrid.update();
	};

	/////////////////////////////////

	function AI() {
		Player.call(this);

	}

	AI.prototype = Object.create(Player.prototype);
	AI.prototype.constructor = AI;

	/////////////////////////////////

	function Websocket() {
		Player.call(this);

	}

	Websocket.prototype = Object.create(Player.prototype);
	Websocket.prototype.constructor = Websocket;

	return {
		Player: Player,
		Human: Human,
		AI: AI,
		Websocket: Websocket
	};
})();