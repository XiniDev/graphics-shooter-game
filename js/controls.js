import * as THREE from './three/three.modules.js';
import { PointerLockControls } from './three/addons/PointerLockControls.js';
import { DEBUG, v3Direction, worldBounds, changeTexture, floorIntersection, NORMAL_LOOT, NORMAL_LOOT_DESCRIPTIONS, RARE_LOOT, RARE_LOOT_DESCRIPTIONS, addScore } from './utils.js';

const GRAVITY = 9.8;
const DECCELERATION = new THREE.Vector3(-10, -16, -10);
const ACCELERATION = new THREE.Vector3(500, 60, 500);
const SPRINTSPEED = 2;
const INTERACT_DISTANCE = 20;

const TOTEM_UNLIT_TEXTURE = new THREE.TextureLoader().load('../assets/models/totem/textures/Totem_Texture_Unlit.png');
const TOTEM_LIT_TEXTURE = new THREE.TextureLoader().load('../assets/models/totem/textures/Totem_Texture_Lit.png');

class FirstPersonControls {
    constructor(camera) {
        this.height = 20;

        this.maxHealth = 10;
        this.health = this.maxHealth;
        this.armor = 2;

        this.playerHit = false;
        this.playerHitCD = 0;
        this.playerHitCDMax = 200;

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

        // player items
        this.stackingItems = {}
        this.initItems();

        // additional stuff
        this.additional = {
            "health": 0,
            "armor": 0,
            "speed": 0,
            "damage": 0,
            "fireRate": 0,
            "gunSpread": 0,
            "shotSpeed": 0,
            "regen" : 0,
            "bulletSize" : 0,
        }

        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    initItems() {
        for (let i = 0; i < NORMAL_LOOT.length; i++) {
            this.stackingItems[NORMAL_LOOT[i]] = 0;
        }
        for (let i = 0; i < RARE_LOOT.length; i++) {
            this.stackingItems[RARE_LOOT[i]] = 0;
        }
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

    update(delta, isAiming, currentCrates, currentTotems) {
        this.applyItems();
        this.applyBoundingBox();
        this.currentInteractables(currentCrates, currentTotems);
        this.changeHP(delta);
        this.resetPlayerHit();
        this.sprintCheck(isAiming);
        this.applyFriction(delta);
        this.applyForce(delta, isAiming);
        this.movement(delta);
        this.rayUpdate();
        if (DEBUG["flight"] == false) {
            this.fall(delta);
            this.detectFloor();
        }
    }

    applyItems() {
        // Traveler's Boots + speed
        this.additional["speed"] = this.stackingItems["Traveler's Boots"] * 20;

        // Euan's Heart + max hp
        this.additional["health"] = this.stackingItems["Euan's Heart"] * 2;

        // Giant's Plating + armor
        this.additional["armor"] = this.stackingItems["Giant's Plating"] * 0.5;

        // AP-Rounds + damage
        this.additional["damage"] = this.stackingItems["AP-Rounds"] * 0.2;

        // Scrap Gun Parts + fire rate
        this.additional["fireRate"] = Math.pow(1.1, this.stackingItems["Scrap Gun Parts"]);
        
        // Electric Stabilizer - gun spread
        this.additional["gunSpread"] = Math.pow(0.9, this.stackingItems["Electric Stabilizer"]);

        // Modified Muzzle + shot speed
        this.additional["shotSpeed"] = Math.pow(1.1, this.stackingItems["Modified Muzzle"]);

        // Healing Mushrooms + regeneration
        this.additional["regen"] = this.stackingItems["Healing Mushrooms"] * 1;

        // Magnifying Glass + bullet size
        this.additional["bulletSize"] = this.stackingItems["Magnifying Glass"] * 1;
    }

    applyBoundingBox() {
        this.collisionBox.copy(this.capsule.geometry.boundingBox).applyMatrix4(this.capsule.matrixWorld);
    }

    currentInteractables(currentCrates, currentTotems) {
        this.currentCrates = currentCrates;
        this.currentTotems = currentTotems;
    }

    changeHP(delta) {
        this.armor = 2 + this.additional["armor"];
        this.maxHealth = 10 + this.additional["health"];

        if (!this.playerHit && this.health < this.maxHealth) this.health += 0.1 * delta * (this.additional["regen"] + 1);

        let hp = document.getElementById('hp');
        hp.style.width = String(100 * this.health / this.maxHealth - 1).concat("%");
        if (this.health / this.maxHealth > 0.3) hp.style.background = "#3DED97";
        else hp.style.background = "#B90E0A";
    }

    resetPlayerHit() {
        if (this.playerHit) {
            if (this.playerHitCD < this.playerHitCDMax) this.playerHitCD += 1;
            else {
                this.playerHitCD = 0;
                this.playerHit = false;
            }
        }
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
        if (DEBUG["flight"] == false) decceleration.y = DECCELERATION.y * GRAVITY;

        decceleration = decceleration.multiplyScalar(delta);

        this.velocity.add(decceleration);
    }

    applyForce(delta, isAiming) {
        let acceleration = new THREE.Vector3(0, 0, 0);
        // acceleration depends on the direction of movement chosen by the player, but cannot simultaneously happen on two polar opposite directions
        acceleration.x = (Number(this.moveRight) - Number(this.moveLeft)) * (ACCELERATION.x + this.additional["speed"]);
        acceleration.z = (Number(this.moveForward) - Number(this.moveBackward)) * (ACCELERATION.z + this.additional["speed"]);

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
        if (DEBUG["flight"] == false) forward.y = 0;
        forward.normalize();
        forward.multiplyScalar(this.velocity.z * delta);
        
        let right = this.getDirection(v3Direction('right'));
        if (DEBUG["flight"] == false) right.y = 0;
        right.normalize();
        right.multiplyScalar(this.velocity.x * delta);

        let controlsObject = this.controls.getObject()
        
        controlsObject.position.add(forward).add(right);

        worldBounds(controlsObject);
    }

    rayUpdate() {
        const controlsObject = this.controls.getObject();

        // ray for floor
        this.floorDetector.ray.origin.copy(controlsObject.position);
        this.floorDetector.ray.origin.y -= this.height / 2;
        
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
        let intersection = floorIntersection(this.floorDetector, this.floorTrigs);
        // console.log(intersection);

        if (this.controls.getObject().position.y < intersection.y + this.height) {
            this.velocity.y = 0;
            this.controls.getObject().position.y = intersection.y + this.height;
            this.canJump = true;
        }
    }

    interact() {
        for (let i = 0; i < this.currentCrates.length; i++) {
            let intersection = new THREE.Vector3();
            this.interactDetector.ray.intersectBox(this.currentCrates[i]["box"], intersection);
            if (this.interactDetector.ray.origin.distanceTo(intersection) <= INTERACT_DISTANCE && !this.currentCrates[i]["looted"]) {
                this.currentCrates[i]["looted"] = true;
                this.loot(this.currentCrates[i]["type"]);
                break;
            }
        }

        for (let i = 0; i < this.currentTotems.length; i++) {
            let intersection = new THREE.Vector3();
            this.interactDetector.ray.intersectBox(this.currentTotems[i]["box"], intersection);
            if (this.interactDetector.ray.origin.distanceTo(intersection) <= INTERACT_DISTANCE && !this.currentTotems[i]["lit"]) {
                this.currentTotems[i]["lit"] = true;
                this.totemChange(this.currentTotems[i]["data"]);
                break;
            }
        }
    }

    loot(type) {
        if (type == "Crate_N") {
            const chance = Math.floor(Math.random() * NORMAL_LOOT.length);
            const item = NORMAL_LOOT[chance];
            const description = NORMAL_LOOT_DESCRIPTIONS[item];

            // set texts to corresponding item
            document.getElementById("item-popup").style.display = 'block';
            let texts = document.getElementById("item-popup").children;
            texts[0].innerHTML = item;
            texts[1].innerHTML = description;

            // remove texts after a while
            setTimeout(function() {
                document.getElementById("item-popup").style.display = 'none';
            }, 2000);

            // add item to stack if stack
            for (const [key, value] of Object.entries(this.stackingItems)) {
                if (item == key) this.stackingItems[key] += 1;
            }
        }
        else if (type == "Crate_R") {
            const chance = Math.floor(Math.random() * RARE_LOOT.length);
            const item = RARE_LOOT[chance];
            const description = RARE_LOOT_DESCRIPTIONS[item];

            // set texts to corresponding item
            document.getElementById("item-popup").style.display = 'block';
            let texts = document.getElementById("item-popup").children;
            texts[0].innerHTML = item;
            texts[1].innerHTML = description;

            // remove texts after a while
            setTimeout(function() {
                document.getElementById("item-popup").style.display = 'none';
            }, 2000);

            // add item to stack if stack
            for (const [key, value] of Object.entries(this.stackingItems)) {
                if (item == key) this.stackingItems[key] += 1;
            }
        }
        else if (type == "Crate_A") {
            // adds two of a random item
            const chance = Math.floor(Math.random() * (NORMAL_LOOT.length + RARE_LOOT.length));
            let item, description;
            if (chance < NORMAL_LOOT.length) {
                item = NORMAL_LOOT[chance];
                description = NORMAL_LOOT_DESCRIPTIONS[item];
            }
            else {
                item = RARE_LOOT[chance - NORMAL_LOOT.length];
                description = RARE_LOOT_DESCRIPTIONS[item];
            }

            // set texts to corresponding item
            document.getElementById("item-popup").style.display = 'block';
            let texts = document.getElementById("item-popup").children;
            texts[0].innerHTML = item.concat(" x 2!");
            texts[1].innerHTML = description;

            // remove texts after a while
            setTimeout(function() {
                document.getElementById("item-popup").style.display = 'none';
            }, 2000);

            // add item to stack if stack
            for (const [key, value] of Object.entries(this.stackingItems)) {
                if (item == key) this.stackingItems[key] += 2;
            }
        }
        // console.log(item);
        console.log(this.stackingItems);
    }

    totemChange(totem) {
        changeTexture(totem.children.find((child) => child.name === "Totem"), TOTEM_LIT_TEXTURE);
        totem.children.find((child) => child.name === "Orb").visible = true;
        addScore(1000);
    }
}

export { FirstPersonControls };