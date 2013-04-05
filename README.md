## Build process
A python script merges all of the files from the `src/` folder into a single file at `build/max.js`. The script (`builder/build.py`) is automatically called every time I save a file in my editor. Compression is disabled for instantaneous results and debugging.


[Link to Page](http://montythibault.github.com/JSGame/)

---------------------------------------------
#Todo

- Implement something to connect boxes with grids
- New update system (including keyboard refactoring)

---------------------------------------------

#Module Index
### Main.js
MAIN! Where all the action happens

### Camera.js
Controls camera movement

### Castle.js
Todo - will be used in the future for creating bases

### Display.js
Initializes the renderer and makes sure everything is fullscreen

### Game.js
A hub for connecting players, terrain, and gamestate

### Grid.js
Holds types for dealing with grids, octrees, et cetera

### Intro.js
Opening of the function wrapper

### Outro.js 
Ending of the function wrapper

### Keyboard.js
Handles keyboard and mouse interaction

### Pathfinding.js
Implementations of pathfinding algorithms

### Players.js
All of the different player types (human, AI, websocket...)

### Shaders.js
Custom shaders

### Terrain.js 
A bit lame right now, but this will be used for generating game terrain in the future

### Utils.js
Small THREE.js snippets to make my life easier

### Visual_grid.js
Grid overlay for data visualization