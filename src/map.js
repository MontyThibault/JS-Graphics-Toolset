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
        sortEdges: null,
    	load: load
    };


    // Create a wrapper for the parsing function, which is automatically called by 
    // JSONLoader
    var oldParse = THREE.JSONLoader.prototype.parse;
    THREE.JSONLoader.prototype.parse = function(json, texturePath) {
        var obj = oldParse(json, texturePath),
            geo = obj.geometry;

        geo.viewOcclusion = oldParse(json.viewOcclusion, texturePath).geometry;
        geo.viewOcclusion.edges = json.viewOcclusion.edges;

        geo.viewOcclusion.edgePairs = parseEdges(json.viewOcclusion.edges);
        geo.viewOcclusion.dataTexture = createDataTexture(geo.viewOcclusion);

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

    function createDataTexture(vo) {

        // Vertices
        var length = vo.vertices.length,
            data = new Float32Array(length * 3);

        for(var i = 0; i < length; i++) {
            data[length * 3] = vo.vertices[i].x;
            data[(length * 3) + 1] = vo.vertices[i].y;
            data[(length * 3) + 2] = vo.vertices[i].z;
        }

        var edgeTexture = new THREE.DataTexture(
            data, 
            length, // width
            1,  // height
            THREE.RGBFormat, 
            THREE.FloatType);

        return edgeTexture;
    }

    // ## TODO: Create a system unifying parseEdges, createDataTexture, and sortEdges
    // to easily feed data into the shader. voEdges() or something

    // Rename edges -> vertEdges
    // Change edgePairs to [[a, b], [a, b], [a, b]]


    exports.sortEdges = (function() {

        // Array of vertex indicies, arranged from closest to farthest from a designated target
        var vertexOrder = [];

        function updateVertexOrder(target, vo) {
            var verts = vo.vertices;

            vertexOrder = [];
            
            for(var i = 0; i < verts.length; i++) {
                vertexOrder.push(i);
            }

            vertexOrder.sort(function(a, b) {
                return verts[a].distanceToSquared(target) - verts[b].distanceToSquared(target);
            });
        }

        // Sorts edges arranged from closest to farthest from the given vec3 target
        return function(target, vo, updateVO) {

            if(vertexOrder.length === 0 || updateVO !== false) {
                updateVertexOrder(target, vo);
            }

            var edgePairs = []; // [[a, b], [a, b] ...]
            for(var i = 0; i < vo.edgePairs.length; i += 2) {
                edgePairs.push([vo.edgePairs[i], vo.edgePairs[i + 1]]);
            }  

            edgePairs.sort(function(a, b) {

                var a1 = vertexOrder.indexOf(a[0]),
                    a2 = vertexOrder.indexOf(a[1]),
                    b1 = vertexOrder.indexOf(b[0]),
                    b2 = vertexOrder.indexOf(b[1]);

                // Math.min(x1, x2) refers to the close vertex of the edge
                // Math.max(x1, x2) refers to the far vertex of the edge

                if(Math.min(a1, a2) === Math.min(b1, b2)) {

                    return Math.max(a1, a2) > Math.max(b1, b2);

                } else {
                    return Math.min(a1, a2) > Math.min(b1, b2);
                }
            }); 

            return engine.flatten(edgePairs);
        };
    })();

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

                geometry.viewOcclusion.edgePairs = exports.sortEdges(engine.player.position, geometry.viewOcclusion);

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

            var mat = new THREE.LineBasicMaterial({
                color: new THREE.Color().setHSL(i / v.edgePairs.length, 1, 0.5),
                linewidth: 2
            });

             geo = new THREE.Geometry();
            geo.vertices.push(v.vertices[v.edgePairs[i]], 
                              v.vertices[v.edgePairs[i + 1]]);
                
            line = new THREE.Line(geo, mat);
            bigObj.add(line);
        }

     
        bigObj.position.set(0, 1, 0);
        // bigObj.renderDepth = 1e20;

        return bigObj;
    }

    return exports;
})();