var GP = GP || {};



(function() {

    'use strict';

    GP.Item = function(mesh) {

        this.mesh = mesh;

        this.birthTime = Date.now();

        this.isDead = false;

        this.speed = new THREE.Vector3();

        this.acceleration = new THREE.Vector3();

        this.cleanUpTimeOut = 500;

    };

    GP.Item.prototype = {
        constructor: GP.Item,

        mesh: null, // mesh object source

        birthTime: null, // date source

        isDead: false,

        speed: null,

        acceleration: null,

        cleanUpTimeOut: null,


        update: function update(time) {

            this.speed.add(this.acceleration);

            this.cleanUp(time);

            if (Date.now() > this.endTime) {
                this.isDead = true;
            }
        },


        nextCleanUpTime: Date.now(),

        cleanUp: function(time) {

            if (time < this.nextCleanUpTime) {
                return;
            }


            if (this.speed.length() < 10) {
                this.speed.set(0, 0, 0);
            }

            if (this.acceleration.length() < 10) {
                this.acceleration.set(0, 0, 0);
}
            this.nextCleanUpTime = time + this.cleanUpTimeOut;
        }
    };

})();