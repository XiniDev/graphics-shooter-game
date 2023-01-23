import * as THREE from './three/three.modules.js';
import { GhostSpawner, RockySpawner } from './enemy-spawner.js';
import { DEBUG, worldLevel } from './utils.js';

const TOTEM_MODEL = new URL('../assets/models/totem/Totem.glb', import.meta.url);

const MAX_TOTEMS = {
    1: 7,
    2: 8,
};

class TotemManager {
    constructor(loader) {
        this.totemModel;
        this.currentTotems = [];

        this.loadTotem(loader);
    }

    update(delta, loader, floor, scene, player, bullets) {
        if (typeof this.totemModel !== "undefined") {
            this.spawnTotem(loader, floor, scene);
            this.spawnEnemies(floor, scene);
            this.updateEnemies(delta, player, floor, bullets, scene);
        }
    }

    spawnTotem(loader, floor, scene) {
        // total totems spawned in one level dependant on constant
        if (this.currentTotems.length < MAX_TOTEMS[worldLevel]) {
            // spawn position based on indices, make sure that they don't spawn at the exact edge of the map
            let ind;
            do {
                ind = Math.floor(Math.random() * floor.indices.length);
            } while (ind == floor.minIndex || ind == floor.maxIndex);
            let pos = new THREE.Vector3().fromBufferAttribute(floor.geometry.attributes.position, floor.indices[ind]);

            // spawning
            const totem = this.totemModel.clone();
            totem.position.copy(pos);

            // bounding box
            const box = new THREE.Box3().setFromObject(totem);
                
            // debug
            let boxh;
            if (DEBUG["box"]) {
                boxh = new THREE.Box3Helper(box);
                scene.add(boxh);
            }

            // type of spawner
            let spawner, chance;
            if (worldLevel == 1) chance = 0.6;
            else chance = 0.4;
            if (Math.random() < chance) spawner = new GhostSpawner(loader);
            else spawner = new RockySpawner(loader);

            // store values
            this.currentTotems.push({
                "data" : totem,
                "box" : box,
                "boxh" : boxh,
                "lit" : false,
                "spawner" : spawner,
            });
            scene.add(totem);
        }
    }

    spawnEnemies(floor, scene) {
        for (let i = 0; i < this.currentTotems.length; i++) {
            if (!this.currentTotems[i]["lit"]) {
                this.currentTotems[i]["spawner"].spawnEnemies(this.currentTotems[i]["data"].position, floor, scene);
            }
        }
    }

    updateEnemies(delta, player, floor, bullets, scene) {
        for (let i = 0; i < this.currentTotems.length; i++) {
            this.currentTotems[i]["spawner"].update(delta, this.currentTotems[i]["data"].position, player, floor, bullets, scene);
        }
    }

    loadTotem(loader) {
        // load totem asset
        let totemLoader = (gltf) => {
            const model = gltf.scene;
            const totemMesh = model.children.find((child) => child.name === "Totem");
            const orbMesh = model.children.find((child) => child.name === "Orb");

            // orb mesh light
            let light = new THREE.PointLight(0x95ABFF, 7, 10);
            orbMesh.add(light);

            const mesh = new THREE.Group();
            mesh.name = "totem";
            mesh.add(totemMesh);
            mesh.add(orbMesh);

            // orb is only visible when player activates it
            orbMesh.visible = false;

            mesh.scale.set(mesh.scale.x * 10, mesh.scale.y * 10, mesh.scale.z * 10);
            this.totemModel = mesh;
        };
        loader.load(TOTEM_MODEL.href, totemLoader);
    }
}

export { TotemManager }