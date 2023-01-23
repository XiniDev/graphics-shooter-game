import * as THREE from './three/three.modules.js';

class Crosshair {
    constructor() {
        this.width = 0.2;
        this.height = 0.02;
        const geometry = new THREE.PlaneGeometry(0.2, 0.02);
        const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xFFFFFF) });

        this.group = new THREE.Group();
        this.horizontal = new THREE.Mesh( geometry, material );
        this.horizontal.position.set(0, 0, -5);

        this.vertical = new THREE.Mesh( geometry, material );
        this.vertical.rotateZ( - Math.PI / 2 );
        this.vertical.position.set(0, 0, -5);

        this.group.add(this.horizontal);
        this.group.add(this.vertical);
    }

    init(camera) {
        camera.add(this.group);
    }

    balance(factor) {
        this.vertical.geometry.scale(factor, factor, 1 );
        this.horizontal.geometry.scale(factor, factor, 1);
    }
}

export { Crosshair };