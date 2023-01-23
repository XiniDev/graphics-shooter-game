import * as THREE from './three/three.modules.js';
import { worldLevel, DEBUG, v3Direction, worldBounds, changeTexture, floorIntersection, playerTakeDamage, enemiesCheckPlayer, enemiesCheckHit, enemiesCheckDeath, addScore } from './utils.js';

const GHOST_MODEL = new URL('../assets/models/enemies/Ghost.glb', import.meta.url);
const ROCKY_MODEL = new URL('../assets/models/enemies/Rocky.glb', import.meta.url);

const MAX_GHOSTS = {
    1: 5,
    2: 6,
};

const MAX_ROCKYS = {
    1: 5,
    2: 6,
};

const SPAWN_RATE = {
    "ghost" : 0.0015,
    "rocky" : 0.001,
}

const SPAWN_RANGE = {
    "ghost" : 50,
    "rocky" : 40,
};

const DETECT_RANGE = {
    "ghost" : 200,
    "rocky" : 150,
}

const TRIGGERED_MULTIPLIER = {
    "ghost": 3,
    "rocky": 3,
}

const SPEED = {
    "ghost" : new THREE.Vector3(10, -10, 5),
    "rocky" : new THREE.Vector3(10, -20, 10),
};

const DAMAGE = {
    "ghost" : 2,
    "rocky" : 3,
};

const HEALTH = {
    "ghost" : 20,
    "rocky" : 30,
};

const NORMAL_TEXTURES = {
    "ghost" : new THREE.TextureLoader().load('../assets/models/enemies/textures/Ghost_Texture.png'),
    "rocky" : new THREE.TextureLoader().load('../assets/models/enemies/textures/Rocky_Texture.png'),
};

const HIT_TEXTURES = {
    "ghost" : new THREE.TextureLoader().load('../assets/models/enemies/textures/Ghost_Texture_Hit.png'),
    "rocky" : new THREE.TextureLoader().load('../assets/models/enemies/textures/Rocky_Texture_Hit.png'),
};

class GhostSpawner {
    constructor(loader) {
        this.ghostModel;
        this.ghostHoverHeight = 20;
        this.currentGhosts = [];

        this.loadGhost(loader);
    }

    update(delta, totemPosition, player, floor, bullets, scene) {
        if (typeof this.ghostModel !== "undefined") {
            this.updateAllRays();
            this.moveAllGhosts(delta, totemPosition, player.controls.getObject().position, floor);
            this.checkPlayer(player);
            this.checkHit(bullets, scene);
            this.checkDeath(scene);
        }
    }
    
    updateAllRays() {
        for (let i = 0; i < this.currentGhosts.length; i++) {
            this.currentGhosts[i]["floorDetector"].ray.origin.copy(this.currentGhosts[i]["data"].position);
        }
    }

    moveAllGhosts(delta, totemPosition, playerPos, floor) {
        for (let i = 0; i < this.currentGhosts.length; i++) {
            let ghost = this.currentGhosts[i]["data"];
            let floorDetector = this.currentGhosts[i]["floorDetector"];
            let pos = ghost.position.clone();
            if (Math.sqrt(pos.distanceToSquared(playerPos)) <= DETECT_RANGE["ghost"]) this.currentGhosts[i]["triggered"] = true;
            if (this.currentGhosts[i]["triggered"]) {
                this.ghostLookAt(ghost, playerPos);
                this.moveGhost(delta, true, ghost, floorDetector, floor);
            }
            else {
                const turnRate = 0.001;
                if (Math.random() > 0.99 + (0.01 - turnRate)) {
                    const degree = Math.random() * Math.PI * 2;
                    pos.x += Math.cos(degree) * 1;
                    pos.z += Math.sin(degree) * 1;
                    if (Math.sqrt(pos.distanceToSquared(totemPosition)) > 70) this.ghostLookAt(ghost, totemPosition);
                    else this.ghostLookAt(ghost, pos);
                }
                this.moveGhost(delta, false, ghost, floorDetector, floor);
            }
            this.currentGhosts[i]["box"].copy(new THREE.Box3().setFromObject(ghost, true));
        }
    }

    ghostLookAt(ghost, pos) {
        ghost.lookAt(pos);
        ghost.rotateY(-Math.PI / 2);
    }
    
    moveGhost(delta, triggered, ghost, floorDetector, floor) {
        // ghosts will move sideways instead of only fowards so it makes the game more interesting
        // though because of the way the ghosts are oriented in the blender mesh, fowards and sideways movement are swapped (so ghost is first rotated, then add position on swapped x and z)
        let forward = v3Direction('right').applyQuaternion(ghost.quaternion);
        forward.y = 0;
        forward.normalize();
        forward.multiplyScalar(SPEED["ghost"].x * delta);
        if (triggered) forward.multiplyScalar(TRIGGERED_MULTIPLIER["ghost"] + worldLevel);

        let right = v3Direction('back').applyQuaternion(ghost.quaternion);
        right.y = 0;
        right.normalize();
        right.multiplyScalar(SPEED["ghost"].z * delta);
        if (triggered) right.multiplyScalar((TRIGGERED_MULTIPLIER["ghost"] + worldLevel) * 2);
        
        ghost.position.add(forward)
        if (triggered) ghost.position.add(right);

        this.moveY(delta, ghost, floorDetector, floor);

        worldBounds(ghost);
    }

    moveY(delta, ghost, floorDetector, floor) {
        ghost.position.y += SPEED["ghost"].y * delta;

        let intersection = floorIntersection(floorDetector, floor.triangles);

        if (ghost.position.y < intersection.y + this.ghostHoverHeight) ghost.position.y = intersection.y + this.ghostHoverHeight;
    }

    checkPlayer(player) {
        let ghost = enemiesCheckPlayer(player.collisionBox, this.currentGhosts);
        if (ghost !== null) {
            if (!player.playerHit) {
                player.playerHit = true;
                console.log("boo!");
                playerTakeDamage(player, DAMAGE["ghost"] * worldLevel);
            }
        }
    }

    checkHit(bullets, scene) {
        let hitList = enemiesCheckHit(bullets, this.currentGhosts);
        if (hitList.length > 0) {
            for (let i = 0; i < hitList.length; i++) {
                let ghost = hitList[i][0], bullet = hitList[i][1];
                ghost["triggered"] = true;
                ghost["health"] -= bullet["damage"];

                // take damage flash
                changeTexture(ghost["data"].children[0], HIT_TEXTURES["ghost"]);

                setTimeout(function() {
                    changeTexture(ghost["data"].children[0], NORMAL_TEXTURES["ghost"]);
                }, 300);
            }
        }
    }

    checkDeath(scene) {
        let deadEnemies = enemiesCheckDeath(this.currentGhosts);
        if (deadEnemies.length > 0) {
            for (let i = 0; i < deadEnemies.length; i++) {
                let ghost = deadEnemies[i];
                scene.remove(ghost["data"]);
                if (DEBUG["box"]) scene.remove(ghost["boxh"]);
                addScore(80);
            }
        }
    }

    spawnEnemies(totemPosition, floor, scene) {
        if (typeof this.ghostModel !== "undefined") {
            this.spawnGhosts(totemPosition, floor, scene);
        }
    }

    spawnGhosts(totemPosition, floor, scene) {
        // the spawn rate of ghosts on time passing and limit the amount of ghosts spawned at a time
        if (Math.random() > 0.99 + (0.01 - SPAWN_RATE["ghost"] * worldLevel) && this.currentGhosts.length < MAX_GHOSTS[worldLevel]) {
            // spawn position based on indices, make sure that they don't spawn at the exact edge of the map
            const distance = Math.random() * (SPAWN_RANGE["ghost"] - 30) + 30;
            const degree = Math.random() * Math.PI * 2;
            let pos = totemPosition.clone();
            pos.x += Math.cos(degree) * distance;
            pos.z += Math.sin(degree) * distance;

            // make sure that wherever the ghost spawns it will spawn on top of the floor
            const rayHeight = floor.maxY - floor.minY;
            pos.y += floor.maxY - floor.minY;
            let floorDetector = new THREE.Raycaster(new THREE.Vector3(), v3Direction('down'), 0, rayHeight);
            floorDetector.ray.origin.copy(pos);
            let intersection = floorIntersection(floorDetector, floor.triangles);
            pos.y = intersection.y + this.ghostHoverHeight;
            floorDetector.ray.origin.copy(pos);

            // debug
            if (DEBUG["ray"]) scene.add(new THREE.ArrowHelper(floorDetector.ray.direction, floorDetector.ray.origin, 300, 0xff0000));

            // random rotation
            let rot = Math.random() * Math.PI * 2;
            
            // spawning
            const ghost = this.ghostModel.clone();
            ghost.position.copy(pos);
            ghost.rotateY(rot);

            // bounding box
            const box = new THREE.Box3().setFromObject(ghost, true);
                
            // debug
            let boxh;
            if (DEBUG["box"]) {
                boxh = new THREE.Box3Helper(box);
                boxh.updateMatrixWorld(true);
                scene.add(boxh);
            }

            // store values
            this.currentGhosts.push({
                "data" : ghost,
                "box" : box,
                "boxh" : boxh,
                "floorDetector" : floorDetector,
                "triggered" : false,
                "health" : HEALTH["ghost"] * worldLevel,
            });
            scene.add(ghost);
        }
    }

    loadGhost(loader) {
        // load ghost asset
        let ghostLoader = (gltf) => {
            const model = gltf.scene;
            const ghostMesh = model.children.find((child) => child.name === "Ghost");
            const eye1Mesh = model.children.find((child) => child.name === "Eye1");
            const eye2Mesh = model.children.find((child) => child.name === "Eye2");

            const mesh = new THREE.Group();
            mesh.name = "ghost";
            mesh.add(ghostMesh);
            mesh.add(eye1Mesh);
            mesh.add(eye2Mesh);

            mesh.scale.set(mesh.scale.x * 10, mesh.scale.y * 10, mesh.scale.z * 10);
            this.ghostModel = mesh;
        };
        loader.load(GHOST_MODEL.href, ghostLoader);
    }
}

export { GhostSpawner }

class RockySpawner {
    constructor(loader) {
        this.rockyModel;
        this.rockyHeight = 5;
        this.currentRockys = [];

        this.loadRocky(loader);
    }

    update(delta, totemPosition, player, floor, bullets, scene) {
        if (typeof this.rockyModel !== "undefined") {
            this.updateAllRays();
            this.moveAllRockys(delta, totemPosition, player.controls.getObject().position, floor);
            this.checkPlayer(player);
            this.checkHit(bullets, scene);
            this.checkDeath(scene);
        }
    }
    
    updateAllRays() {
        for (let i = 0; i < this.currentRockys.length; i++) {
            this.currentRockys[i]["floorDetector"].ray.origin.copy(this.currentRockys[i]["data"].position);
        }
    }

    moveAllRockys(delta, totemPosition, playerPos, floor) {
        for (let i = 0; i < this.currentRockys.length; i++) {
            let rocky = this.currentRockys[i]["data"];
            let floorDetector = this.currentRockys[i]["floorDetector"];
            let pos = rocky.position.clone();
            if (Math.sqrt(pos.distanceToSquared(playerPos)) <= DETECT_RANGE["rocky"]) this.currentRockys[i]["triggered"] = true;
            if (this.currentRockys[i]["triggered"]) {
                this.rockyLookAt(rocky, playerPos);
                this.moveRocky(delta, true, rocky, floorDetector, floor);
            }
            else {
                const turnRate = 0.001;
                if (Math.random() > 0.99 + (0.01 - turnRate)) {
                    const degree = Math.random() * Math.PI * 2;
                    pos.x += Math.cos(degree) * 1;
                    pos.z += Math.sin(degree) * 1;
                    if (Math.sqrt(pos.distanceToSquared(totemPosition)) > 70) this.rockyLookAt(rocky, totemPosition);
                    else this.rockyLookAt(rocky, pos);
                }
                this.moveRocky(delta, false, rocky, floorDetector, floor);
            }
            this.currentRockys[i]["box"].copy(new THREE.Box3().setFromObject(rocky, true));
        }
    }

    rockyLookAt(rocky, pos) {
        rocky.lookAt(pos);
        rocky.rotateY(Math.PI);
    }
    
    moveRocky(delta, triggered, rocky, floorDetector, floor) {
        // rockys will move sideways randomly instead of just fowards
        // though because of the way the rockys are oriented in the blender mesh, fowards and sideways movement are swapped (so rocky is first rotated, then add position on swapped x and z)
        let forward = v3Direction('back').applyQuaternion(rocky.quaternion);
        forward.y = 0;
        forward.normalize();
        forward.multiplyScalar(SPEED["rocky"].z * delta);
        if (triggered) forward.multiplyScalar(TRIGGERED_MULTIPLIER["rocky"] + worldLevel);
        
        rocky.position.add(forward);
        if (triggered) rocky.children[0].rotateX(3 * delta * worldLevel * 2);

        this.moveY(delta, rocky, floorDetector, floor);

        worldBounds(rocky);
    }

    moveY(delta, rocky, floorDetector, floor) {
        rocky.position.y += SPEED["rocky"].y * delta;

        let intersection = floorIntersection(floorDetector, floor.triangles);

        if (rocky.position.y < intersection.y + this.rockyHeight) rocky.position.y = intersection.y + this.rockyHeight;
    }

    checkPlayer(player) {
        let rocky = enemiesCheckPlayer(player.collisionBox, this.currentRockys);
        if (rocky !== null) {
            if (!player.playerHit) {
                player.playerHit = true;
                console.log("rawr!");
                playerTakeDamage(player, DAMAGE["rocky"] * worldLevel);
            }
        }
    }

    checkHit(bullets, scene) {
        let hitList = enemiesCheckHit(bullets, this.currentRockys);
        if (hitList.length > 0) {
            for (let i = 0; i < hitList.length; i++) {
                let rocky = hitList[i][0], bullet = hitList[i][1];
                rocky["triggered"] = true;
                rocky["health"] -= bullet["damage"];

                // take damage flash
                changeTexture(rocky["data"].children[0], HIT_TEXTURES["rocky"]);

                setTimeout(function() {
                    changeTexture(rocky["data"].children[0], NORMAL_TEXTURES["rocky"]);
                }, 300);
            }
        }
    }

    checkDeath(scene) {
        let deadEnemies = enemiesCheckDeath(this.currentRockys);
        if (deadEnemies.length > 0) {
            for (let i = 0; i < deadEnemies.length; i++) {
                let rocky = deadEnemies[i];
                scene.remove(rocky["data"]);
                if (DEBUG["box"]) scene.remove(rocky["boxh"]);
                addScore(120);
            }
        }
    }

    spawnEnemies(totemPosition, floor, scene) {
        if (typeof this.rockyModel !== "undefined") {
            this.spawnRockys(totemPosition, floor, scene);
        }
    }

    spawnRockys(totemPosition, floor, scene) {
        // the spawn rate of rockys on time passing and limit the amount of rockys spawned at a time
        if (Math.random() > 0.99 + (0.01 - SPAWN_RATE["rocky"] * worldLevel) && this.currentRockys.length < MAX_ROCKYS[worldLevel]) {
            // spawn position based on indices, make sure that they don't spawn at the exact edge of the map
            const distance = Math.random() * (SPAWN_RANGE["rocky"] - 30) + 30;
            const degree = Math.random() * Math.PI * 2;
            let pos = totemPosition.clone();
            pos.x += Math.cos(degree) * distance;
            pos.z += Math.sin(degree) * distance;

            // make sure that wherever the rocky spawns it will spawn on top of the floor
            const rayHeight = floor.maxY - floor.minY;
            pos.y += floor.maxY - floor.minY;
            let floorDetector = new THREE.Raycaster(new THREE.Vector3(), v3Direction('down'), 0, rayHeight);
            floorDetector.ray.origin.copy(pos);
            let intersection = floorIntersection(floorDetector, floor.triangles);
            pos.y = intersection.y + this.rockyHeight;
            floorDetector.ray.origin.copy(pos);

            // debug
            if (DEBUG["ray"]) scene.add(new THREE.ArrowHelper(floorDetector.ray.direction, floorDetector.ray.origin, 300, 0xff0000));

            // random rotation
            let rot = Math.random() * Math.PI * 2;
            
            // spawning
            const rocky = this.rockyModel.clone();
            rocky.position.copy(pos);
            rocky.rotateY(rot);

            // bounding box
            const box = new THREE.Box3().setFromObject(rocky, true);
                
            // debug
            let boxh;
            if (DEBUG["box"]) {
                boxh = new THREE.Box3Helper(box);
                boxh.updateMatrixWorld(true);
                scene.add(boxh);
            }

            // store values
            this.currentRockys.push({
                "data" : rocky,
                "box" : box,
                "boxh" : boxh,
                "floorDetector" : floorDetector,
                "triggered" : false,
                "health" : HEALTH["rocky"] * worldLevel,
            });
            scene.add(rocky);
        }
    }

    loadRocky(loader) {
        // load rocky asset
        let rockyLoader = (gltf) => {
            const model = gltf.scene;
            const rockyMesh = model.children.find((child) => child.name === "Rocky");

            const mesh = new THREE.Group();
            mesh.name = "rocky";
            mesh.add(rockyMesh);

            mesh.scale.set(mesh.scale.x * 10, mesh.scale.y * 10, mesh.scale.z * 10);
            this.rockyModel = mesh;
        };
        loader.load(ROCKY_MODEL.href, rockyLoader);
    }
}

export { RockySpawner }