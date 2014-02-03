function Main (parentElement)
{
    parentElement.append (new ThreeJsCanvas ());
}

function ThreeJsCanvas ()
{
    var camera, scene, renderer, controls;

    if (! Detector.webgl) return Detector.addGetWebGLMessage ();

    function init ()
    {
        camera = new THREE.PerspectiveCamera (75, window.innerWidth / window.innerHeight, 1, 10000);
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
        renderer.setClearColor (0xAAAAAA);
        renderer.setSize (window.innerWidth, window.innerHeight);

        window.addEventListener ('resize', onWindowResize, false);

        var loader = new THREE.BinaryLoader ();
        loader.load ("data/bin/FJ3199.js", createMesh);
        loader.load ("data/bin/FJ3200.js", createMesh);
        loader.load ("data/bin/FJ3274.js", createMesh);
        loader.load ("data/bin/FJ3281.js", createMesh);
        loader.load ("data/bin/FJ3309.js", createMesh);
        loader.load ("data/bin/FJ3380.js", createMesh);
        loader.load ("data/bin/FJ3386.js", createMesh);

        function createMesh (geometry, materials)
        {
            scene.add (new THREE.Mesh (geometry, new THREE.MeshLambertMaterial ({color: 0x777777})));
        }
    }

    function onWindowResize ()
    {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix ();

        renderer.setSize (window.innerWidth, window.innerHeight);
    }

    function animate ()
    {
        controls.update ();
        renderer.render (scene, camera);

        requestAnimationFrame (animate);
    }

    init ();
    animate ();

    return renderer.domElement;
};
