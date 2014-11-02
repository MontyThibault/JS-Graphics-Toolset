g.player = (function() {

	var obj = new THREE.Object3D(),
		pointLight = new THREE.PointLight(0xFFFFFF, 2, 50),
		box = new THREE.BoxGeometry(1, 1, 1),
		mat = new THREE.MeshBasicMaterial({ color: 0x00FF00 }),
		mesh = new THREE.Mesh(box, mat);

	pointLight.position.set(0, 3, 0);
	mesh.scale.multiplyScalar(0.3);

	obj.add(pointLight);
	obj.add(mesh);


	return obj;
})();