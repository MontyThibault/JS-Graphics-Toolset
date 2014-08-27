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

                var lines = drawLines(geometry.viewOcclusion);

	    		exports.mesh = new THREE.Mesh(geometry, exports.material);

	    		//callback(exports.mesh);
                var obj = new THREE.Object3D();
                obj.add(lines);
                obj.add(exports.mesh);
                callback(obj);
            });
	    });
    }

    function drawLines(v) {

        var material = new THREE.LineBasicMaterial({
            color: 0x7777ff,
            linewidth: 2
        });
        // material.depthWrite = false;
        // material.depthTest = false;

        var bigObj = new THREE.Object3D(),  
            geo, line;
        for(var i = 0; i < v.edges.length; i++) {
            for(var j = 0; j < v.edges[i].length; j++) {

                geo = new THREE.Geometry();
                geo.vertices.push(v.vertices[i], v.vertices[v.edges[i][j]]);
                
                line = new THREE.Line(geo, material);
                bigObj.add(line);
            }
        }
     
        bigObj.position.set(0, 1, 0);
        bigObj.scale.set(1.1, 1.1, 1.1); // This is bizarre
        // bigObj.renderDepth = 1e20;

        return bigObj;
    }

    return exports;
})();