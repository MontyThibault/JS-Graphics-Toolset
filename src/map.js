// Create a wrapper for the parsing function, which is automatically called by 
// JSONLoader
var oldParse = THREE.JSONLoader.prototype.parse;
THREE.JSONLoader.prototype.parse = function(json, texturePath) {
    var obj = oldParse(json, texturePath),
        geo = obj.geometry;

    geo.viewOcclusion = oldParse(json.viewOcclusion, texturePath).geometry;
    geo.viewOcclusion.edges = json.viewOcclusion.edges;

    geo.viewOcclusion.edgePairs = parseEdges(json.viewOcclusion.edges);

    return obj;
};

// viewOcclusion.edges are the edges exactly as defined in map.js

// Generates viewOcclusion.edgePairs, which collapse into an array of ints
// [Edge1A, Edge1B, Edge2A, Edge2B, ... ] that can be fed into a shader
function parseEdges(edges) {
    var edgePairs = [];

    for(var i = 0; i < edges.length; i++) {
        for(var j = 0; j < edges[i].length; j++) {
            edgePairs.push(i, edges[i][j]);
        }
    }

    return edgePairs;
}


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
        viewOcclusion: null,
    	load: load
    };


    function load(callback) {
    	var loader = new THREE.JSONLoader(),
            t = new Date().getTime();

        $path.text('assets/samplemap/map.js');
	    loader.load('assets/samplemap/map.js?t=' + t, function (geometry) {

            exports.viewOcclusion = geometry.viewOcclusion;

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
                // obj.add(lines);
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
        // for(var i = 0; i < v.edges.length; i++) {
        //     for(var j = 0; j < v.edges[i].length; j++) {

        //    

        //         console.log(v.vertices[i], v.vertices[v.edges[i][j]]);

        //         geo = new THREE.Geometry();
        //         geo.vertices.push(v.vertices[i], v.vertices[v.edges[i][j]]);
                
        //         line = new THREE.Line(geo, material);
        //         bigObj.add(line);
        //     }
        // }

        for(var i = 0; i < v.edgePairs.length; i += 2) {
            //if(i === 188) continue;

             geo = new THREE.Geometry();
            geo.vertices.push(v.vertices[v.edgePairs[i]], 
                              v.vertices[v.edgePairs[i + 1]]);
                
            line = new THREE.Line(geo, material);
            bigObj.add(line);
        }

     
        bigObj.position.set(0, 1, 0);
        // bigObj.renderDepth = 1e20;

        return bigObj;
    }

    return exports;
})();