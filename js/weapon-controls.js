import * as THREE from './three/three.modules.js';

const GUN_MODELS = {
    "Edge_14" : new URL('../assets/models/guns/Edge14.glb', import.meta.url),
};

const BLADE_MODELS = {
    "Blade_Of_Ionia" : new URL('../assets/models/blades/blade_of_ionia_white.glb', import.meta.url),
};

class WeaponControls {
    constructor(camera, loader) {
        this.heldIndex = 0;
        this.heldWeapons = ["Edge_14", "Blade_Of_Ionia"];
        this.weaponModels = {};

        for (const [key, value] of Object.entries(GUN_MODELS)) {
            this.loadGun(key, camera, loader);
        }

        for (const [key, value] of Object.entries(BLADE_MODELS)) {
            this.loadBlade(key, camera, loader);
        }

        // lighting for weapon
        const light = new THREE.PointLight(0xffffff, 10, 200);
        light.position.set(0, 10, 0);
        camera.add(light);

        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        // document.addEventListener('keyup', (event) => this.onKeyUp(event));

        document.addEventListener('click', (event) => this.onClick(event));
    }

    onKeyDown(event) {
        switch (event.code) {
            // movement
            case "Digit1":
                // 1
                this.heldIndex = 0;
                break;
            case "Digit2":
                // 2
                this.heldIndex = 1;
                break;
        }
    }

    onClick(event) {
        switch (event) {
            // movement
            case "Digit1":
                // 1
                this.heldIndex = 0;
                break;
            case "Digit2":
                // 2
                this.heldIndex = 1;
                break;
        }
    }

    update(delta, camera) {
        this.holdWeapon(camera);
    }

    loadGun(gun, camera, loader) {
        // load gun asset
        let gunLoader = (gltf) => {
            const model = gltf.scene;
            const mesh = model.children.find((child) => child.name === gun);
            mesh.scale.set(mesh.scale.x * 20, mesh.scale.y * 20, mesh.scale.z * 20);
            mesh.position.set(mesh.position.x + 3, mesh.position.y - 2.5, mesh.position.z - 5);
            this.weaponModels[gun] = mesh;
        };
        gunLoader.bind(this);
        loader.load(GUN_MODELS[gun].href, gunLoader);
    }

    loadBlade(blade, camera, loader) {
        // load blade asset
        let bladeLoader = (gltf) => {
            const model = gltf.scene;
            const mesh = model.children.find((child) => child.name === blade);
            mesh.scale.set(mesh.scale.x * 20, mesh.scale.y * 20, mesh.scale.z * 20);
            mesh.position.set(mesh.position.x + 5, mesh.position.y - 1, mesh.position.z - 5);
            mesh.rotateX(Math.PI / 4);
            mesh.rotateY(-Math.PI / 4);
            mesh.rotateZ(Math.PI / 4);
            this.weaponModels[blade] = mesh;
        };
        bladeLoader.bind(this);
        loader.load(BLADE_MODELS[blade].href, bladeLoader)
    }

    holdWeapon(camera) {
        if (Object.keys(this.weaponModels).length == 2) {
            camera.remove(this.weaponModels[this.heldWeapons[(this.heldIndex - 1) * - 1]]);
            camera.add(this.weaponModels[this.heldWeapons[this.heldIndex]]);
        }
    }
}

export { WeaponControls };