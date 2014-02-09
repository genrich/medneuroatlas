function Viewport (sig, container)
{
    var camera, scene, renderer, controls,
        loader = new THREE.BinaryLoader (),
        objects            = [],
        transparentObjects = [];

    function onWindowResize ()
    {
        camera.aspect = container.width () / container.height ();
        camera.updateProjectionMatrix ();

        renderer.setSize (container.width (), container.height ());
    }

    function createMesh (geometry, materials)
    {
        var object = new THREE.Mesh (geometry, new THREE.MeshLambertMaterial ({ color: 0x777777 }));
        objects.push (object);
        scene.add (object);
    }

    function createTransparentMesh (geometry, materials)
    {
        var object = new THREE.Mesh (geometry, new THREE.MeshLambertMaterial ({ color: 0x777777, transparent: true, opacity: 0.3 }));
        transparentObjects.push (object);
        scene.add (object);
    }

    function load (isTransparent, elementFileIds)
    {
        console.log ('load: ' + elementFileIds);

        if (isTransparent)
        {
            transparentObjects.forEach (function (object)
            {
                scene.remove (object);
                object.geometry.dispose ();
                object.material.dispose ();
            });
            transparentObjects = [];
        }
        else
        {
            objects.forEach (function (object)
            {
                scene.remove (object);
                object.geometry.dispose ();
                object.material.dispose ();
            });
            objects = [];
        }


        elementFileIds.forEach (function (elementFileId)
        {
            var fileUrl = 'data/bin/' + elementFileId + '.js';
            $.ajax ({ url:     fileUrl,
                      type:    'HEAD',
                      success: function () { loader.load (fileUrl, isTransparent ? createTransparentMesh : createMesh); }});
        });
    }

    if (! Detector.webgl) return Detector.addGetWebGLMessage ();

    camera = new THREE.PerspectiveCamera (75, container.width () / container.height (), 1, 10000);
    camera.position.set (0, -300, 1500);
    camera.up.set (0, 0, 1);

    controls = new THREE.TrackballControls (camera);
    controls.target.set (0, -100, 1500);

    scene = new THREE.Scene ();

    scene.add (new THREE.AmbientLight (0x404040));

    var light = new THREE.DirectionalLight (0xffffff);
    light.position = camera.position;
    light.target.position = controls.target;
    scene.add (light);

    renderer = new THREE.WebGLRenderer ({antialias: true});
    renderer.setClearColor ($('body').css ('background-color'));
    renderer.setSize (container.width (), container.height ());

    container.append (renderer.domElement);

    window.addEventListener ('resize', onWindowResize, false);

    sig.dataRetrieved.add (function (isTransparent, elementFileIds)
    {
        load (isTransparent, elementFileIds);
    });

    load (true, ['FJ3199', 'FJ3200', 'FJ3274', 'FJ3281', 'FJ3309', 'FJ3380', 'FJ3386']);

    (function animate ()
    {
        controls.update ();
        renderer.render (scene, camera);

        requestAnimationFrame (animate);
    }) ();
};
