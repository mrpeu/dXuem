var GP = GP || {};



(function() {

    'use strict';

    GP.ItemManager = function(mesh) {

        this.mesh = mesh;

        this.cleanUpTimeOut = 1000;

        this.items = [];

    };

    GP.ItemManager.prototype = {
        constructor: GP.ItemManager,

        mesh: null, // mesh object source

        cleanUpTimeOut: null,

        items: null,


        addItem: function(item) {

            this.items.push(item);
        },

        update: function update(time) {

            if (time > this.nextCleanUpTime) {

                this.items.forEach(function(item, i) {

                    if (item.isDead) {

                        console.warn("//todo: delete item.mesh from the scene");
                        this.items.splice(i, 1);

                    } else {

                        item.update(time);

                    }

                }, this);

                this.nextCleanUpTime = time + this.cleanUpTimeOut;

            } else {

                this.items.forEach(function(item) {

                    item.update(time);

                });
            }
        },


        nextCleanUpTime: Date.now(),
    };

})();