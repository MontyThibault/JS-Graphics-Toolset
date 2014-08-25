engine.player = (function() {

	var obj = new THREE.Object3D(),
		pointLight = new THREE.PointLight(0xFFFFFF, 2, 50),
		box = new THREE.BoxGeometry(1, 1, 1),
		mat = new THREE.MeshBasicMaterial({ color: 0x00FF00 }),
		mesh = new THREE.Mesh(box, mat);


	window.p = pointLight;

	obj.position.set(0, 1, 0);

	obj.add(pointLight);
	obj.add(mesh);


	return obj;
})();