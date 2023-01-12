import * as THREE from './three/three.modules.js';

const GUN_MODELS = {
    "Edge_14" : new URL('../assets/models/guns/Edge14.glb', import.meta.url),
};

const BLADE_MODELS = {
    "Blade_Of_Ionia" : [new URL('../assets/models/blades/blade_of_ionia_white.glb', import.meta.url), new URL('../assets/models/blades/blade_of_ionia_red.glb', import.meta.url)],
};

class WeaponControls {
    constructor() {
        
    }

    useBlade(blade, mode, camera, loader) {
        // lighting for blade
        const light = new THREE.PointLight(0xffffff, 10, 200);
        light.position.set(0, 10, 0);
        camera.add(light);

        // load blade asset
        loader.load(BLADE_MODELS[blade][mode].href, function(gltf) {
            const model = gltf.scene;
            const mesh = model.children.find((child) => child.name === blade);
            mesh.scale.set(mesh.scale.x * 20, mesh.scale.y * 20, mesh.scale.z * 20);
            mesh.position.set(mesh.position.x + 5, mesh.position.y - 1, mesh.position.z - 5);
            mesh.rotateX( Math.PI / 4 );
            mesh.rotateY( - Math.PI / 4 );
            mesh.rotateZ( Math.PI / 4 );
            camera.add(mesh);
        });
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