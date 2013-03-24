## Build process
A python script merges all of the files from the `src/` folder into a single file at `build/max.js`. The script (`builder/build.py`) is automatically called every time I save a file in my editor. Compression is disabled for instantaneous results and debugging.

---------------------------------------------

# Module Index
### Keyboard.js
Handles browser events and executes callbacks

### Display.js
Handles THREE.js renderer and canvas DOM element

### Camera.js
Handles controls for using the camera

### Game.js



### Infrastructure

engine
	types
	active
	core

game
	player
		

### visual_grid.js
Links between game data and user interface

Goals:
	- MODULAR! (whatever that means)
		- layers

	- dynamic content
	- user interactivity

cursor --> terrain --> building occupancy --> highlights