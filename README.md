## Build process
A python script merges all of the files from the `src/` folder into a single file at `build/max.js`. The script (`builder/build.py`) is automatically called every time I save a file in my editor. Compression is disabled for instantaneous results and debugging.

---------------------------------------------

# Module Index
### Keyboard.js
Handles keypress events and excecutes callbacks

### Renderer.js
Controls the THREE.js renderer and canvas element

### Camera.js


### Infrastructure


engine --> player --> game
engine --> game --> player


#### Engine
The engine provides components, such keypress management, a gameloop, and a rendering pipeline, to the application as a whole.

Engine
	game
	players

	render
	
#### Game
The game object is ISOLATED from player interaction. It is a single object that can be shared between all the players in the game. Only publci It provides an interface that the players interact with to make changes to the environment.

Game
	public scenegraph
		terrain

		player 1
		player 2
		player 3

	update

#### Player
The player objects store the unique information of each player. Events can happen either through browser interaction for real players, or automated commands for artificial intelligence.

Player
	private scenegraph
		camera
		interface

	update(game)