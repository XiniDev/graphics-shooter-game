import * as THREE from './three/three.modules.js';
import { GLTFLoader } from './three/addons/GLTFLoader.js';
import { FirstPersonControls } from './controls.js';
import { Crosshair } from './crosshair.js';
import { Floor } from './floor.js';
import { WeaponControls } from './weapon-controls.js';

let camera, scene, renderer, fps, loader

let prevTime = performance.now();

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
    
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    loader = new GLTFLoader();

    // scene.add( cube );

    // first person controller
    fps = new FirstPersonControls(camera);

    camera.position.y = fps.height;

    // test fall
    // camera.position.y = 100;

    scene.add( fps.controls.getObject() );

    let floor = new Floor(500, 500, 5, 5);
    scene.add( floor.mesh );

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

    // weapon controls
    let wc = new WeaponControls();
    wc.useGun("Edge_14", camera, loader);

    // add crosshair at the end so its in the front in the scene
    let crosshair = new Crosshair();
    crosshair.init(camera)
}

function animate() {
    requestAnimationFrame( animate );

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;

    fps.update(delta)

    prevTime = time

    renderer.render( scene, camera );
};