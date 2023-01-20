import * as THREE from './three/three.modules.js';
import { Perlin } from './three/addons/PerlinNoise.js';

// edited from the example - pointerlockcontrols

class Floor {
    constructor(width, height, frequency, bumpy) {
        this.width = width
        this.height = height
        this.frequency = frequency
        this.bumpy = bumpy

        // this.geometry = new THREE.PlaneGeometry(this.width, this.height, this.width / 10 * this.frequency, this.height / 10 * this.frequency);
        this.geometry = new THREE.PlaneGeometry(this.width, this.height, 64, 64);

        this.init();
    }

    init() {
        // procedural height map using improved noise by perlin
        this.vertices = this.geometry.attributes.position.array;
        // console.log(this.vertices);
        let perlin = new Perlin();
        let peak = 50;
        let smoothing = 400;
        for (let i = 0; i < this.vertices.length; i += 3) {
            const x = this.vertices[i];
            const y = this.vertices[i + 1];
            const n = perlin.noise(x / smoothing, y / smoothing) * peak;
            // console.log(n);
            this.vertices[i + 2] = n;
        }
        // flag for update, and recompute normals for lighting
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();

        this.geometry.rotateX(-Math.PI / 2);
        this.geometry.translate(0, 0, 0);

        // gets the indices of the vertices
        this.indices = this.geometry.index.array;

        // const vertex = new THREE.Vector3();
        // const color = new THREE.Color();

        // let position = this.geometry.attributes.position;

        // for ( let i = 0, l = position.count; i < l; i ++ ) {

        //     vertex.fromBufferAttribute( position, i );

        //     vertex.x += Math.random() * 20 - 10;
        //     vertex.y += Math.random() * this.bumpy;
        //     vertex.z += Math.random() * 20 - 10;

        //     position.setXYZ( i, vertex.x, vertex.y, vertex.z );

        // }

        // this.geometry = this.geometry.toNonIndexed(); // ensure each face has unique vertices

        // position = this.geometry.attributes.position;
        // const colorsFloor = [];

        // for ( let i = 0, l = position.count; i < l; i ++ ) {

        //     color.setHSL( Math.random() * 0.1 + 0.3, 0.5, Math.random() * 0.1 + 0.8 );
        //     colorsFloor.push( color.r, color.g, color.b );

        // }

        // this.geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsFloor, 3 ) );

        // this.material = new THREE.MeshBasicMaterial( { vertexColors: true } );
        this.material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

        this.mesh = new THREE.Mesh( this.geometry, this.material );
    }
}

export { Floor };