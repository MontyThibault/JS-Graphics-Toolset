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
        $path.text('assets/samplemap/map.js');
	    loader.load('assets/samplemap/map.js', function (geometry) {

            $path.text('assets/samplemap/Colormap.png');
	    	THREE.ImageUtils.loadTexture('assets/samplemap/Colormap.png', 
	    		THREE.UVMapping, function(texture) {

	    		exports.material = new THREE.MeshBasicMaterial({
	    			map: texture
	    		});

	    		exports.mesh = new THREE.Mesh(geometry, exports.material);
                exports.mesh.scale.set(1, 1, -1);

	    		callback(exports.mesh);
	    	});
	    });
    }

    return exports;
})();