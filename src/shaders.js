engine.shaders = (function() {

	var shaders = {},
		files = [
		'blackWhite.vert',
		'blackWhite.frag'],
		$path = $('#path');

	function load(callback) {
		var file = files.shift();
		$path.text('shaders/' + file);

		$.get('shaders/' + file, function(text) {
			shaders[file] = text;

			if(files.length) {
				load(callback);
			} else {
				engine.initMaterials();
				callback();
			}
		});
	}

	shaders.load = load;
	return shaders;
})();