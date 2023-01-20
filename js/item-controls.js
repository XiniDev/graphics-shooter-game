import * as THREE from './three/three.modules.js';

class ItemControls {
    constructor() {
        this.currItem = "None";
        this.itemModel = null;

        this.maxCD = 0;
        this.currCD = 0;

        document.addEventListener('keydown', (event) => this.onKeyDown(event));
    }

    onKeyDown(event) {
        switch (event.code) {
            // movement
            case "KeyQ":
                // Q
                if (this.currCD == 0) this.activate();
                break;
        }
    }

    activate() {
        this.currCD = this.maxCD;
        

    }
}