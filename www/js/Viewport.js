function Viewport (container)
{
    var camera, scene, renderer, controls;

    function onWindowResize ()
    {
        camera.aspect = container.width () / container.height ();
        camera.updateProjectionMatrix ();

        renderer.setSize (container.width (), container.height ());
    }

    if (! Detector.webgl) return Detector.addGetWebGLMessage ();

    (function init ()
    {
        camera = new THREE.PerspectiveCamera (75, container.width () / container.height (), 1, 10000);
        camera.position.set (0, -300, 1500);
        camera.up.set (0, 0, 1);

        controls = new THREE.TrackballControls (camera);
        controls.target.set (0, -100, 1500);

        scene = new THREE.Scene ();

        scene.add (new THREE.AmbientLight (0x404040));

        var light = new THREE.DirectionalLight (0xffffff);
        light.position.set (0, -1000, 1500);
        scene.add (light);

        renderer = new THREE.WebGLRenderer ({antialias: true});
        renderer.setClearColor ($('body').css ('background-color'));
        renderer.setSize (container.width (), container.height ());

        container.append (renderer.domElement);

        window.addEventListener ('resize', onWindowResize, false);

        var loader = new THREE.BinaryLoader ();
        loader.load ("data/bin/FJ3199.js", createMesh);
        $('#progressbar').progressbar ({ value: 20 });
        loader.load ("data/bin/FJ3200.js", createMesh);
        $('#progressbar').progressbar ({ value: 40 });
        loader.load ("data/bin/FJ3274.js", createMesh);
        loader.load ("data/bin/FJ3281.js", createMesh);
        loader.load ("data/bin/FJ3309.js", createMesh);
        loader.load ("data/bin/FJ3380.js", createMesh);
        loader.load ("data/bin/FJ3386.js", createMesh);

        function createMesh (geometry, materials)
        {
            scene.add (new THREE.Mesh (geometry, new THREE.MeshLambertMaterial ({color: 0x777777})));
        }
    }) ();

    (function animate ()
    {
        controls.update ();
        renderer.render (scene, camera);

        requestAnimationFrame (animate);
    }) ();
};
