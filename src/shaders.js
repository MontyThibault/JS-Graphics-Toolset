engine.shaders = (function() {

	var shaders = {},
		files = [
		'darkness.vert',
		'darkness.frag'],
		$path = $('#path');

	function load(callback) {
		var file = files.shift(),
			t = new Date().getTime();
			
		$path.text('shaders/' + file);

		$.get('shaders/' + file + '?t=' + t, function(text) {
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