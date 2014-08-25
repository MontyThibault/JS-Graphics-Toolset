engine.map = (function() {
    
    // aspects of a map:
    //
    // pathfinding guideways
    // grid (includes impassable areas & any special features)
    // terrain & textures
    // any special information
    
    var $path = $('#path'),
    exports = {
    	material: null,
    	mesh: null,
    	load: load,
    };


    function load(callback) {
    	var loader = new THREE.JSONLoader();
        $path.text('assets/samplemap/mapflipped.js');
	    loader.load('assets/samplemap/mapflipped.js', function (geometry) {

            $path.text('assets/samplemap/Colormap.png');
	    	THREE.ImageUtils.loadTexture('assets/samplemap/Colormap.png', 
	    		THREE.UVMapping, function(texture) {

                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                texture.anisotropy = 16;

	    		exports.material = new engine.materials.terrain({
	    			map: texture
	    		});

                window.mat = exports.material;

	    		exports.mesh = new THREE.Mesh(geometry, exports.material);

	    		callback(exports.mesh);
	    	});
	    });
    }

    return exports;
})();