import * as THREE from './three/three.modules.js';

const GUN_MODELS = {
    "Edge_14" : new URL('../assets/models/guns/Edge14.glb', import.meta.url),
}

class WeaponControls {
    constructor() {

    }

    useGun(gun, camera, loader) {
        // lighting for gun
        const light = new THREE.PointLight(0xffffff, 10, 200);
        light.position.set(0, 10, 0);
        camera.add(light);

        // load gun asset
        loader.load(GUN_MODELS[gun].href, function(gltf) {
            const model = gltf.scene;
            const mesh = model.children.find((child) => child.name === gun);
            mesh.scale.set(mesh.scale.x * 20, mesh.scale.y * 20, mesh.scale.z * 20);
            mesh.position.set(mesh.position.x + 3, mesh.position.y - 2.5, mesh.position.z - 5);
            camera.add(mesh);
        });
    }
}

export { WeaponControls };