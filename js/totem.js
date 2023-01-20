import * as THREE from './three/three.modules.js';

class Totem {
    constructor() {
        this.light = new THREE.PointLight(0x222222, 2, 30);
    }
}

export { Totem }