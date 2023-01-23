import * as THREE from './three/three.modules.js';
import { GLTFLoader } from './three/addons/GLTFLoader.js';
import { WORLD_SIZE, setWorldLevel, worldLevel, score, addScore } from './utils.js';
import { FirstPersonControls } from './controls.js';
import { Floor } from './floor.js';
import { WeaponControls } from './weapon-controls.js';
import { CrateManager } from './crate-manager.js';
import { TotemManager } from './totem-manager.js';
import { Environment } from './environment.js';

let camera, scene, renderer, loader;
let environment;
let floor;
let fps, wc;
let tm, cm;

let prevTime = performance.now();

document.getElementById('level1').onclick = function() {
    begin(1);
};
document.getElementById('level2').onclick = function() {
    begin(2);
};

function begin(level) {
    document.getElementById('level1').style.display = 'none';
    document.getElementById('level2').style.display = 'none';
    document.getElementById('clicktoplay').style.display = 'block';
    document.getElementById('instructions_p').style.display = 'none';
    init(level);
    animate();
}

function init(level) {
    // init variables
    setWorldLevel(level);

    let ambientColor;
    if (level == 1) ambientColor = 0x2C041C;
    else ambientColor = 0x330002;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( { color: 0xffffff } );
    if (level == 1) scene.fog = new THREE.Fog(ambientColor, 0, 750);
    else scene.fog = new THREE.Fog(ambientColor, 0, 500);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    let sun = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.8);
    let ambient = new THREE.AmbientLight(ambientColor);
    scene.add(sun);
    scene.add(ambient);
    scene.background = new THREE.Color(ambientColor);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    loader = new GLTFLoader();

    // first person controller
    fps = new FirstPersonControls(camera);

    camera.position.y = fps.height + 50;

    scene.add( fps.controls.getObject() );

    if (level == 1) floor = new Floor(WORLD_SIZE, level);
    else floor = new Floor(WORLD_SIZE + 500, level);
    scene.add( floor.mesh );

    fps.setFloorValues(floor);

    const blocker = document.getElementById( 'blocker' );
    const instructions = document.getElementById( 'instructions' );

    blocker.addEventListener( 'click', function () {

        fps.controls.lock();

    } );

    fps.controls.addEventListener( 'lock', function () {

        instructions.style.display = 'none';
        blocker.style.display = 'none';

    } );

    fps.controls.addEventListener( 'unlock', function () {

        blocker.style.display = 'block';
        instructions.style.display = '';

    } );

    cm = new CrateManager(loader);
    tm = new TotemManager(loader, level);

    if (level == 2) environment = new Environment(loader);

    // weapon controls
    wc = new WeaponControls(camera, loader, scene, fps.additional);
}

function animate() {
    let id = requestAnimationFrame( animate );

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    addScore(-1 * delta);

    document.getElementById("score").innerHTML = Math.floor(score);

    fps.update(delta, wc.isAiming, cm.currentCrates, tm.currentTotems);
    wc.update(delta, camera, scene, fps.velocity);
    tm.update(delta, loader, floor, scene, fps, wc.bullets);
    cm.update(delta, floor, scene);

    if (worldLevel == 2) environment.update(delta, floor, scene);

    prevTime = time;

    renderer.render( scene, camera );
    
    if (fps.health < 0) {
        document.getElementById('blocker').style.display = 'block';
        document.getElementById('instructions').style.display = 'block';
        document.getElementById('clicktoplay').innerHTML = "YOU WERE HORRIBLY DEVOURED! YOU LOST! Refresh and try again!"
        cancelAnimationFrame( id );
    }

    let wincon = 0;

    for (let i = 0; i < tm.currentTotems.length; i++) {
        if (tm.currentTotems[i]["lit"]) wincon += 1;
    }

    if (wincon != 0 && wincon == tm.currentTotems.length) {
        document.getElementById('blocker').style.display = 'block';
        document.getElementById('instructions').style.display = 'block';
        document.getElementById('clicktoplay').innerHTML = "YOU'VE LIT THE LAST TOTEM! YOU WIN! Congrats!"
        cancelAnimationFrame( id );
    }
};