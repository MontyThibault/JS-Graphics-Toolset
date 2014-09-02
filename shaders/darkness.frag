uniform vec3 diffuse;
uniform float opacity;

/////////////
uniform vec3 uPlayerPosition;

// These are constants added by a define block. See material.js.
uniform vec3 uVOVerts[ uVOVertsLength ];
uniform int uVOEdges[ uVOEdgesLength ];

uniform sampler2D uVOTexture;

varying float vOccluded;
varying vec2 vIntersectPoint;

varying float vEdgeA;
varying float vEdgeB;

varying vec3 vLightFront;
varying vec4 vWorldPosition;

/////////////


#ifdef USE_COLOR

	varying vec3 vColor;

#endif

#if defined( USE_MAP ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( USE_SPECULARMAP ) || defined( USE_ALPHAMAP )

	varying vec2 vUv;

#endif

#ifdef USE_MAP

	uniform sampler2D map;

#endif
#ifdef USE_ALPHAMAP

	uniform sampler2D alphaMap;

#endif

#ifdef USE_LIGHTMAP

	varying vec2 vUv2;
	uniform sampler2D lightMap;

#endif
#ifdef USE_ENVMAP

	uniform float reflectivity;
	uniform samplerCube envMap;
	uniform float flipEnvMap;
	uniform int combine;

	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP )

		uniform bool useRefract;
		uniform float refractionRatio;

	#else

		varying vec3 vReflect;

	#endif

#endif
#ifdef USE_FOG

	uniform vec3 fogColor;

	#ifdef FOG_EXP2

		uniform float fogDensity;

	#else

		uniform float fogNear;
		uniform float fogFar;
	#endif

#endif
#ifdef USE_SHADOWMAP

	uniform sampler2D shadowMap[ MAX_SHADOWS ];
	uniform vec2 shadowMapSize[ MAX_SHADOWS ];

	uniform float shadowDarkness[ MAX_SHADOWS ];
	uniform float shadowBias[ MAX_SHADOWS ];

	varying vec4 vShadowCoord[ MAX_SHADOWS ];

	float unpackDepth( const in vec4 rgba_depth ) {

		const vec4 bit_shift = vec4( 1.0 / ( 256.0 * 256.0 * 256.0 ), 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );
		float depth = dot( rgba_depth, bit_shift );
		return depth;

	}

#endif
#ifdef USE_SPECULARMAP

	uniform sampler2D specularMap;

#endif
#ifdef USE_LOGDEPTHBUF

	uniform float logDepthBufFC;

	#ifdef USE_LOGDEPTHBUF_EXT

		#extension GL_EXT_frag_depth : enable
		varying float vFragDepth;

	#endif

#endif


////////////////////////

// Hope to Jesus that no lines are perfectly parallel or have vertices 
// exactly on the origin
vec2 intersectPoint(vec2 a, vec2 b, vec2 c, vec2 d) {
	float slope1, slope2, c1, c2;

	// Calculate slopes of both lines
	slope1 = (b.y - a.y) / (b.x - a.x);
	slope2 = (d.y - c.y) / (d.x - c.x);

	// Calculate y-intercepts of both lines
	c1 = a.y - (a.x * slope1);
	c2 = c.y - (c.x * slope2);

	// (m1x + y1 = m2x + y2) boils down to (x = (y2 - y1) / (m1 - m2))
	float ix = (c2 - c1) / (slope1 - slope2),
		  iy = (ix * slope1) + c1;

	return vec2(ix, iy);
}

bool onLine(vec2 point, vec2 a, vec2 b) {

	// Make sure x is in the domain of both lines
	// Checking just x should be enough
	return (point.x < max(a.x, b.x)) && (point.x > min(a.x, b.x));
}

bool intersect(vec2 a, vec2 b, vec2 c, vec2 d) {
	vec2 p = intersectPoint(a, b, c, d);

	return onLine(p, a, b) && onLine(p, c, d);
}

bool withinRadius(vec2 a, vec2 b, float radius) {
	// deltaX^2 + deltaY^2 < r^2 
	return ((b.x - a.x) * (b.x - a.x)) + ((b.y - a.y) * (b.y - a.y)) < (radius * radius);
}

// Overcomplicated way to do vVOVerts[i]
vec3 vertexIndex(int i) {

	for(int j = 0; j <uVOVertsLength; j++) {
		if(j == i) {
			return uVOVerts[j];
		}
	}
}

int edgeIndex(int i) {

	for(int j = 0; j <uVOEdgesLength; j++) {
		if(j == i) {
			return uVOEdges[j];
		}
	}
}



////////////////////////

void main() {
	gl_FragColor = vec4( diffuse, opacity );
#if defined(USE_LOGDEPTHBUF) && defined(USE_LOGDEPTHBUF_EXT)

	gl_FragDepthEXT = log2(vFragDepth) * logDepthBufFC * 0.5;

#endif
#ifdef USE_MAP

	vec4 texelColor = texture2D( map, vUv );

	#ifdef GAMMA_INPUT

		texelColor.xyz *= texelColor.xyz;

	#endif

	gl_FragColor = gl_FragColor * texelColor;

#endif
#ifdef USE_ALPHAMAP

	gl_FragColor.a *= texture2D( alphaMap, vUv ).g;

#endif

#ifdef ALPHATEST

	if ( gl_FragColor.a < ALPHATEST ) discard;

#endif


/////////////////////

/*

uniform vec3 uPlayerPosition;

// These are template variables. They are replaced before the shader is compiled with the correct number of verts/edges in the geometry.
// See materials.js
uniform vec3 uVOVerts[ <uVOVertsLength> ];
uniform int uVOEdges[ <uVOEdgesLength> ];

varying vec3 vLightFront;
varying vec4 vWorldPosition;

*/


// int edgeA, edgeB;
// vec3 vertA, vertB;
// vec2 point;

// bool shadowed = false;

// for(int i = 0; i < uVOEdgesLength; i += 2) {

// 	// vertA = uVOVerts[uVOEdges[i]];
// 	// vertB = uVOVerts[uVOEdges[i + 1]];

// 	// sampler2D(uVOTexture, vec2(i, 0.0));

// 	//edgeA = texture2D(uVOTexture, vec2(i, 0.0));
// 	edgeA = uVOEdges[i];
// 	edgeB = uVOEdges[i + 1];

// 	bool halfWay = false;
// 	for(int j = 0; j <uVOVertsLength; j++) {
// 		if(j == edgeA) {
// 			vertA = uVOVerts[j];
// 			if(halfWay) {
// 				break;
// 			} else {
// 				halfWay = true;
// 			}
// 		}

// 		if(j == edgeB) {
// 			vertB = uVOVerts[j];
// 			if(halfWay) {
// 				break;
// 			} else {
// 				halfWay = true;
// 			}
// 		}
// 	}

// 	//Disable for slowness

// 	point = intersectPoint(vertA.xz, vertB.xz, uPlayerPosition.xz, vWorldPosition.xz);
// 	if(onLine(point, vertA.xz, vertB.xz) && onLine(point, uPlayerPosition.xz, vWorldPosition.xz)) {

// 		gl_FragColor *= max(0.0, min(1.0, (distance(vWorldPosition.xz, point) * -0.5) + 1.0));
// 		shadowed = true;
// 		// break;
// 	}
// }

// Disable lighting effects for now 


// bool shadowed = false;
// if(vOccluded > 0.0 && vOccluded < 1.0) {
// 	int edgeA, edgeB;
// 	vec3 vertA, vertB;
// 	vec2 point;

	

// 	for(int i = 0; i < uVOEdgesLength; i += 2) {

// 		// vertA = uVOVerts[uVOEdges[i]];
// 		// vertB = uVOVerts[uVOEdges[i + 1]];

// 		// sampler2D(uVOTexture, vec2(i, 0.0));

// 		//edgeA = texture2D(uVOTexture, vec2(i, 0.0));
// 		edgeA = uVOEdges[i];
// 		edgeB = uVOEdges[i + 1];

// 		bool halfWay = false;
// 		for(int j = 0; j <uVOVertsLength; j++) {
// 			if(j == edgeA) {
// 				vertA = uVOVerts[j];
// 				if(halfWay) {
// 					break;
// 				} else {
// 					halfWay = true;
// 				}
// 			}

// 			if(j == edgeB) {
// 				vertB = uVOVerts[j];
// 				if(halfWay) {
// 					break;
// 				} else {
// 					halfWay = true;
// 				}
// 			}
// 		}

// 		//Disable for slowness

// 		point = intersectPoint(vertA.xz, vertB.xz, uPlayerPosition.xz, vWorldPosition.xz);
// 		if(onLine(point, vertA.xz, vertB.xz) && onLine(point, uPlayerPosition.xz, vWorldPosition.xz)) {

// 			gl_FragColor *= max(0.0, min(1.0, (distance(vWorldPosition.xz, point) * -0.5) + 1.0));
// 			shadowed = true;
// 			// break;
// 		}
// 	}
// } else if(vOccluded == 1.0) {
// 	gl_FragColor.xyz *= 0.0;
// }

if(vOccluded != 0.0) {

	// On a face with a combination of shaded and unshaded verts
	if(vOccluded != 1.0) {

		int vEdge = int(vEdgeB / vEdgeA);
		vec3 vertA = vertexIndex(edgeIndex(vEdge)),
			vertB = vertexIndex(edgeIndex(vEdge + 1));


		vec2 point = intersectPoint(vertA.xz, vertB.xz, uPlayerPosition.xz, vWorldPosition.xz);
		if(onLine(point, vertA.xz, vertB.xz) && onLine(point, uPlayerPosition.xz, vWorldPosition.xz)) {

			float brightness = (distance(vWorldPosition.xz, point) * -0.7) + 1.0;
			gl_FragColor *= max(0.0, min(1.0, brightness));


		} else {
			gl_FragColor.xyz = vec3(0.0, 1.0, 0.0);
		}

	} else {

		float brightness = (distance(vWorldPosition.xz, vIntersectPoint) * -0.7) + 1.0;
		gl_FragColor *= max(0.0, min(1.0, brightness));
	}
}


vec3 not_vLightFront = vLightFront - 0.9; 
not_vLightFront = not_vLightFront * 3.0;
not_vLightFront = min(not_vLightFront, 1.0);
not_vLightFront = max(not_vLightFront, 0.5);
gl_FragColor.xyz *= not_vLightFront;

// if(intersect(uVOVerts[52].xz, uVOVerts[51].xz, uPlayerPosition.xz, vWorldPosition.xz)) {
// 	gl_FragColor *= 0.2;
// }

// if(withinRadius(vWorldPosition.xz, uVOVerts[51].xz, 0.5)) {
// 	gl_FragColor *= 0.5;
// }

// if(withinRadius(vWorldPosition.xz, uVOVerts[52].xz, 0.5)) {
// 	gl_FragColor *= 0.2;
// }

// if(withinRadius(vWorldPosition.xz, uPlayerPosition.xz, 0.5)) {
// 	gl_FragColor *= 0.2;
// }

// if(withinRadius(vWorldPosition.xz, vec2(5.0, 5.0), 0.5)) {
// 	gl_FragColor *= 0.2;
// }


float specularStrength;

#ifdef USE_SPECULARMAP

	vec4 texelSpecular = texture2D( specularMap, vUv );
	specularStrength = texelSpecular.r;

#else


specularStrength = 1.0;

#endif
#ifdef USE_LIGHTMAP

	gl_FragColor = gl_FragColor * texture2D( lightMap, vUv2 );

#endif
#ifdef USE_COLOR

	gl_FragColor = gl_FragColor * vec4( vColor, 1.0 );

#endif
#ifdef USE_ENVMAP

	vec3 reflectVec;

	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP )

		vec3 cameraToVertex = normalize( vWorldPosition - cameraPosition );

		// http://en.wikibooks.org/wiki/GLSL_Programming/Applying_Matrix_Transformations
		// Transforming Normal Vectors with the Inverse Transformation

		vec3 worldNormal = normalize( vec3( vec4( normal, 0.0 ) * viewMatrix ) );

		if ( useRefract ) {

			reflectVec = refract( cameraToVertex, worldNormal, refractionRatio );

		} else { 

			reflectVec = reflect( cameraToVertex, worldNormal );

		}

	#else

		reflectVec = vReflect;

	#endif

	#ifdef DOUBLE_SIDED

		float flipNormal = ( -1.0 + 2.0 * float( gl_FrontFacing ) );
		vec4 cubeColor = textureCube( envMap, flipNormal * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );

	#else

		vec4 cubeColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );

	#endif

	#ifdef GAMMA_INPUT

		cubeColor.xyz *= cubeColor.xyz;

	#endif

	if ( combine == 1 ) {

		gl_FragColor.xyz = mix( gl_FragColor.xyz, cubeColor.xyz, specularStrength * reflectivity );

	} else if ( combine == 2 ) {

		gl_FragColor.xyz += cubeColor.xyz * specularStrength * reflectivity;

	} else {

		gl_FragColor.xyz = mix( gl_FragColor.xyz, gl_FragColor.xyz * cubeColor.xyz, specularStrength * reflectivity );

	}

#endif
#ifdef USE_SHADOWMAP

	#ifdef SHADOWMAP_DEBUG

		vec3 frustumColors[3];
		frustumColors[0] = vec3( 1.0, 0.5, 0.0 );
		frustumColors[1] = vec3( 0.0, 1.0, 0.8 );
		frustumColors[2] = vec3( 0.0, 0.5, 1.0 );

	#endif

	#ifdef SHADOWMAP_CASCADE

		int inFrustumCount = 0;

	#endif

	float fDepth;
	vec3 shadowColor = vec3( 1.0 );

	for( int i = 0; i < MAX_SHADOWS; i ++ ) {

		vec3 shadowCoord = vShadowCoord[ i ].xyz / vShadowCoord[ i ].w;

				// if ( something && something ) breaks ATI OpenGL shader compiler
				// if ( all( something, something ) ) using this instead

		bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
		bool inFrustum = all( inFrustumVec );

				// don't shadow pixels outside of light frustum
				// use just first frustum (for cascades)
				// don't shadow pixels behind far plane of light frustum

		#ifdef SHADOWMAP_CASCADE

			inFrustumCount += int( inFrustum );
			bvec3 frustumTestVec = bvec3( inFrustum, inFrustumCount == 1, shadowCoord.z <= 1.0 );

		#else

			bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );

		#endif

		bool frustumTest = all( frustumTestVec );

		if ( frustumTest ) {

			shadowCoord.z += shadowBias[ i ];

			#if defined( SHADOWMAP_TYPE_PCF )

						// Percentage-close filtering
						// (9 pixel kernel)
						// http://fabiensanglard.net/shadowmappingPCF/

				float shadow = 0.0;

		/*
						// nested loops breaks shader compiler / validator on some ATI cards when using OpenGL
						// must enroll loop manually

				for ( float y = -1.25; y <= 1.25; y += 1.25 )
					for ( float x = -1.25; x <= 1.25; x += 1.25 ) {

						vec4 rgbaDepth = texture2D( shadowMap[ i ], vec2( x * xPixelOffset, y * yPixelOffset ) + shadowCoord.xy );

								// doesn't seem to produce any noticeable visual difference compared to simple texture2D lookup
								//vec4 rgbaDepth = texture2DProj( shadowMap[ i ], vec4( vShadowCoord[ i ].w * ( vec2( x * xPixelOffset, y * yPixelOffset ) + shadowCoord.xy ), 0.05, vShadowCoord[ i ].w ) );

						float fDepth = unpackDepth( rgbaDepth );

						if ( fDepth < shadowCoord.z )
							shadow += 1.0;

				}

				shadow /= 9.0;

		*/

				const float shadowDelta = 1.0 / 9.0;

				float xPixelOffset = 1.0 / shadowMapSize[ i ].x;
				float yPixelOffset = 1.0 / shadowMapSize[ i ].y;

				float dx0 = -1.25 * xPixelOffset;
				float dy0 = -1.25 * yPixelOffset;
				float dx1 = 1.25 * xPixelOffset;
				float dy1 = 1.25 * yPixelOffset;

				fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy0 ) ) );
				if ( fDepth < shadowCoord.z ) shadow += shadowDelta;

				fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy0 ) ) );
				if ( fDepth < shadowCoord.z ) shadow += shadowDelta;

				fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy0 ) ) );
				if ( fDepth < shadowCoord.z ) shadow += shadowDelta;

				fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, 0.0 ) ) );
				if ( fDepth < shadowCoord.z ) shadow += shadowDelta;

				fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy ) );
				if ( fDepth < shadowCoord.z ) shadow += shadowDelta;

				fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, 0.0 ) ) );
				if ( fDepth < shadowCoord.z ) shadow += shadowDelta;

				fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy1 ) ) );
				if ( fDepth < shadowCoord.z ) shadow += shadowDelta;

				fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy1 ) ) );
				if ( fDepth < shadowCoord.z ) shadow += shadowDelta;

				fDepth = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy1 ) ) );
				if ( fDepth < shadowCoord.z ) shadow += shadowDelta;

				shadowColor = shadowColor * vec3( ( 1.0 - shadowDarkness[ i ] * shadow ) );

			#elif defined( SHADOWMAP_TYPE_PCF_SOFT )

						// Percentage-close filtering
						// (9 pixel kernel)
						// http://fabiensanglard.net/shadowmappingPCF/

				float shadow = 0.0;

				float xPixelOffset = 1.0 / shadowMapSize[ i ].x;
				float yPixelOffset = 1.0 / shadowMapSize[ i ].y;

				float dx0 = -1.0 * xPixelOffset;
				float dy0 = -1.0 * yPixelOffset;
				float dx1 = 1.0 * xPixelOffset;
				float dy1 = 1.0 * yPixelOffset;

				mat3 shadowKernel;
				mat3 depthKernel;

				depthKernel[0][0] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy0 ) ) );
				depthKernel[0][1] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, 0.0 ) ) );
				depthKernel[0][2] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx0, dy1 ) ) );
				depthKernel[1][0] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy0 ) ) );
				depthKernel[1][1] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy ) );
				depthKernel[1][2] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( 0.0, dy1 ) ) );
				depthKernel[2][0] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy0 ) ) );
				depthKernel[2][1] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, 0.0 ) ) );
				depthKernel[2][2] = unpackDepth( texture2D( shadowMap[ i ], shadowCoord.xy + vec2( dx1, dy1 ) ) );

				vec3 shadowZ = vec3( shadowCoord.z );
				shadowKernel[0] = vec3(lessThan(depthKernel[0], shadowZ ));
				shadowKernel[0] *= vec3(0.25);

				shadowKernel[1] = vec3(lessThan(depthKernel[1], shadowZ ));
				shadowKernel[1] *= vec3(0.25);

				shadowKernel[2] = vec3(lessThan(depthKernel[2], shadowZ ));
				shadowKernel[2] *= vec3(0.25);

				vec2 fractionalCoord = 1.0 - fract( shadowCoord.xy * shadowMapSize[i].xy );

				shadowKernel[0] = mix( shadowKernel[1], shadowKernel[0], fractionalCoord.x );
				shadowKernel[1] = mix( shadowKernel[2], shadowKernel[1], fractionalCoord.x );

				vec4 shadowValues;
				shadowValues.x = mix( shadowKernel[0][1], shadowKernel[0][0], fractionalCoord.y );
				shadowValues.y = mix( shadowKernel[0][2], shadowKernel[0][1], fractionalCoord.y );
				shadowValues.z = mix( shadowKernel[1][1], shadowKernel[1][0], fractionalCoord.y );
				shadowValues.w = mix( shadowKernel[1][2], shadowKernel[1][1], fractionalCoord.y );

				shadow = dot( shadowValues, vec4( 1.0 ) );

				shadowColor = shadowColor * vec3( ( 1.0 - shadowDarkness[ i ] * shadow ) );

			#else

				vec4 rgbaDepth = texture2D( shadowMap[ i ], shadowCoord.xy );
				float fDepth = unpackDepth( rgbaDepth );

				if ( fDepth < shadowCoord.z )

		// spot with multiple shadows is darker

					shadowColor = shadowColor * vec3( 1.0 - shadowDarkness[ i ] );

		// spot with multiple shadows has the same color as single shadow spot

		// 					shadowColor = min( shadowColor, vec3( shadowDarkness[ i ] ) );

			#endif

		}


		#ifdef SHADOWMAP_DEBUG

			#ifdef SHADOWMAP_CASCADE

				if ( inFrustum && inFrustumCount == 1 ) gl_FragColor.xyz *= frustumColors[ i ];

			#else

				if ( inFrustum ) gl_FragColor.xyz *= frustumColors[ i ];

			#endif

		#endif

	}

	#ifdef GAMMA_OUTPUT

		shadowColor *= shadowColor;

	#endif

	gl_FragColor.xyz = gl_FragColor.xyz * shadowColor;

#endif

#ifdef GAMMA_OUTPUT

	gl_FragColor.xyz = sqrt( gl_FragColor.xyz );

#endif
#ifdef USE_FOG

	#ifdef USE_LOGDEPTHBUF_EXT

		float depth = gl_FragDepthEXT / gl_FragCoord.w;

	#else

		float depth = gl_FragCoord.z / gl_FragCoord.w;

	#endif

	#ifdef FOG_EXP2

		const float LOG2 = 1.442695;
		float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
		fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );

	#else

		float fogFactor = smoothstep( fogNear, fogFar, depth );

	#endif
	
	gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );

#endif

}