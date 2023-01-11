import * as THREE from './three/three.modules.js';

export function v3Direction(direction) {
    switch (direction) {
        case 'foward':
            return new THREE.Vector3(0, 0, 1);
        case 'back':
            return new THREE.Vector3(0, 0, -1);
        case 'right':
            return new THREE.Vector3(1, 0, 0);
        case 'left':
            return new THREE.Vector3(-1, 0, 0);
        case 'up':
            return new THREE.Vector3(0, 1, 0);
        case 'down':
            return new THREE.Vector3(0, -1, 0);
    }
}