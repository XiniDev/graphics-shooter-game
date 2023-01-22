import * as THREE from './three/three.modules.js';
import { DEBUG } from './utils.js';

const CRATE_MODELS = {
    "Crate_N" : new URL('../assets/models/crates/Normal_Crate.glb', import.meta.url),
    "Crate_A" : new URL('../assets/models/crates/Active_Crate.glb', import.meta.url),
    "Crate_R" : new URL('../assets/models/crates/Rare_Crate.glb', import.meta.url),
};

const SPAWN_RATES = {
    "Crate_N" : 0.7,
    "Crate_A" : 0.2,
    "Crate_R" : 0.1,
};

const MAX_CRATES = 5;
const DISAPPEAR_CD = 5;

class CrateManager {
    constructor(loader) {
        this.crateModels = {};
        this.currentCrates = [];

        for (const [key, value] of Object.entries(CRATE_MODELS)) {
            this.loadCrates(key, loader);
        }
    }

    update(delta, floor, scene) {
        this.spawnCrate(floor, scene);
        this.crateAnimation(delta, scene);
    }

    spawnCrate(floor, scene) {
        if (Object.values(this.crateModels).length == 3) {
            // the spawn rate of any loot crate at all (if they even spawn at all, not type of loot crate spawn chance)
            if (Math.random() > 0.1) {
                // type of loot crate spawn chance
                let chance = Math.random();
                let type;

                // chance check
                if (chance < SPAWN_RATES["Crate_R"]) type = "Crate_R";
                else if (chance < SPAWN_RATES["Crate_R"] + SPAWN_RATES["Crate_A"]) type = "Crate_A";
                else type = "Crate_N";
                
                // spawn position based on indices, make sure that they don't spawn at the exact edge of the map
                let ind;
                do {
                    ind = Math.floor(Math.random() * floor.indices.length);
                } while (ind == floor.minIndex || ind == floor.maxIndex);
                let pos = new THREE.Vector3().fromBufferAttribute(floor.geometry.attributes.position, floor.indices[ind]);

                // limit the amount of crates spawned at a time
                if (this.currentCrates.length < MAX_CRATES) {
                    const data = this.crateModels[type].clone();
                    data.position.copy(pos);

                    // bounding box
                    const box = new THREE.Box3().setFromObject(data);
                    
                    // debug
                    let boxh;
                    if (DEBUG["box"]) {
                        boxh = new THREE.Box3Helper(box);
                        scene.add(boxh);
                    }

                    // store values
                    this.currentCrates.push({
                        "type" : type,
                        "data" : data,
                        "box" : box,
                        "boxh" : boxh,
                        "looted" : false,
                        "timer" : DISAPPEAR_CD,
                    });
                    scene.add(data);
                }
            }
        }
    }

    crateAnimation(delta, scene) {
        for (let i = 0; i < this.currentCrates.length; i++) {
            const glow = this.currentCrates[i]["data"].children.find((child) => child.name === "Glow");
            if (this.currentCrates[i]["timer"] <= 0) {
                scene.remove(this.currentCrates[i]["data"]);
                if (this.debug["box"]) scene.remove(this.currentCrates[i]["boxh"]);
                this.currentCrates.splice(i, 1);
            }
            else if (this.currentCrates[i]["looted"]) {
                glow.rotateY(6 * delta);
                if (glow.scale.x > 0) glow.scale.set(glow.scale.x -= 0.5 * delta, glow.scale.y -= 0.5 * delta, glow.scale.z -= 0.5 * delta);
                if (glow.children[0].intensity > 0) glow.children[0].intensity -= 2 * delta;
                if (this.currentCrates[i]["timer"] > 0) this.currentCrates[i]["timer"] -= 1 * delta;
            } else glow.rotateY(1 * delta);
        }
    }

    loadCrates(type, loader) {
        // load crate asset
        let crateLoader = (gltf) => {
            const model = gltf.scene;
            const crateMesh = model.children.find((child) => child.name === "Crate");
            const glowMesh = model.children.find((child) => child.name === "Glow");

            // glow mesh light
            let light;
            if (type == "Crate_N") light = new THREE.PointLight(0x63E2FF, 4, 10);
            else if (type == "Crate_A") light = new THREE.PointLight(0xFFCE7A, 4, 10);
            else light = new THREE.PointLight(0xD65DFF, 4, 10);
            glowMesh.add(light);

            const mesh = new THREE.Group();
            mesh.add(crateMesh);
            mesh.add(glowMesh);
            mesh.scale.set(mesh.scale.x * 10, mesh.scale.y * 10, mesh.scale.z * 10);
            this.crateModels[type] = mesh;
        };
        loader.load(CRATE_MODELS[type].href, crateLoader);
    }
}

export { CrateManager };