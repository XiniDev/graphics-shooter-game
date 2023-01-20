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

        this.floorDetector = new THREE.Raycaster(new THREE.Vector3(), v3Direction('down'), 0, 10);

        const min = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
        min.sub(new THREE.Vector3(5, 20, 5));
    
        const max = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
        max.add(new THREE.Vector3(5, 20, 5));
    
        this.aabb = new THREE.Box3(min, max);
        // this.aabbh = new THREE.Box3Helper(aabb);

        camera.add(this.aabb);

        this.debug = {
            "flight" : true,
        }

        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    onKeyDown(event) {
        switch (event.code) {
            // movement
            case "KeyW":
                // W
                this.moveForward = true;
                break;
            case "KeyS":
                // S
                this.moveBackward = true;
                break;
            case "KeyD":
                // D
                this.moveRight = true;
                break;
            case "KeyA":
                // A
                this.moveLeft = true;
                break;
            case "ShiftLeft":
                // Left Shift
                if (this.canSprint) this.isSprinting = true;
                break;
            // jump
            case "Space":
                // Space
                if (this.canJump) this.velocity.y += ACCELERATION.y;
                this.canJump = false;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            // movement
            case "KeyW":
                // W
                this.moveForward = false;
                break;
            case "KeyS":
                // S
                this.moveBackward = false;
                break;
            case "KeyD":
                // D
                this.moveRight = false;
                break;
            case "KeyA":
                // A
                this.moveLeft = false;
                break;
            // sprint  
            case "ShiftLeft":
                // Left Shift
                this.isSprinting = false;
                break;
        }
    }

    update(delta, floor, isAiming, scene) {
        this.sprintCheck(isAiming);
        this.applyFriction(delta);
        this.applyForce(delta, isAiming);
        this.movement(delta);
        if (this.debug["flight"] == false) {
            this.fall(delta);
            this.detectFloor(delta, floor);
        }
        // check if intersect floor
        this.floorDetector.ray.origin.copy(this.controls.getObject().position);
        this.floorDetector.ray.origin.y -= 10;
        let a = new THREE.ArrowHelper(this.floorDetector.ray.direction, this.floorDetector.ray.origin, 300, 0xff0000)
        scene.add(a)
        // let intersection = new THREE.Vector3();
        // this.floorDetector.ray.intersectPlane(floor.mesh, intersection);
        console.log(this.floorDetector.intersectObjects(floor.mesh, true)); // work in progress
    }

    sprintCheck(isAiming) {
        // cannot sprint if aiming
        if (isAiming) {
            this.canSprint = false;
            this.isSprinting = false;
        }
        else this.canSprint = true;
    }

    applyFriction(delta) {
        let decceleration = new THREE.Vector3(0, 0, 0)
        // decceleration factors in velocity because decceleration is a fading gradient based on previous values, also this ensures no movement if velocity is 0
        decceleration.x = this.velocity.x * DECCELERATION.x;
        decceleration.z = this.velocity.z * DECCELERATION.z;

        // fall down speed
        if (this.debug["flight"] == false) decceleration.y = DECCELERATION.y * GRAVITY;

        decceleration = decceleration.multiplyScalar(delta);

        this.velocity.add(decceleration);
    }

    applyForce(delta, isAiming) {
        let acceleration = new THREE.Vector3(0, 0, 0);
        // acceleration depends on the direction of movement chosen by the player, but cannot simultaneously happen on two polar opposite directions
        acceleration.x = (Number(this.moveRight) - Number(this.moveLeft)) * ACCELERATION.x;
        acceleration.z = (Number(this.moveForward) - Number(this.moveBackward)) * ACCELERATION.z;

        // sprinting cannot happen when player is moving backwards, or purely strafing, it can only happen when moving forwards
        if (this.isSprinting && this.moveForward) acceleration.z *= SPRINTSPEED;

        // half speed if aiming down sight
        if (isAiming) acceleration.multiplyScalar(0.5);

        acceleration = acceleration.multiplyScalar(delta);

        this.velocity.add(acceleration);
    }

    movement(delta) {
        // calculation of foward direction of movement based on the rotation of the camera
        let forward = this.getDirection(v3Direction('back'));
        if (this.debug["flight"] == false) forward.y = 0;
        forward.normalize();
        forward.multiplyScalar(this.velocity.z * delta);
        
        let right = this.getDirection(v3Direction('right'));
        if (this.debug["flight"] == false) right.y = 0;
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

    detectFloor(delta, floor) {

        if (this.controls.getObject().position.y < this.height) {
            this.velocity.y = 0;
            this.controls.getObject().position.y = this.height;
            this.canJump = true;
        }
    }
}

export { FirstPersonControls };