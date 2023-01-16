import * as THREE from './three/three.modules.js';


// similar to example from pointerlockcontrols


class Floor {
    constructor(width, length, frequency, bumpy) {
        this.width = width
        this.length = length
        this.frequency = frequency
        this.bumpy = bumpy

        this.geometry = new THREE.PlaneGeometry( this.width, this.length, this.width / 100 * this.frequency, this.length / 100 * this.frequency);
        this.geometry.rotateX( - Math.PI / 2 );
        this.geometry.translate(0, 0, 0);

        this.init()
    }

    init() {
        const vertex = new THREE.Vector3();
        const color = new THREE.Color();

        let position = this.geometry.attributes.position;

        for ( let i = 0, l = position.count; i < l; i ++ ) {

            vertex.fromBufferAttribute( position, i );

            vertex.x += Math.random() * 20 - 10;
            vertex.y += Math.random() * this.bumpy;
            vertex.z += Math.random() * 20 - 10;

            position.setXYZ( i, vertex.x, vertex.y, vertex.z );

        }

        this.geometry = this.geometry.toNonIndexed(); // ensure each face has unique vertices

        position = this.geometry.attributes.position;
        const colorsFloor = [];

        for ( let i = 0, l = position.count; i < l; i ++ ) {

            color.setHSL( Math.random() * 0.1 + 0.8, 0.5, Math.random() * 0.1 + 0.3 );
            colorsFloor.push( color.r, color.g, color.b );

        }

        this.geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsFloor, 3 ) );

        this.material = new THREE.MeshBasicMaterial( { vertexColors: true } );

        this.mesh = new THREE.Mesh( this.geometry, this.material );
    }
}

export { Floor };