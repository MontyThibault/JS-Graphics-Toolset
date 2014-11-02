g.pathfinding = (function() {

	var valid = function(node, grid) {
		// Do not return nodes that are outside the grid
		if(node.x < 0 || 
			node.x >= grid.x ||
			node.y < 0 ||
			node.y >= grid.y) {
			return false;
		}

		// Do not return nodes that are on obstacles
		if(grid.get(node.x, node.y)) return false;

		return true;
	};

	var adjacent = function(source, grid) {
		var nodes = [], t,
			xOffset, yOffset;

		for(xOffset = -1; xOffset <= 1; xOffset++) {
			for(yOffset = -1; yOffset <= 1; yOffset++) {

				// Do not return the source square
				if(xOffset === 0 && yOffset === 0) continue;

				t = new THREE.Vector2(source.x + xOffset, source.y + yOffset);
				if(valid(t, grid)) {
					t.parent = source;
					nodes.push(t);
				}
			}
		}

		return nodes;
	};
	window.a = adjacent;

	// Basically A* minus the heuristic, and a cool name of course.
	// http://en.wikipedia.org/wiki/Dijkstra's_algorithm
	function dijkstra(grid, start, end) {

		if(!valid(start, grid) || !valid(end, grid)) return false;

		start.set(Math.round(start.x), Math.round(start.y));
		end.set(Math.round(end.x), Math.round(end.y));

		var open = [],
			closed = [start],
			latest = start;

		var counter = 0;

		while(true) {

			// If we reached the destination
			if(latest.equals(end)) {
				break;
			}

			var children = adjacent(latest, grid);
			var i, j, a, b, occupied;

			// Add the new nodes to the open list if they're not in it already
			for(i = 0; i < children.length; i++) {
				a = children[i];
				occupied = false;

				for(j = 0; j < open.length; j++) {
					b = open[j];
					if(a.equals(b)) {
						occupied = true;
						break;
					}
				}
				for(j = 0; j < closed.length; j++) {
					b = closed[j];
					if(a.equals(b)) {
						occupied = true;
						break;
					}
				}

				if(!occupied) {
					open.push(children[i]);
				}
			}

			// If we already checked the whole grid
			if(!open.length) {
				return false;
			}

			open.sort(function(a, b) {
				//return Math.random() < 0.5;
				return a.distanceToSquared(end) < b.distanceToSquared(end);
			});

			if(++counter >= 1) {
				g.activePlayer.visualGrid.highlight(open);
				break;
			}

			latest = open.shift();
			closed.push(latest);
		}

		// Retrace a path
		var path = [latest];

		while(path[path.length - 1].parent) {
			path.push(path[path.length - 1].parent);
		}

		return path;
	}

	function astar() {

	}

	// World's lamest implementation of Bresenham's line algorithm
	// http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
	function direct(grid, start, end) {

		if(!valid(start, grid) || !valid(end, grid)) return false;

		var delta = end.clone().sub(start),
			slope = delta.y / delta.x;

		var path = [];

		if(Math.abs(delta.x) > Math.abs(delta.y)) {
			for(var x = 0; x != delta.x; x += (delta.x > 0) ? 1 : -1) {
				path.push(new THREE.Vector2(x, Math.round(x * slope)).add(start));
			}
		} else {
			for(var y = 0; y != delta.y; y += (delta.y > 0) ? 1 : -1) {
				path.push(new THREE.Vector2(Math.round(y / slope), y).add(start));
				
			}
		}
		
		path.push(end);

		return path;
	}

	function projectile() {

	}

	return {
		dijkstra: dijkstra,
		astar: astar,
		direct: direct,
		projectile: projectile
	};
})();