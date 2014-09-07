engine.map = (function() {

    // Create a wrapper for the parsing function, which is automatically called
    // by JSONLoader
    var oldParse = THREE.JSONLoader.prototype.parse;
    THREE.JSONLoader.prototype.parse = function(json, texturePath) {

        if(json.metadata.type !== 'map') {
            return oldParse(json, texturePath);
        }

        var obj = oldParse(json, texturePath),
            geo = obj.geometry;

        geo.viewOccluder = oldParse(json.viewOccluder, texturePath).geometry;

        geo.viewOccluder.edgeVerts = json.viewOccluder.edgeVerts;
        geo.viewOccluder.edgePairs = makeEdgePairs(json.viewOccluder.edgeVerts);
        geo.viewOccluder.dataTexture = vertTexture(geo.viewOccluder);

        return obj;
    };

    // Generates viewOccluder.edgePairs of the form [[A1, B1], [A2, B2]]
    // which can collapse into an array of ints [A1, B1, A2, B2 ... ] 
    // that can be fed into a shader
    function makeEdgePairs(edgeVerts) {
        var edgePairs = [];

        for(var i = 0; i < edgeVerts.length; i++) {
            for(var j = 0; j < edgeVerts[i].length; j++) {
                edgePairs.push([i, edgeVerts[i][j]]);
            }
        }

        return edgePairs;
    }

    function vertTexture(vo) {

        // Vertices
        var length = vo.vertices.length,
            data = new Float32Array(length * 3);

        for(var i = 0; i < length; i++) {
            data[length * 3] = vo.vertices[i].x;
            data[(length * 3) + 1] = vo.vertices[i].y;
            data[(length * 3) + 2] = vo.vertices[i].z;
        }

        var texture = new THREE.DataTexture(
            data, 
            length, // width
            1,  // height
            THREE.RGBFormat, 
            THREE.FloatType);

        return texture;
    }


    /** Playable terrain in the game world. Must have geometry, a view occluder,
     * and a texture.
     *
     * @class Map
     * @constructor
    **/
    function Map(config) {
        this.geometryPath = config.geometryPath;
        this.texturePath = config.texturePath;

        this.geometry = null;
        this.texture = null;
        this.viewOccluder = null;
        this.material = null;
        this.mesh = null;

        // Array of view occluder vertex indicies, arranged from closest to 
        // farthest from a designated target - usually the player position
        this.vertexOrder = [];
    }


    var $path = $('#path'), 
        loader = new THREE.JSONLoader();

    /** Loads geometry, texture, and sets properties
     *
     * @param callback
     * @class Map
     * @method load
     */
    Map.prototype.load = function(callback) {
        var t = new Date().getTime(),
            that = this;

        $path.text(this.meshPath);
        loader.load(this.meshPath + '?t=' + t, function (geometry) {

            that.geometry = geometry;
            that.viewOccluder = geometry.viewOccluder;

            $path.text(that.texturePath);
            THREE.ImageUtils.loadTexture(that.texturePath + '?t=' + t, 
                THREE.UVMapping, function(texture) {

                that.texture = texture;

                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                texture.anisotropy = 16;

                that.material = new engine.materials.darkness({
                    map: texture
                });

                var lines = that.generateVOLines(that.viewOccluder);

                that.mesh = new THREE.Mesh(geometry, that.material);

                //callback(exports.mesh);
                var obj = new THREE.Object3D();
                // obj.add(lines);
                obj.add(that.mesh);
                callback(obj);
            });
        });
    };

    /** Returns scenegraph object composed of individual lines for visualization
     * of the view occluder.
     *
     * @class Map
     * @method generateVOLines
     **/
    Map.prototype.generateVOLines = function() {

        var v = this.viewOccluder,
            material = new THREE.LineBasicMaterial({
                color: 0x7777ff,
                linewidth: 2
        });

        // material.depthWrite = false;
        // material.depthTest = false;

        var bigObj = new THREE.Object3D(),  
            geo, line;

        // for(var i = 0; i < v.edges.length; i++) {
        //     for(var j = 0; j < v.edges[i].length; j++) {
        //         console.log(v.vertices[i], v.vertices[v.edges[i][j]]);
        //         geo = new THREE.Geometry();
        //         geo.vertices.push(v.vertices[i], v.vertices[v.edges[i][j]]);
        //         line = new THREE.Line(geo, material);
        //         bigObj.add(line);
        //     }
        // }

        for(var i = 0; i < v.edgePairs.length; i += 2) {
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
    };

    /** Sorts view occluder vertices by distance (closest first) to the target
     *
     * @class Map
     * @method updateVertexOrder
     * @private
     **/
    function updateVertexOrder(self, target) {
        var verts = self.viewOccluder.vertices;

        self.vertexOrder.length = 0;
        
        for(var i = 0; i < verts.length; i++) {
            self.vertexOrder.push(i);
        }

        self.vertexOrder.sort(function(a, b) {
            return verts[a].distanceToSquared(target) - 
                   verts[b].distanceToSquared(target);
        });
    }


    /** Returns an array of the form [A1, B1, A2, B2 ...] that is fed as a 
      * uniform into a shader that implements view occlusion. Edges are sorted
      * by distance (closest first) to the target.
      *
      * @ param {Vector3} target Usually be player.position
      * @ param {Int} cutoff The max number of edges in the array
      */
    Map.prototype.generateVOEdges = function(target, cutoff) {

        updateVertexOrder(this, target);

        var vo = that.viewOccluder;
        vo.edgePairs.sort(function(a, b) {

            var a1 = vertexOrder.indexOf(a[0]),
                a2 = vertexOrder.indexOf(a[1]),
                b1 = vertexOrder.indexOf(b[0]),
                b2 = vertexOrder.indexOf(b[1]);

            // Math.min(x1, x2) refers to the closest vertex
            // Math.max(x1, x2) refers to the farthest vertex

            // Sort by closest vertex first; if they're the same, sort by
            // the far one.

            if(Math.min(a1, a2) === Math.min(b1, b2)) {

                return Math.max(a1, a2) < Math.max(b1, b2) ? -1 : 1;

            } else {

                return Math.min(a1, a2) < Math.min(b1, b2) ? -1 : 1;
            }
        }); 

        // Return no more than <cutoff> number of edges
        var trimmed = cutoff ? vo.edgePairs.slice(0, cuttoff) : vo.edgePairs;

        return engine.flatten(trimmed);
    };

    return Map;
})();