## Build process
A python script merges all of the files from the `src/` folder into a single file at `build/max.js`. The script (`builder/build.py`) is automatically called every time I save a file in my editor. Compression is disabled for instantaneous results and debugging.


[Link to Page](http://montythibault.github.com/JSGame/)


## Code Organization

The javascript engine for this project is outlined as follows:

A local `engine` object can be accessed within all code inside of the main wrapper. Inside of this lies all of the utilities and functions necessary for the program to work properly. `main` is called once everything has been defined; within it, the environment is initialized and the `frame` loop carries the program on, running at 60fps.` 