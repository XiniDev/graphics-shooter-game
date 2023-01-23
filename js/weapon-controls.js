import * as THREE from './three/three.modules.js';
import { Crosshair } from './crosshair.js';
import { DEBUG, v3Direction } from './utils.js';

const TOTAL_HELD_WEAPONS = 2;

const GUN_MODELS = {
    "Edge_14" : new URL('../assets/models/guns/Edge14.glb', import.meta.url),
    "XenTech_99" : new URL('../assets/models/guns/XenTech99.glb', import.meta.url),
};

const GUN_MESH_PROPERTIES = {
    "Edge_14" : {
        "scale" : 20,
    },
    "XenTech_99" : {
        "scale" : 10,
    },
};

const GUN_PROPERTIES = {
    "Edge_14" : {
        "scope" : 1,
        "frames" : 100,
        "speed" : 1000,
        "spread" : 0.04,
        "damage" : 3,
    },
    "XenTech_99" : {
        "scope" : 2,
        "frames" : 20,
        "speed" : 1200,
        "spread" : 0.08,
        "damage" : 1,
    },
};

class WeaponControls {
    constructor(camera, loader, scene, fpsAdditional) {
        // model stuff
        this.heldIndex = 0;
        this.heldWeapons = ["XenTech_99", "Edge_14"];
        this.weaponModels = {};

        for (const [key, value] of Object.entries(GUN_MODELS)) {
            this.loadGun(key, loader);
        }

        // lighting for weapon
        const light = new THREE.PointLight(0xFFFFFF, 5, 10);
        light.position.set(0, 1, -1);
        camera.add(light);

        // filter color for scope
        const geometry = new THREE.PlaneGeometry(3, 2, 1, 1);
        const filter = new THREE.MeshBasicMaterial( {color: 0x60A0A8, transparent: true, opacity: 0.3} );
        this.scopeFilter = new THREE.Mesh( geometry, filter );
        this.scopeFilter.position.set(0, 0, -1);
        // camera.add(this.scopeFilter);

        // crosshair
        this.crosshair = new Crosshair();

        // backup for reset
        this.backupGunPosition = new THREE.Vector3(3, -2.5, -5);
        this.backupGunPositionAim = new THREE.Vector3(0, -1.5, -4);
        this.backupGunRotation = new THREE.Euler();

        // other variables
        this.bullets = [];
        this.maxShootFrames = 0;
        this.shootFrames = 0;
        this.isShooting = false;
        this.isAiming = false;
        this.accuracyMod = 0;
        this.fullAuto = false;

        // fps stuff
        this.fpsAdditional = fpsAdditional;

        document.addEventListener('keydown', (event) => this.onKeyDown(event));

        document.addEventListener('click', (event) => this.onClick(event, camera, scene));

        document.addEventListener('mousedown', (event) => this.mouseDown(event));

        document.addEventListener('mouseup', (event) => this.mouseUp(event));
        
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
        let mesh = this.weaponModels[this.heldWeapons[this.heldIndex]];
        switch (event.button) {
            case 0:
                // left click
                this.shoot(mesh, camera, scene);
                break;
            case 2:
                // right click
                if (!this.isShooting) this.aim(mesh, camera);
                break;
        }
    }

    mouseDown(event) {
        if (event.button == 0) this.fullAuto = true;
    }

    mouseUp(event) {
        if (event.button == 0) this.fullAuto = false;
    }

    update(delta, camera, scene, fpsVelocity) {
        if (Object.values(this.weaponModels).length == Object.values(GUN_MODELS).length) {
            this.setAccuracy(fpsVelocity);
            this.holdWeapon(camera);
            this.shootAnimation(delta, camera, scene);
            this.shootBullets(delta);
        }
    }

    setAccuracy(fpsVelocity) {
        // reduce accuracy based on velocity
        this.accuracyMod = (fpsVelocity.x + fpsVelocity.y + fpsVelocity.z) / 1000;
    }

    holdWeapon(camera) {
        if (Object.keys(this.weaponModels).length == TOTAL_HELD_WEAPONS) {
            camera.remove(this.weaponModels[this.heldWeapons[(this.heldIndex - 1) * - 1]]);
            camera.add(this.weaponModels[this.heldWeapons[this.heldIndex]]);
        }
    }

    shootAnimation(delta, camera, scene) {
        let gun = this.weaponModels[this.heldWeapons[this.heldIndex]];
        
        if (this.isShooting) {
            if (this.shootFrames < this.maxShootFrames) {
                this.shootFrames += 1;
                this.shootAnimationOnCase(delta, gun);
            } else {
                this.shootFrames = 0;
                this.isShooting = false;
            }
        } else {
            // back to original position and rotation
            let backupPos;
            if (this.isAiming) backupPos = this.backupGunPositionAim;
            else backupPos = this.backupGunPosition;
            gun.position.copy(backupPos);
            gun.rotation.copy(this.backupGunRotation);
            if (this.fullAuto) this.shoot(gun, camera, scene);
        }
    }

    shootAnimationOnCase(delta, gun) {
        switch (gun.name) {
            case "Edge_14":
                this.shootAnimationEdge14(delta, gun);
                break;
            case "XenTech_99":
                this.shootAnimationXenTech99(delta, gun);
                break;
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

    shootAnimationXenTech99(delta, gun) {
        const recoilDegree = 0.5;
        const recoilDistance = 10;
        if (this.shootFrames <= this.maxShootFrames / 4) {
            gun.rotateX(recoilDegree * delta);
            gun.position.z += recoilDistance * delta;
        } else if (this.shootFrames <= this.maxShootFrames / 2) {
            gun.rotateX(-1 * recoilDegree * delta);
            gun.position.z -= recoilDistance * delta;
        }
    }

    shootBullets(delta) {
        for (let i = 0; i < this.bullets.length; i++) {
            let forward = v3Direction('back').applyQuaternion(this.bullets[i]["direction"]);
            forward.normalize();
            forward.multiplyScalar(this.bullets[i]["speed"] * delta);
            this.bullets[i]["data"].position.add(forward);
            this.bullets[i]["box"].copy(this.getBulletBox(this.bullets[i]["data"], this.bullets[i]["direction"]));
        }
    }

    loadGun(gun, loader) {
        // load gun asset
        let gunLoader = (gltf) => {
            const model = gltf.scene;
            const mesh = model.children.find((child) => child.name === gun);

            const gunScale = GUN_MESH_PROPERTIES[gun]["scale"];
            mesh.scale.set(mesh.scale.x * gunScale, mesh.scale.y * gunScale, mesh.scale.z * gunScale);
            mesh.position.set(mesh.position.x + 3, mesh.position.y - 2.5, mesh.position.z - 5);
            this.weaponModels[gun] = mesh;
        };
        loader.load(GUN_MODELS[gun].href, gunLoader);
    }

    aim(mesh, camera) {
        if (typeof mesh !== "undefined") {
            const scopeMultiplier = GUN_PROPERTIES[mesh.name]["scope"];
            if (this.isAiming) {
                if (mesh.name == "XenTech_99") {
                    camera.remove(this.scopeFilter);
                    mesh.visible = true;
                }
                this.isAiming = false;
                mesh.position.set(mesh.position.x + 3, mesh.position.y - 1, mesh.position.z - 1);
                camera.fov = 75;
                this.crosshair.balance(3/(4 - 1 * scopeMultiplier));
                camera.updateProjectionMatrix();
            }
            else {
                if (mesh.name == "XenTech_99") {
                    camera.add(this.scopeFilter);
                    mesh.visible = false;
                }
                this.isAiming = true;
                mesh.position.set(mesh.position.x - 3, mesh.position.y + 1, mesh.position.z + 1);
                camera.fov = 75 - 25 * scopeMultiplier;
                this.crosshair.balance((4 - 1 * scopeMultiplier)/3);
                camera.updateProjectionMatrix();
            }
        }
    }

    shoot(mesh, camera, scene) {
        if (typeof mesh !== "undefined") {
            switch (mesh.name) {
                case "Edge_14":
                    this.shootEdge14(mesh, camera, scene);
                    break;
                case "XenTech_99":
                    this.shootXenTech99(mesh, camera, scene);
                    break;
            }
        }
    }

    shootEdge14(mesh, camera, scene) {
        if (!this.isShooting) {
            this.isShooting = true;
            this.maxShootFrames = GUN_PROPERTIES["Edge_14"]["frames"] * this.fpsAdditional["fireRate"];

            let position = new THREE.Vector3();
            mesh.getWorldPosition(position);
            let facingQuaternion = camera.quaternion.clone();

            // create bullet
            const bulletGeometry = new THREE.CapsuleGeometry(2 + this.fpsAdditional["bulletSize"], 80, 1, 4);
            const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xF1C232 });
            let bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
            bullet.name = "bullet";
            bullet.scale.set(bullet.scale.x * 0.1, bullet.scale.y * 0.1, bullet.scale.z * 0.1);

            // set bullet position and rotation
            bullet.position.copy(position);
            bullet.position.y += 0.7;
            bullet.quaternion.copy(facingQuaternion);

            // let bullet start more front so it doesn't look like its piercing the gun
            let forward = v3Direction('back').applyQuaternion(facingQuaternion);
            forward.normalize();
            forward.multiplyScalar(3);
            bullet.position.add(forward);

            this.spread(bullet, GUN_PROPERTIES["Edge_14"]["spread"] * this.fpsAdditional["gunSpread"]);

            let quaternion = bullet.quaternion.clone();

            bullet.rotateX(-Math.PI / 2);

            const box = this.getBulletBox(bullet, facingQuaternion);
            
            // debug
            let boxh;
            if (DEBUG["box"]) {
                boxh = new THREE.Box3Helper(box);
                boxh.updateMatrixWorld(true);
                scene.add(boxh);
            }

            // remove bullet after a while so that there won't be too many bullets on screen at the same time
            setTimeout(function() {
                scene.remove(bullet);
                this.bullets.shift();
            }.bind(this), 5000);

            this.bullets.push({
                "data" : bullet,
                "box" : box,
                "boxh" : boxh,
                "direction" : quaternion,
                "speed" : GUN_PROPERTIES["Edge_14"]["speed"] * this.fpsAdditional["shotSpeed"],
                "damage" : GUN_PROPERTIES["Edge_14"]["damage"] + this.fpsAdditional["damage"],
            });
            scene.add(bullet);
        }
    }

    shootXenTech99(mesh, camera, scene) {
        if (!this.isShooting) {
            this.isShooting = true;
            this.maxShootFrames = GUN_PROPERTIES["XenTech_99"]["frames"] * this.fpsAdditional["fireRate"];

            let position = new THREE.Vector3();
            mesh.getWorldPosition(position);
            let facingQuaternion = camera.quaternion.clone();

            // create bullet
            const bulletGeometry = new THREE.CapsuleGeometry(2 + this.fpsAdditional["bulletSize"], 120, 1, 4);
            const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0x60A0A8 });
            let bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
            bullet.name = "bullet";
            bullet.scale.set(bullet.scale.x * 0.1, bullet.scale.y * 0.1, bullet.scale.z * 0.1);

            // set bullet position and rotation
            bullet.position.copy(position);
            bullet.position.y += 0.7;
            bullet.quaternion.copy(facingQuaternion);

            // let bullet start more front so it doesn't look like its piercing the gun
            let forward = v3Direction('back').applyQuaternion(facingQuaternion);
            forward.normalize();
            forward.multiplyScalar(3);
            bullet.position.add(forward);

            this.spread(bullet, GUN_PROPERTIES["XenTech_99"]["spread"] * this.fpsAdditional["gunSpread"]);

            let quaternion = bullet.quaternion.clone();

            bullet.rotateX(-Math.PI / 2);

            const box = this.getBulletBox(bullet, facingQuaternion);
            
            // debug
            let boxh;
            if (DEBUG["box"]) {
                boxh = new THREE.Box3Helper(box);
                boxh.updateMatrixWorld(true);
                scene.add(boxh);
            }

            // remove bullet after a while so that there won't be too many bullets on screen at the same time
            setTimeout(function() {
                scene.remove(bullet);
                this.bullets.shift();
            }.bind(this), 5000);

            this.bullets.push({
                "data" : bullet,
                "box" : box,
                "boxh" : boxh,
                "direction" : quaternion,
                "speed" : GUN_PROPERTIES["XenTech_99"]["speed"] * this.fpsAdditional["shotSpeed"],
                "damage" : GUN_PROPERTIES["XenTech_99"]["damage"] + this.fpsAdditional["damage"],
            });
            scene.add(bullet);
        }
    }

    getBulletBox(bullet, facingQuaternion) {
        // get the position of the tip by moving the same direction as the bullet until reaching the tip of the bullet
        let bulletLength = v3Direction('back').applyQuaternion(facingQuaternion);
        bulletLength.normalize();
        bulletLength.multiplyScalar(bullet.geometry.parameters.height / 20);
        
        // create bounding box from bullet tip, 
        let tip = bullet.position.clone();
        tip.add(bulletLength);
            
        const min = tip.clone().sub(new THREE.Vector3(0.5, 0.5, 0.5));
        const max = tip.clone().add(new THREE.Vector3(0.5, 0.5, 0.5));
        
        // bounding box
        return new THREE.Box3(min, max);
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