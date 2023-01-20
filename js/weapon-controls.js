import * as THREE from './three/three.modules.js';
import { Crosshair } from './crosshair.js';
import { v3Direction } from './utils.js';

const GUN_MODELS = {
    "Edge_14" : new URL('../assets/models/guns/Edge14.glb', import.meta.url),
};

const BLADE_MODELS = {
    "Blade_Of_Ionia" : new URL('../assets/models/blades/blade_of_ionia_white.glb', import.meta.url),
};

const GUN_PROPERTIES = {
    "Edge_14" : {
        "frames" : 40,
        "speed" : 300,
        "spread" : 0.02,
    },
};

class WeaponControls {
    constructor(camera, loader, scene) {
        // model stuff
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
        const light = new THREE.PointLight(0xffffff, 8, 30);
        light.position.set(0, 1, -1);
        // camera.add(light);

        // crosshair
        this.crosshair = new Crosshair();

        // other variables
        this.bullets = [];
        this.maxShootFrames = 0;
        this.shootFrames = 0;
        this.isShooting = false;
        this.isAiming = false;
        this.accuracyMod = 0;

        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        // document.addEventListener('keyup', (event) => this.onKeyUp(event));

        document.addEventListener('click', (event) => this.onClick(event, camera, scene));
        
        // add crosshair at the end so its in the front in the scene
        this.crosshair.init(camera);
    }

    onKeyDown(event) {
        switch (event.code) {
            // movement
            case "Digit1":
                // 1
                if (!this.isAiming) this.heldIndex = 0;
                break;
            case "Digit2":
                // 2
                if (!this.isAiming) this.heldIndex = 1;
                break;
        }
    }

    onClick(event, camera, scene) {
        // console.log(this.weaponModels);
        let mesh = this.weaponModels[this.heldWeapons[this.heldIndex]]
        switch (event.button) {
            case 0:
                // left click
                this.attack(mesh, camera, scene);
                break;
            case 2:
                // right click
                this.aim(mesh, camera);
                break;
        }
    }

    update(delta, camera, fpsVelocity) {
        this.setAccuracy(fpsVelocity);
        this.holdWeapon(camera);
        this.shootAnimation(delta);
        this.shootBullets(delta);
    }

    setAccuracy(fpsVelocity) {
        // reduce accuracy based on velocity
        this.accuracyMod = (fpsVelocity.x + fpsVelocity.y + fpsVelocity.z) / 1000;
    }

    holdWeapon(camera) {
        if (Object.keys(this.weaponModels).length == 2) {
            camera.remove(this.weaponModels[this.heldWeapons[(this.heldIndex - 1) * - 1]]);
            camera.add(this.weaponModels[this.heldWeapons[this.heldIndex]]);
        }
    }

    shootAnimation(delta) {
        if (this.isShooting) {
            if (this.shootFrames < this.maxShootFrames) {
                this.shootFrames += 1;
                this.shootAnimationOnCase(delta, this.weaponModels[this.heldWeapons[this.heldIndex]]);
            } else {
                this.shootFrames = 0;
                this.isShooting = false;
            }
        }
    }

    shootAnimationOnCase(delta, gun) {
        switch (gun.name) {
            case "Edge_14":
                this.shootAnimationEdge14(delta, gun);
                break;
        }
    }

    shootBullets(delta) {
        for (let i = 0; i < this.bullets.length; i++) {
            let forward = v3Direction('back').applyQuaternion(this.bullets[i]["direction"]);
            forward.normalize();
            forward.multiplyScalar(this.bullets[i]["speed"] * delta);
            this.bullets[i]["data"].position.add(forward);
        }
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
        // gunLoader.bind(this);
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
        // bladeLoader.bind(this);
        loader.load(BLADE_MODELS[blade].href, bladeLoader)
    }

    aim(mesh, camera) {
        if (this.isAiming) {
            this.isAiming = false;
            mesh.position.set(mesh.position.x + 3, mesh.position.y - 1, mesh.position.z - 1);
            camera.fov = 75;
            camera.updateProjectionMatrix();
        }
        else {
            this.isAiming = true;
            mesh.position.set(mesh.position.x - 3, mesh.position.y + 1, mesh.position.z + 1);
            camera.fov = 50;
            camera.updateProjectionMatrix();
        }
    }

    attack(mesh, camera, scene) {
        if (!(mesh === "undefined")) {
            switch (mesh.name) {
                case "Edge_14":
                    this.shootEdge14(mesh, camera, scene)
                    break;
                case "Blade_Of_Ionia":
                    console.log("boi");
                    break;
            }
        }
    }

    shootEdge14(mesh, camera, scene) {
        if (!this.isShooting) {
            this.isShooting = true;
            this.maxShootFrames = GUN_PROPERTIES["Edge_14"]["frames"];

            let position = new THREE.Vector3();
            mesh.getWorldPosition(position);
            let facingQuaternion = camera.quaternion.clone();

            // create bullet
            const bulletGeometry = new THREE.CapsuleGeometry(2, 30, 1, 4);
            const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xF1C232 });
            let bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
            bullet.scale.set(bullet.scale.x * 0.1, bullet.scale.y * 0.1, bullet.scale.z * 0.1);

            // set bullet position and rotation
            bullet.position.copy(position);
            bullet.position.y += 0.7;
            bullet.quaternion.copy(facingQuaternion);

            this.spread(bullet, GUN_PROPERTIES["Edge_14"]["spread"]);

            let quaternion = bullet.quaternion.clone();

            bullet.rotateX(-Math.PI / 2);

            // remove bullet after a while so that there won't be too many bullets on screen at the same time
            setTimeout(function() {
                scene.remove(bullet);
                this.bullets.shift();
            }.bind(this), 5000);

            this.bullets.push({
                "data": bullet,
                "direction": quaternion,
                "speed": GUN_PROPERTIES["Edge_14"]["speed"],
            });
            scene.add(bullet);
        }
    }

    shootAnimationEdge14(delta, gun) {
        const recoilDegree = 2;
        const recoilDistance = 20;
        if (this.shootFrames <= this.maxShootFrames / 4) {
            gun.rotateX(recoilDegree * delta);
            gun.position.z += recoilDistance * delta;
        } else if (this.shootFrames <= this.maxShootFrames / 2) {
            gun.rotateX(-1 * recoilDegree * delta);
            gun.position.z -= recoilDistance * delta;
        }
    }

    spread(bullet, spreadVariable) {
        spreadVariable += this.accuracyMod;
        if (this.isAiming) spreadVariable *= 0.5;
        let spreadX = spreadVariable * (Math.random() - 0.5);
        let spreadY = spreadVariable * (Math.random() - 0.5);
        let spreadZ = spreadVariable * (Math.random() - 0.5);
        bullet.rotation.set(bullet.rotation.x + spreadX, bullet.rotation.y + spreadY, bullet.rotation.z + spreadZ);
    }
}

export { WeaponControls };