import * as THREE from './three/three.modules.js';
import { GLTFLoader } from './three/addons/GLTFLoader.js';
import { FirstPersonControls } from './controls.js';
import { Floor } from './floor.js';
import { WeaponControls } from './weapon-controls.js';
import { CrateManager } from './crate-manager.js';

let camera, scene, renderer, loader;
let floor;
let fps, wc, cm;

let prevTime = performance.now();

const WORLD_SIZE = 2500;

// starting cube
// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

// const cube = new THREE.Mesh( geometry, material );


init();
animate();

function init() {
    // init variables
    scene = new THREE.Scene();
    scene.background = new THREE.Color( { color: 0xffffff } );
    scene.fog = new THREE.Fog( 0xffffff, 0, 750 );
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    let sun = new THREE.HemisphereLight(0x0000ff, 0x00ff00, 0.6);
    let ambient = new THREE.AmbientLight(0x111111);
    scene.add(sun);
    scene.add(ambient);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    loader = new GLTFLoader();

    // scene.add( cube );

    // first person controller
    fps = new FirstPersonControls(camera);

    camera.position.y = fps.height + 50;

    // test fall
    // camera.position.y = 100;

    scene.add( fps.controls.getObject() );

    floor = new Floor(WORLD_SIZE, WORLD_SIZE, 5, 5);
    scene.add( floor.mesh );

    fps.setFloorValues(floor);

    const blocker = document.getElementById( 'blocker' );
    const instructions = document.getElementById( 'instructions' );

    instructions.addEventListener( 'click', function () {

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

    // fps.addCrateManager(cm);

    // weapon controls
    wc = new WeaponControls(camera, loader, scene);
}

function animate() {
    requestAnimationFrame( animate );

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;

    fps.update(delta, wc.isAiming, cm.currentCrates);
    wc.update(delta, camera, fps.velocity);
    cm.update(delta, floor, scene);

    // var arrow = new THREE.ArrowHelper( fps.interactDetector.ray.direction, fps.interactDetector.ray.origin, 8, 0xff0000 );
    // scene.add( arrow );

    prevTime = time;

    renderer.render( scene, camera );
};