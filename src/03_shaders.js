g.shaders = (function() {

	var	files = [
		'darkness.vert',
		'darkness.frag'];

	var shaders = {},
		$pathLabel = $('#pathLabel');

	function load(callback) {
		var file = files.shift(),
			t = new Date().getTime(); // force browser refresh
			
		$pathLabel.text('shaders/' + file);

		$.get('shaders/' + file + '?t=' + t, function(text) {
			shaders[file] = text;

			if(files.length) {
				load(callback);
			} else {
				g.materials.init(shaders);
				callback();
			}
		});
	}

	shaders.load = load;
	return shaders;
})();