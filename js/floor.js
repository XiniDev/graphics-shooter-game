import * as THREE from './three/three.modules.js';
import { Perlin } from './three/addons/PerlinNoise.js';

// edited from the example - pointerlockcontrols

class Floor {
    constructor(size, level) {
        this.width = size;
        this.height = size;
        this.geometry = new THREE.PlaneGeometry(this.width, this.height, 64, 64);

        this.init(level);
    }

    init(level) {
        // procedural height map using improved noise by perlin
        this.vertices = this.geometry.attributes.position.array;
        // console.log(this.vertices);
        let perlin = new Perlin();
        let peak, smoothing;
        if (level == 1) peak = 50, smoothing = 400;
        else peak = 100, smoothing = 350;
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

        // get center of floor geometry
        this.center = new THREE.Vector3(0, 0, 0);
        
        // highest and lowest point of the floor
        this.maxY = Math.max(...this.vertices.filter((v, i) => (i % 3 == 2)));
        this.minY = Math.min(...this.vertices.filter((v, i) => (i % 3 == 2)));

        this.geometry.rotateX(-Math.PI / 2);
        this.geometry.translate(0, 0, 0);

        // gets the indices of the vertices
        this.indices = this.geometry.index.array;

        // get min and max indices
        this.minIndex = Math.min(this.indices);
        this.maxIndex = Math.max(this.indices);

        // gets the triangles of the indices
        this.triangles = [];

        for (let i = 0; i < this.indices.length; i+=3) {
            // get indices from each triangle in the plane geometry
            const i1 = this.indices[i];
            const i2 = this.indices[i+1];
            const i3 = this.indices[i+2];
            
            // get vertices from their indices
            const a = new THREE.Vector3().fromBufferAttribute(this.geometry.attributes.position, i1);
            const b = new THREE.Vector3().fromBufferAttribute(this.geometry.attributes.position, i2);
            const c = new THREE.Vector3().fromBufferAttribute(this.geometry.attributes.position, i3);

            let triangle = new THREE.Triangle(a, b, c);
            this.triangles.push(triangle);
        }
        if (level == 1) this.material = new THREE.MeshStandardMaterial({ color: 0x001010 });
        else this.material = new THREE.MeshStandardMaterial({ color: 0x101010 });

        this.mesh = new THREE.Mesh( this.geometry, this.material );
    }
}

export { Floor };