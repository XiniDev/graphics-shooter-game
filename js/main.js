import * as THREE from './three/three.modules.js';
import { FirstPersonControls } from './controls.js';

let camera, scene, renderer, fps

let prevTime = performance.now();

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

const cube = new THREE.Mesh( geometry, material );

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( { color: 0xffffff } );
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    scene.add( cube );

    camera.position.z = 5;

    fps = new FirstPersonControls(camera);

    scene.add( fps.controls.getObject() );

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
}

function animate() {
    requestAnimationFrame( animate );

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    fps.update(delta)

    prevTime = time

    renderer.render( scene, camera );
};