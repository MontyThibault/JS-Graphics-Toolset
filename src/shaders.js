engine.shaders = (function() {

	var shaders = {},
		files = [
		'gridHighlightF',
		'gridHighlightV',
		'overlayColorF',
		'overlayConstantF',
		'selectionPlaneF',
		'selectionPlaneV',
		'standardV'],
		$path = $('#path');

	function load(callback) {
		var file = files.shift();
		$path.text('shaders/' + file);

		$.get('shaders/' + file, function(text) {
			shaders[file] = text;

			if(files.length) {
				load(callback);
			} else {
				callback();
			}
		});
	}

	shaders.load = load;
	return shaders;
})();