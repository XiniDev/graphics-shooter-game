import * as THREE from './three/three.modules.js';
import { PointerLockControls } from './three/addons/PointerLockControls.js';

const ACCELERATION = new THREE.Vector3(1.0, 0, 1.0)

class FirstPersonControls {
    constructor(camera) {
        this.moveForward = false;
        this.moveBacward = false;
        this.moveRight = false;
        this.moveLeft = false;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.controls = new PointerLockControls(camera, document.body);

        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
        }
    }

    update(delta) {
        let directionZ = Number(this.moveForward) - Number(this.moveBackward)
        let directionX = Number(this.moveRight) - Number(this.moveLeft)
        this.changeVelocity(new THREE.Vector3(directionX, 0, directionZ), delta);

        this.controls.moveForward(this.velocity.z);
        this.controls.moveRight(this.velocity.x);
    }

    changeVelocity(direction, delta) {
        this.velocity += direction * ACCELERATION * delta
    }
}

export { FirstPersonControls };