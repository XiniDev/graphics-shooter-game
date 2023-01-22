import * as THREE from './three/three.modules.js';
import { DEBUG } from './utils.js';

const TOTEM_MODEL = new URL('../assets/models/totem/Totem.glb', import.meta.url);
const UNLIT_TEXTURE = new THREE.TextureLoader().load('../assets/models/totem/textures/Totem_Texture_Unlit.png');
const LIT_TEXTURE = new THREE.TextureLoader().load('../assets/models/totem/textures/Totem_Texture_Lit.png');

const MAX_TOTEMS = 5;

class TotemManager {
    constructor(loader) {
        this.totemModel;
        this.currentTotems = [];

        this.loadTotem(loader);
    }

    update(delta, floor, scene) {
        this.spawnTotem(floor, scene)
    }

    spawnTotem(floor, scene) {
        if (typeof this.totemModel !== "undefined") {
            // spawn position based on indices, make sure that they don't spawn at the exact edge of the map
            let ind;
            do {
                ind = Math.floor(Math.random() * floor.indices.length);
            } while (ind == floor.minIndex || ind == floor.maxIndex);
            let pos = new THREE.Vector3().fromBufferAttribute(floor.geometry.attributes.position, floor.indices[ind]);

            // total totems spawned in one level dependant on constant
            if (this.currentTotems.length < MAX_TOTEMS) {
                const data = this.totemModel.clone();
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
                this.currentTotems.push({
                    "data" : data,
                    "box" : box,
                    "boxh" : boxh,
                    "lit" : false,
                });
                scene.add(data);
            }
        }
    }

    // changeTexture() {
    //     let totemMesh;
    //     totemMesh.material.map = LIT_TEXTURE;
    //     totemMesh.material.map.encoding = THREE.sRGBEncoding;
    //     totemMesh.material.map.flipY = false;
    //     totemMesh.material.needsUpdate = true;
    // }

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