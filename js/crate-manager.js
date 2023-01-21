import * as THREE from './three/three.modules.js';

const CRATE_MODELS = {
    "Crate_N" : new URL('../assets/models/crates/Normal_Crate.glb', import.meta.url),
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

        this.debug = {
            "box" : true,
        }
    }

    update(delta, floor, scene) {
        this.spawnCrate(floor, scene);
        this.crateAnimation(delta, scene);
    }

    spawnCrate(floor, scene) {
        if (this.crateModels["Crate_N"] !== undefined) {
            // loot crate spawn rate
            if (Math.random() > 0.999) {
                let ind;
                do {
                    ind = Math.floor(Math.random() * floor.indices.length);
                } while (ind == floor.minIndex || ind == floor.maxIndex);
                let pos = new THREE.Vector3().fromBufferAttribute(floor.geometry.attributes.position, floor.indices[ind]);

                if (this.currentCrates.length < MAX_CRATES) {
                    const data = this.crateModels["Crate_N"].clone();
                    data.position.copy(pos);

                    // bounding box
                    const box = new THREE.Box3().setFromObject(data);
                    
                    // debug
                    let boxh;
                    if (this.debug["box"]) {
                        boxh = new THREE.Box3Helper(box);
                        scene.add(boxh);
                    }

                    // store values
                    this.currentCrates.push({
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
            const light = new THREE.PointLight(0x63E2FF, 4, 10);
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