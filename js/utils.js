import * as THREE from './three/three.modules.js';

export var worldLevel;
export function setWorldLevel(level) {
    worldLevel = level;
}

export var score = 1000;
export function addScore(num) {
    score += num;
}

export const WORLD_SIZE = 2500;

export const DEBUG = {
    "flight" : false,
    "box" : false,
    "ray" : false,
}

export const NORMAL_LOOT = ["Traveler's Boots", "Euan's Heart", "Giant's Plating", "AP-Rounds", "Scrap Gun Parts", "Electric Stabilizer", "Modified Muzzle"];

export const NORMAL_LOOT_DESCRIPTIONS = {
    "Traveler's Boots" : "Increased Speed",
    "Euan's Heart" : "Increased Max Health",
    "Giant's Plating" : "Increased Armor",
    "AP-Rounds" : "Increased Damage",
    "Scrap Gun Parts" : "Increased Fire Rate",
    "Electric Stabilizer" : "Decreased Gun Spread",
    "Modified Muzzle" : "Increased Shot Speed",
}

export const RARE_LOOT = ["Healing Mushrooms", "Magnifying Glass"];

export const RARE_LOOT_DESCRIPTIONS = {
    "Healing Mushrooms" : "Increased Regeneration",
    "Magnifying Glass" : "Increased Bullet Size",
}

export function v3Direction(direction) {
    switch (direction) {
        case 'foward':
            return new THREE.Vector3(0, 0, 1);
        case 'back':
            return new THREE.Vector3(0, 0, -1);
        case 'right':
            return new THREE.Vector3(1, 0, 0);
        case 'left':
            return new THREE.Vector3(-1, 0, 0);
        case 'up':
            return new THREE.Vector3(0, 1, 0);
        case 'down':
            return new THREE.Vector3(0, -1, 0);
    }
}

export function worldBounds(object) {
    if (object.position.x > WORLD_SIZE / 2) object.position.x = WORLD_SIZE / 2;
    if (object.position.x < - WORLD_SIZE / 2) object.position.x = - WORLD_SIZE / 2;

    if (object.position.z > WORLD_SIZE / 2) object.position.z = WORLD_SIZE / 2;
    if (object.position.z < - WORLD_SIZE / 2) object.position.z = - WORLD_SIZE / 2;
}

export function changeTexture(mesh, texture) {
    mesh.material = mesh.material.clone();
    mesh.material.map = texture;
    mesh.material.map.encoding = THREE.sRGBEncoding;
    mesh.material.map.flipY = false;
    mesh.material.needsUpdate = true;
}

export function floorIntersection(floorDetector, floorTrigs) {
    let intersection = new THREE.Vector3();

    // check for intersections using triangles stored from before
    for (let i = 0; i < floorTrigs.length; i++) {
        const a = floorTrigs[i].a;
        const b = floorTrigs[i].b;
        const c = floorTrigs[i].c;
        floorDetector.ray.intersectTriangle(a, b, c, false, intersection);
    }

    return intersection;
}

export function playerTakeDamage(player, damage) {
    player.health -= damage * 40 / (40 + player.armor);
}

export function enemiesCheckPlayer(playerBox, currentEnemies) {
    for (let i = 0; i < currentEnemies.length; i++) {
        if (currentEnemies[i]["box"].intersectsBox(playerBox)) {
            return currentEnemies[i];
        }
    }
    return null;
}

export function enemiesCheckHit(bullets, currentEnemies) {
    let hitList = [];
    for (let i = 0; i < currentEnemies.length; i++) {
        for (let j = 0; j < bullets.length; j++) {
            if (currentEnemies[i]["box"].intersectsBox(bullets[j]["box"])) {
                hitList.push([currentEnemies[i], bullets[j]]);
            }
        }
    }
    return hitList;
}

export function enemiesCheckDeath(currentEnemies) {
    let deadEnemies = [];
    for (let i = 0; i < currentEnemies.length; i++) {
        if (currentEnemies[i]["health"] <= 0) {
            deadEnemies.push(currentEnemies[i]);
            currentEnemies.splice(i, 1);
        }
    }
    return deadEnemies;
}