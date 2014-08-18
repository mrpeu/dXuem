var GP = GP || {};

(function() {

    'use strict';

    if (Detector.webgl) Detector.addGetWebGLMessage();


    GP.Universe = function(container, config) {

        this.config = config || {};

        this.worldSize = this.config.worldSize || GP.Universe.prototype.config.worldSize;


        this.init(container);

        return this;
    };

    GP.Universe.prototype = {
        constructor: GP.Universe,

        config: {
            worldSize: new THREE.Vector3(500, 500, 500)
        },

        container: null,
        canvas: null,

        camera: null,
        cameraAnchor: null,

        picker: null,

        scene: null,
        renderer: null,

        init: function(container) {

            this.container = container;


            // scene

            this.scene = new THREE.Scene();
            //this.scene.fog = new THREE.Fog(0xeeeeee, 1000, 3000);

            var w = container.clientWidth,
                h = container.clientHeight;

            // camera
            this.camera = new THREE.PerspectiveCamera(45, w / h, 1, 220);
            this.camera.position.set(0, 50, 50);
            this.camera.lookAt(new THREE.Vector3());
            this.camera.name = "p";

            // this.camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -200, 50);
            // this.camera.name = "o";

            this.cameraAnchor = new THREE.Object3D();
            this.cameraAnchor.add(this.camera);

            this.scene.add(this.cameraAnchor);


            // renderer

            this.renderer = new THREE.WebGLRenderer({
                antialias: this.config.antialias,
                alpha: true
            });

            this.renderer.setSize(w, h);

            container.appendChild(this.canvas = this.renderer.domElement);

            this.picker = new GP.Picker(w, h, this.camera);

            this.onCanvasResize(w, h);


            this.initFloor();

            this.initLight();

            this.itemManager = new GP.ItemManager();

            this.initEvents();

            window.setTimeout(this.initObject(), 0);

        },

        initFloor: function() {

            // generate texture

            var cvs = document.createElement('canvas');
            var ctx = cvs.getContext('2d');


            var squareSize = 16;
            cvs.width = squareSize;
            cvs.height = squareSize;

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, squareSize / 2, squareSize / 2);
            ctx.fillRect(squareSize / 2, squareSize / 2, squareSize, squareSize);

            ctx.fillStyle = "#fcfcfc";
            ctx.fillRect(squareSize / 2, 0, squareSize, squareSize / 2);
            ctx.fillRect(0, squareSize / 2, squareSize / 2, squareSize);



            var g = new THREE.PlaneGeometry(this.worldSize.x, this.worldSize.y);
            var t = new THREE.Texture(cvs)
            t.wrapS = THREE.RepeatWrapping;
            t.wrapT = THREE.RepeatWrapping;
            t.repeat.set(this.worldSize.x / squareSize, this.worldSize.y / squareSize);
            t.needsUpdate = true;

            var m = new THREE.MeshBasicMaterial({

                color: 0xeeeeee,

                map: t,
                transparent: true

            });


            this.floor = new THREE.Mesh(g, m);

            this.floor.rotateX(-Math.PI / 2);

            this.scene.add(this.floor);

        },

        initLight: function() {

            var l = new THREE.HemisphereLight(0xefefef);

            l.position.set(0, 1, 0);

            this.scene.add(l);

        },

        initObject: function() {

            this.os = new THREE.Object3D();
            this.scene.add(this.os);

            var g, m, o;
            var scale = 5;
            g = new THREE.BoxGeometry(1, 1, 1);

            for (var i = 0; i < 3; i++) {

                m = new THREE.MeshLambertMaterial({
                    wireframe: true,
                    color: 0xefefef * Math.random()
                });

                o = new THREE.Mesh(g, m);
                o.name = "o#" + i;

                o.scale.set(scale, scale, scale);
                o.position.set((scale + scale / 2) * i, scale, 0);

                this.os.add(o);


                this.itemManager.addItem(new GP.Item(o));

            }

        },

        initEvents: function() {

            // http://mwbrooks.github.io/thumbs.js/
            this.container.addEventListener('touchstart', this.onClick.bind(this), false);

        },

        onClick: function(e) {

            // console.log("click @%i;%i", e.clientX, e.clientY);
            this.picker.pickAt(e.clientX, e.clientY, this.os.children);

        },

        onCanvasResize: function(w, h) {

            this.canvas.width = this.worldSize.x = w;
            this.canvas.height = this.worldSize.y = h;

            if (this.camera.name == "o") {

                this.camera.left = -w / 2;
                this.camera.right = w / 2;
                this.camera.top = h / 2;
                this.camera.bottom = -h / 2;

            } else {

                this.camera.aspect = w / h;

            }

            this.camera.updateProjectionMatrix();

            this.renderer.setSize(w, h);

            this.picker.reset(w, h, this.camera);

        },

        update: function(time) {

            var w = this.canvas.clientWidth,
                h = this.canvas.clientHeight;

            if (this.canvas.width != w || this.canvas.height != h) {

                this.onCanvasResize(w, h);

            }

            this.itemManager.update(time);
        },

        render: function() {


            this.update(Date.now());


            this.renderer.render(this.scene, this.camera);

        }
    };



    GP.Picker = function(w, h, targets) {

        this.reset(w, h, targets);

    }

    GP.Picker.prototype = {
        constructor: GP.Picker,

        camera: null,

        width: null,
        height: null,
        widthHalf: null,
        heightHalf: null,

        projector: null,
        vector: null,

        reset: function(w, h, camera) {

            this.width = w;
            this.height = h;

            this.projector = new THREE.Projector();
            this.vector = new THREE.Vector3();

            this.camera = camera;

        },

        pickAt: function(x, y, targets) {

            this.vector.set((x / this.width) * 2 - 1, -(y / this.height) * 2 + 1, 0);

            var ray;

            if (this.camera.name == "o") {

                ray = this.projector.pickingRay(this.vector, this.camera);

            } else {

                this.projector.unprojectVector(this.vector, this.camera);

                ray = new THREE.Raycaster(this.camera.position, this.vector.sub(this.camera.position).normalize());

            }

            var intersects = ray.intersectObjects(targets);

            if (intersects.length > 0) {

                console.log(intersects[0].object.name);

            }
        },
    };



})();


var uni = new GP.Universe(document.getElementById('container'));

function render() {

    uni.render();

    requestAnimationFrame(render);
};

render();