import * as THREE from './three/three.modules.js';
import { PointerLockControls } from './three/addons/PointerLockControls.js';
import { v3Direction } from './utils.js';

const GRAVITY = 9.8
const DECCELERATION = new THREE.Vector3(-10, -16, -10)
const ACCELERATION = new THREE.Vector3(500, 60, 500)
const SPRINTSPEED = 2
const INTERACT_DISTANCE = 20

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
        this.interactDetector = new THREE.Raycaster(new THREE.Vector3(), v3Direction('back'), 0, 20);

        this.floorVerts = [];
        this.floorTrigs = [];

        // player capsule
        const capGeo = new THREE.CapsuleGeometry(5, 20, 5, 10);
        const capMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.capsule = new THREE.Mesh(capGeo, capMat);
        camera.add( this.capsule );
        this.capsule.position.z -= 3;

        // player bounding box
        this.collisionBox = new THREE.Box3();
        this.capsule.geometry.computeBoundingBox();

        this.debug = {
            "flight" : false,
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
            case "KeyE":
                // E
                this.interact();
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

    setFloorValues(floor) {
        this.floorVerts = floor.vertices;
        this.floorIndices = floor.indices;
        this.floorTrigs = floor.triangles;
    }

    // addCrateManager(crateManager) {
    //     this.crateManager = crateManager;
    // }

    update(delta, isAiming, currentCrates) {
        this.applyBoundingBox();
        this.currentInteractables(currentCrates);
        this.sprintCheck(isAiming);
        this.applyFriction(delta);
        this.applyForce(delta, isAiming);
        this.movement(delta);
        this.rayUpdate();
        if (this.debug["flight"] == false) {
            this.fall(delta);
            this.detectFloor();
        }
    }

    applyBoundingBox() {
        this.collisionBox.copy(this.capsule.geometry.boundingBox).applyMatrix4(this.capsule.matrixWorld);
    }

    currentInteractables(currentCrates) {
        this.currentCrates = currentCrates;
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

    rayUpdate() {
        const controlsObject = this.controls.getObject();
        // ray for floor
        this.floorDetector.ray.origin.copy(controlsObject.position);
        this.floorDetector.ray.origin.y -= 10;
        
        // ray for interact
        this.interactDetector.ray.origin.copy(controlsObject.position);
        this.interactDetector.ray.direction.copy(this.getDirection(v3Direction('back')));
    }

    getDirection(vector) {
        return vector.applyQuaternion(this.controls.getObject().quaternion);
    }

    fall(delta) {
        this.controls.getObject().position.y += this.velocity.y * delta;
    }

    detectFloor() {
        let intersection = new THREE.Vector3();

        // check for intersections using triangles stored from before
        for (let i = 0; i < this.floorTrigs.length; i++) {
            const a = this.floorTrigs[i].a;
            const b = this.floorTrigs[i].b;
            const c = this.floorTrigs[i].c;
            this.floorDetector.ray.intersectTriangle(a, b, c, false, intersection);
        }

        // console.log(intersection);

        if (this.controls.getObject().position.y < intersection.y + this.height) {
            this.velocity.y = 0;
            this.controls.getObject().position.y = intersection.y + this.height;
            this.canJump = true;
        }
    }

    interact() {
        let intersection = new THREE.Vector3();
        for (let i = 0; i < this.currentCrates.length; i++) {
            this.interactDetector.ray.intersectBox(this.currentCrates[i]["box"], intersection);
            if (this.interactDetector.ray.origin.distanceTo(intersection) <= INTERACT_DISTANCE) {
                this.currentCrates[i]["looted"] = true;
                console.log(intersection);
                break;
            }
        }
    }
}

export { FirstPersonControls };