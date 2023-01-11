import * as THREE from './three/three.modules.js';

class Crosshair {
    constructor() {
        const geometry = new THREE.PlaneGeometry(0.1, 0.01);
        const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x000000) });

        this.group = new THREE.Group();
        this.horizontal = new THREE.Mesh( geometry, material );
        this.horizontal.position.set(0, 0, -5);

        this.vertical = new THREE.Mesh( geometry, material );
        this.vertical.rotateZ( - Math.PI / 2 );
        this.vertical.position.set(0, 0, -5);

        this.group.add(this.horizontal);
        this.group.add(this.vertical)
    }
}

export { Crosshair };