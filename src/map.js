// Create a wrapper for the parsing function, which is automatically called by 
// JSONLoader
var oldParse = THREE.JSONLoader.prototype.parse;
THREE.JSONLoader.prototype.parse = function(json, texturePath) {
    var obj = oldParse(json, texturePath),
        geo = obj.geometry;

    geo.viewOcclusion = oldParse(json.viewOcclusion, texturePath).geometry;
    geo.viewOcclusion.edges = json.viewOcclusion.edges;

    return obj;
};


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

                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                texture.anisotropy = 16;

	    		exports.material = new engine.materials.darkness({
	    			map: texture
	    		});

                drawLines(geometry.viewOcclusion);

	    		exports.mesh = new THREE.Mesh(geometry, exports.material);

	    		callback(exports.mesh);
	    	});
	    });
    }

    function drawLines(viewOcclusion) {

        var material = new THREE.LineBasicMaterial({
            color: 0x0000ff
        });

        var lines = new THREE.Geometry();


    }

    return exports;
})();