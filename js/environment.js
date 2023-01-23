import * as THREE from './three/three.modules.js';

const ROCK_MODEL = new URL('../assets/models/env/Rock.glb', import.meta.url);
const ROCK_TEXTURE = new URL('../assets/models/env/textures/Rock_Texture.glb', import.meta.url);

const MAX_ROCKS = 20;

class Environment {
    constructor(loader) {
        this.rockModels = [];
        this.currentRocks = [];
        this.loadRocks(loader);
    }

    update(delta, floor, scene) {
        if (this.rockModels.length == 9) {
            this.spawnRock(floor, scene);
        }
    }

    spawnRock(floor, scene) {
        // spawn rocks
        if (Math.random() > 0.9 && this.currentRocks.length < MAX_ROCKS) {
            
            // spawn position based on indices, make sure that they don't spawn at the exact edge of the map
            let ind;
            do {
                ind = Math.floor(Math.random() * floor.indices.length);
            } while (ind == floor.minIndex || ind == floor.maxIndex);
            let pos = new THREE.Vector3().fromBufferAttribute(floor.geometry.attributes.position, floor.indices[ind]);
            
            // spawning
            const rock = this.rockModels[Math.floor(Math.random() * 9)].clone();
            rock.position.copy(pos);

            this.currentRocks.push(rock);

            scene.add(rock);
        }
    }

    loadRocks(loader) {
        let rockLoader = (gltf) => {
            const model = gltf.scene;
            const rock1 = model.children.find((child) => child.name === "Rock1");
            const rock2 = model.children.find((child) => child.name === "Rock2");
            const rock3 = model.children.find((child) => child.name === "Rock3");
            const rock4 = model.children.find((child) => child.name === "Rock4");
            const rock5 = model.children.find((child) => child.name === "Rock5");
            const rock6 = model.children.find((child) => child.name === "Rock6");
            const rock7 = model.children.find((child) => child.name === "Rock7");
            const rock8 = model.children.find((child) => child.name === "Rock8");
            const rock9 = model.children.find((child) => child.name === "Rock9");
            const meshes = [rock1, rock2, rock3, rock4, rock5, rock6, rock7, rock8, rock9];

            for (let i = 0; i < 9; i++) {
                meshes[i].scale.set(meshes[i].scale.x * 10, meshes[i].scale.y * 10, meshes[i].scale.z * 10);
                this.rockModels[i] = meshes[i];
            }
        };
        loader.load(ROCK_MODEL.href, rockLoader);
    }
}

export { Environment };