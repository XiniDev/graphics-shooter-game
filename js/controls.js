import * as THREE from './three/three.modules.js';
import { PointerLockControls } from './three/addons/PointerLockControls.js';
import { v3Direction } from './utils.js';

const GRAVITY = 9.8
const DECCELERATION = new THREE.Vector3(-10, -16, -10)
const ACCELERATION = new THREE.Vector3(500, 60, 500)
const SPRINTSPEED = 2

class FirstPersonControls {
    constructor(camera) {
        this.height = 20;

        this.moveForward = false;
        this.moveBackward = false;
        this.moveRight = false;
        this.moveLeft = false;

        this.isSprinting = false;
        this.canSprint = true;

        this.canJump = false;

        this.velocity = new THREE.Vector3(0, 0, 0);
        this.controls = new PointerLockControls(camera, document.body);

        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    onKeyDown(event) {
        switch (event.code) {
            // movement
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
            // sprint
            case 'ShiftLeft':
                if (this.canSprint) this.isSprinting = true;
                break;
            // jump
            case 'Space':
                if (this.canJump) this.velocity.y += ACCELERATION.y;
                this.canJump = false;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            // movement
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
            // sprint  
            case 'ShiftLeft':
                this.isSprinting = false;
                break;
        }
    }

    update(delta) {

        this.applyFriction(delta);
        this.applyForce(delta);
        this.movement(delta);
        this.fall(delta)
        this.detectFloor(delta);
    }

    applyFriction(delta) {
        let decceleration = new THREE.Vector3(0, 0, 0)
        // decceleration factors in velocity because decceleration is a fading gradient based on previous values, also this ensures no movement if velocity is 0
        decceleration.x = this.velocity.x * DECCELERATION.x;
        decceleration.z = this.velocity.z * DECCELERATION.z;

        // fall down speed
        decceleration.y = DECCELERATION.y * GRAVITY;

        decceleration = decceleration.multiplyScalar(delta);

        this.velocity.add(decceleration);
    }

    applyForce(delta) {
        let acceleration = new THREE.Vector3(0, 0, 0);
        // acceleration depends on the direction of movement chosen by the player, but cannot simultaneously happen on two polar opposite directions
        acceleration.x = (Number(this.moveRight) - Number(this.moveLeft)) * ACCELERATION.x;
        acceleration.z = (Number(this.moveForward) - Number(this.moveBackward)) * ACCELERATION.z;

        // sprinting cannot happen when player is moving backwards, or purely strafing, it can only happen when moving forwards
        if (this.isSprinting && this.moveForward) acceleration.z *= SPRINTSPEED;

        acceleration = acceleration.multiplyScalar(delta);

        this.velocity.add(acceleration);
    }

    movement(delta) {
        // calculation of foward direction of movement based on the rotation of the camera
        let forward = this.getDirection(v3Direction('back'));
        forward.y = 0;
        forward.normalize();
        forward.multiplyScalar(this.velocity.z * delta);
        
        let right = this.getDirection(v3Direction('right'));
        right.y = 0;
        right.normalize();
        right.multiplyScalar(this.velocity.x * delta);
        
        this.controls.getObject().position.add(forward).add(right);
    }

    getDirection(vector) {
        return vector.applyQuaternion(this.controls.getObject().quaternion);
    }

    fall(delta) {
        this.controls.getObject().position.y += this.velocity.y * delta;
    }

    detectFloor(delta) {
        if (this.controls.getObject().position.y < this.height) {
            this.velocity.y = 0;
            this.controls.getObject().position.y = this.height;
            this.canJump = true;
        }
    }
}

export { FirstPersonControls };