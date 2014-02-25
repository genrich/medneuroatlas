function Viewport (sig, container)
{
    var camera, scene, renderer, controls,
        projector = new THREE.Projector (),
        loader = new THREE.BinaryLoader (),
        objects            = [],
        transparentObjects = [],
        labels = [],
        pathway, spline,
        resetCamera = function () {},
        playTime, playFastFraction = 0.20, playLength = 90.0;

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

    function pathwayClear ()
    {
        if (pathway)
        {
            scene.remove (pathway);
            pathway.geometry.dispose ();
            pathway.material.dispose ();
            pathway = undefined;
        }
    }

    function labelsClear ()
    {
        labels.forEach (function (label) { label.obj.remove (); });
        labels = [];
    }

    function to2d (vec3d)
    {
        var vector = projector.projectVector (vec3d.clone(), camera);
        vector.x =  (vector.x + 1) / 2 * container.width ();
        vector.y = -(vector.y - 1) / 2 * container.height ();
        return vector;
    }

    if (! Detector.webgl) return Detector.addGetWebGLMessage ({ parent: container[0] });

    (function initThreeJs ()
    {
        camera = new THREE.PerspectiveCamera (75, container.width () / container.height (), 1, 10000);
        camera.position.set (0, -300, 1500);
        camera.up.set (0, 0, 1);

        controls = new THREE.TrackballControls (camera, container[0]);
        controls.target.set (0, -100, 1500);

        scene = new THREE.Scene ();

        scene.add (new THREE.AmbientLight (0x404040));

        var light = new THREE.DirectionalLight (0xffffff);
        light.position = camera.position;
        light.target.position = controls.target;
        scene.add (light);

        renderer = new THREE.WebGLRenderer ({ antialias: true });
        renderer.setClearColor ($('body').css ('background-color'));
        renderer.setSize (container.width (), container.height ());

        container.append (renderer.domElement);

        window.addEventListener ('resize', onWindowResize, false);
    } ());

    sig.dataRetrieved.add (function (isTransparent, elementFileIds)
    {
        load (isTransparent, elementFileIds);
    });

    function addLabels ()
    {
        labels.forEach (function (label)
        {
            container.append (label.obj);
            if      (label.obj.hasClass ('text3dX')) { label.obj.css ('margin', '-' + label.obj.outerHeight () + 'px 0 0 -' + label.obj.outerWidth () + 'px'); }
            else if (label.obj.hasClass ('text3dL')) { label.obj.css ('margin', '0 0 0 -' + label.obj.outerWidth () + 'px'); }
            else if (label.obj.hasClass ('text3dT')) { label.obj.css ('margin', '-' + label.obj.outerHeight () + 'px 0 0 0'); }
        });
    }

    sig.lightTouchPathwayShow.add (function ()
    {
        resetCamera = function ()
        {
            camera.up.set (0, 0, 1);
            camera.position.set (-110, -237, 1743);
            controls.target.set (-26, -65, 1460);
        };
        resetCamera ();

        loader.load ('data/bin/lightTouchPathway.js', function (geom, mat)
        {
            pathwayClear ();
            pathway = new THREE.Line (geom, new THREE.LineBasicMaterial ({ color: 0xff0000 }));
            scene.add (pathway);
            playLength = 90.0; playFastFraction = 0.15;
            $('#pathway_play').button ('enable');
        });

        labelsClear ();
        // hand
        labels.push ({ obj: $('<div>').addClass ('text3d').html ('Meissner\'s corpuscles, Merkel cell–neurite complex'),
                       pos: new THREE.Vector3 (-313.2165, -199.805, 661.3896) });
        // dorsal root
        labels.push ({ obj: $('<div>').addClass ('text3d').html ('Dorsal root ganglion'),
                       pos: new THREE.Vector3 (-17.4991, -74.5134, 1385.3722) });
        labels.push ({ obj: $('<img src="data/bin/neuron.gif">').addClass ('soma3d'),
                       pos: new THREE.Vector3 (-17.4991, -74.5134, 1385.3722) });
        labels.push ({ obj: $('<div>').addClass ('text3dX').html ('Cuneate tract'),
                       pos: new THREE.Vector3 (-4.013, -65.84, 1391.6848) });
        // medulla
        labels.push ({ obj: $('<div>').addClass ('text3dL').html ('Synaptic contact in<br>cuneate nucleus'),
                       pos: new THREE.Vector3 (-5.5451, -55.9149, 1469.191) });
        labels.push ({ obj: $('<img src="data/bin/synapse.gif">').addClass ('synapse3d'),
                       pos: new THREE.Vector3 (-5.2705, -55.4896, 1469.1831) });
        labels.push ({ obj: $('<img src="data/bin/neuron.gif">').addClass ('soma3d'),
                       pos: new THREE.Vector3 (-5.5451, -55.9149, 1469.191) });
        // decussation
        labels.push ({ obj: $('<div>').addClass ('text3d').html ('Decussation in caudal medulla'),
                       pos: new THREE.Vector3 (0.0008, -61.2218, 1469.1621) });
        // medial lemniscus
        labels.push ({ obj: $('<div>').addClass ('text3dX').html ('Medial lemniscus'),
                       pos: new THREE.Vector3 (1.8094, -64.8624, 1482.007) });
        // thalamus
        labels.push ({ obj: $('<img src="data/bin/synapse.gif">').addClass ('synapse3d'),
                       pos: new THREE.Vector3 (16.661, -75.3855, 1547.9036) });
        labels.push ({ obj: $('<img src="data/bin/neuron.gif">').addClass ('soma3d'),
                       pos: new THREE.Vector3 (16.937, -75.4041, 1548.7134) });
        labels.push ({ obj: $('<div>').addClass ('text3d').html ('Synaptic contact in<br>ventral posterior lateral<br>nucleus of thalamus'),
                       pos: new THREE.Vector3 (16.661, -75.3855, 1547.9036) });
        // post central gyrus
        labels.push ({ obj: $('<img src="data/bin/synapse.gif">').addClass ('synapse3d'),
                       pos: new THREE.Vector3 (38.7065, -41.2449, 1613.0336) });
        labels.push ({ obj: $('<div>').addClass ('text3d').html ('Synaptic contact in<br>primary somatic sensory cortex<br>postcentral gyrus'),
                       pos: new THREE.Vector3 (38.7065, -41.2449, 1613.0336) });
        addLabels ();

        load (true, ['FJ2810', 'FJ3161', 'FJ3164', 'FJ3167', 'FJ3170', 'FJ3172', 'FJ3176', 'FJ3177', 'FJ1769', 'FJ1831', 'FJ1797', 'FJ1782']);
    });

    sig.painAndTemperaturePathwayShow.add (function ()
    {
        resetCamera = function ()
        {
            camera.up.set (0, 0, 1);
            camera.position.set (-110, -237, 1743);
            controls.target.set (-26, -65, 1460);
        };
        resetCamera ();

        loader.load ('data/bin/painAndTemperaturePathway.js', function (geom, mat)
        {
            pathwayClear ();
            pathway = new THREE.Line (geom, new THREE.LineBasicMaterial ({ color: 0xff0000 }));
            scene.add (pathway);
            playLength = 90.0; playFastFraction = 0.15;
            $('#pathway_play').button ('enable');
        });

        labelsClear ();
        // hand
        labels.push ({ obj: $('<div>').addClass ('text3d').html ('Free nerve endings'),
                       pos: new THREE.Vector3 (-266.5705, -153.092, 732.5317) });
        // dorsal root
        labels.push ({ obj: $('<div>').addClass ('text3dL').html ('Dorsal root ganglion'),
                       pos: new THREE.Vector3 (-17.4991, -74.5134, 1385.3722) });
        labels.push ({ obj: $('<img src="data/bin/neuron.gif">').addClass ('soma3d'),
                       pos: new THREE.Vector3 (-17.4991, -74.5134, 1385.3722) });
        // dorsal horn
        labels.push ({ obj: $('<div>').addClass ('text3d').html ('Synaptic contact in dorsal horn'),
                       pos: new THREE.Vector3 (-4.0732, -68.8282, 1389.7422) });
        labels.push ({ obj: $('<img src="data/bin/synapse.gif">').addClass ('synapse3d'),
                       pos: new THREE.Vector3 (-4.0732, -68.8282, 1389.7422) });
        labels.push ({ obj: $('<img src="data/bin/neuron.gif">').addClass ('soma3d'),
                       pos: new THREE.Vector3 (-3.0912, -69.8457, 1389.7321) });
        // decussation
        labels.push ({ obj: $('<div>').addClass ('text3dX').html ('Decussation in cervical spinal cord'),
                       pos: new THREE.Vector3 (-1.5177, -70.9579, 1389.7551) });
        labels.push ({ obj: $('<div>').addClass ('text3d').html ('Anterolateral system'),
                       pos: new THREE.Vector3 (4.0784, -66.0474, 1416.4437) });
        // spinothalamic tract
        labels.push ({ obj: $('<div>').addClass ('text3d').html ('Spinothalamic tract'),
                       pos: new THREE.Vector3 (6.8719, -72.2485, 1509.0315) });
        // thalamus
        labels.push ({ obj: $('<img src="data/bin/synapse.gif">').addClass ('synapse3d'),
                       pos: new THREE.Vector3 (16.661, -75.3855, 1547.9036) });
        labels.push ({ obj: $('<img src="data/bin/neuron.gif">').addClass ('soma3d'),
                       pos: new THREE.Vector3 (16.937, -75.4041, 1548.7134) });
        labels.push ({ obj: $('<div>').addClass ('text3d').html ('Synaptic contact in<br>ventral posterior lateral<br>nucleus of thalamus'),
                       pos: new THREE.Vector3 (16.661, -75.3855, 1547.9036) });
        // post central gyrus
        labels.push ({ obj: $('<img src="data/bin/synapse.gif">').addClass ('synapse3d'),
                       pos: new THREE.Vector3 (38.7065, -41.2449, 1613.0336) });
        labels.push ({ obj: $('<div>').addClass ('text3d').html ('Synaptic contact in<br>primary somatic sensory cortex<br>postcentral gyrus'),
                       pos: new THREE.Vector3 (38.7065, -41.2449, 1613.0336) });
        addLabels ();

        load (true, ['FJ2810', 'FJ3161', 'FJ3164', 'FJ3167', 'FJ3170', 'FJ3172', 'FJ3176', 'FJ3177', 'FJ1769', 'FJ1831', 'FJ1797', 'FJ1782']);
    });

    sig.faceLightTouchPathwayShow.add (function ()
    {
        resetCamera = function ()
        {
            camera.up.set (0, 0, 1);
            camera.position.set (-78.71, -285.92, 1639.19);
            controls.target.set (-1.49,-99.17,1505.93);
        };
        resetCamera ();

        loader.load ('data/bin/faceLightTouchPathway.js', function (geom, mat)
        {
            pathwayClear ();
            pathway = new THREE.Line (geom, new THREE.LineBasicMaterial ({ color: 0xff0000 }));
            scene.add (pathway);
            playLength = 60.0; playFastFraction = 0.4;
            $('#pathway_play').button ('enable');
        });

        labelsClear ();
        // face
        labels.push ({ obj: $('<div>').addClass ('text3d').html ('Meissner\'s corpuscles<br>Merkel cell–neurite complex'),
                       pos: new THREE.Vector3 (35.242, -174.7114, 1491.4175) });
        // trigeminal ganglion
        labels.push ({ obj: $('<div>').addClass ('text3d').html ('Trigeminal ganglion'),
                       pos: new THREE.Vector3 (19.3034, -107.3621, 1525.3446) });
        labels.push ({ obj: $('<img src="data/bin/neuron.gif">').addClass ('soma3d'),
                       pos: new THREE.Vector3 (19.3034, -107.3621, 1525.3446) });
        // synapse trigeminal complex
        labels.push ({ obj: $('<div>').addClass ('text3dT').html ('Synaptic contact in<br>principal nucleus of<br>trigeminal complex'),
                       pos: new THREE.Vector3 (14.0034, -79.0316, 1520.2351) });
        labels.push ({ obj: $('<img src="data/bin/synapse.gif">').addClass ('synapse3d'),
                       pos: new THREE.Vector3 (14.0034, -79.0316, 1520.2351) });
        labels.push ({ obj: $('<img src="data/bin/neuron.gif">').addClass ('soma3d'),
                       pos: new THREE.Vector3 (13.1923, -77.0261, 1520.2151) });
        // decussation
        labels.push ({ obj: $('<div>').addClass ('text3dL').html ('Decussation in mid pons'),
                       pos: new THREE.Vector3 (-0.01, -82.5557, 1520.1931) });
        // tract
        labels.push ({ obj: $('<div>').addClass ('text3dX').html ('Trigeminal lemniscus'),
                       pos: new THREE.Vector3 (-9.3885, -78.1597, 1522.4966) });
        // thalamus
        labels.push ({ obj: $('<div>').addClass ('text3dX').html ('Synaptic contact in<br>ventral posterior medial<br>nucleus of thalamus'),
                       pos: new THREE.Vector3 (-9.2418, -76.7023, 1544.7789) });
        labels.push ({ obj: $('<img src="data/bin/synapse.gif">').addClass ('synapse3d'),
                       pos: new THREE.Vector3 (-9.2418, -76.7023, 1544.7789) });
        labels.push ({ obj: $('<img src="data/bin/neuron.gif">').addClass ('soma3d'),
                       pos: new THREE.Vector3 (-9.2503, -76.709, 1545.0573) });
        // post central gyrus
        labels.push ({ obj: $('<img src="data/bin/synapse.gif">').addClass ('synapse3d'),
                       pos: new THREE.Vector3 (-62.3792, -77.2263, 1575.3464) });
        labels.push ({ obj: $('<div>').addClass ('text3dT').html ('Synaptic contact in<br>primary somatic sensory cortex<br>postcentral gyrus'),
                       pos: new THREE.Vector3 (-62.3792, -77.2263, 1575.3464) });
        addLabels ();

        load (true, ['FJ2810', 'FJ1283', 'FJ1290', 'FJ1296', 'FJ1300', 'FJ1310', 'FJ1311',
                'FJ1312', 'FJ1315', 'FJ1318', 'FJ1325', 'FJ1326', 'FJ1333', 'FJ1341', 'FJ1347', 'FJ1351', 'FJ1361', 'FJ1362',
                'FJ1363', 'FJ1366', 'FJ1369', 'FJ1376', 'FJ1377',
                'FJ1775', 'FJ1822', 'FJ1827', 'FJ1798']);
    });

    function enableButtons ()
    {
        $('#light_touch_pathway_show')         .button ('enable');
        $('#pain_and_temperature_pathway_show').button ('enable');
        $('#face_light_touch_pathway_show')    .button ('enable');
        $('#pathway_clear')                    .button ('enable');
    }

    function disableButtons ()
    {
        $('#light_touch_pathway_show')         .button ('disable');
        $('#pain_and_temperature_pathway_show').button ('disable');
        $('#face_light_touch_pathway_show')    .button ('disable');
        $('#pathway_play')                     .button ('disable');
        $('#pathway_clear')                    .button ('disable');
    }

    sig.pathwayPlay.add (function ()
    {
        if (pathway)
        {
            disableButtons ();
            controls.enabled = false;

            camera.up.set (0, 0, 1);

            var v0 = pathway.geometry.vertices[0].clone ();
            var v1 = pathway.geometry.vertices[1].clone ();
            v0.add (new THREE.Vector3 ().subVectors (v0, v1).normalize ().multiplyScalar (100));
            var approach = new THREE.QuadraticBezierCurve3 (
                new THREE.Vector3 (camera.position.x, camera.position.y, camera.position.z),
                v0,
                pathway.geometry.vertices[0].clone ());
            spline = new THREE.SplineCurve3 (approach.getPoints (100).concat (pathway.geometry.vertices));

            playTime = 0.0;
        }
    });

    sig.pathwayClear.add (function ()
    {
        $('#pathway_play').button ('disable');
        pathwayClear ();
        labelsClear  ();
    });

    function endAnimation ()
    {
        playTime = undefined;
        resetCamera ();
        if (pathway) $('#pathway_play').button ('enable');
        enableButtons ();
        controls.enabled = true;
    }

    var prevTimestamp = 0;

    (function animate (timestamp)
    {
        if (timestamp)
        {
            var delta = (timestamp - prevTimestamp) / 1000;
            prevTimestamp = timestamp;

            if (playTime !== undefined)
            {
                playTime += delta;

                if (playTime >= playLength)
                {
                    endAnimation ();
                }
                else
                {
                    var t;
                    if (playTime < (playFastFraction * playLength))
                    {
                        t =  playTime / (playFastFraction * playLength) * (1 - playFastFraction);
                    }
                    else
                    {
                        t = (playTime - (playFastFraction * playLength)) / ((1 - playFastFraction) * playLength)
                            * playFastFraction + (1 - playFastFraction);
                    }
                    var pos = spline.getPointAt (t);
                    var dir = spline.getTangentAt (t);
                    camera.position.set (pos.x, pos.y, pos.z);
                    camera.lookAt (pos.add (dir));
                    controls.target.set (pos.x, pos.y, pos.z);
                }
            }
            else
            {
                controls.update ();
            }
        }

        renderer.render (scene, camera);

        var frustum = new THREE.Frustum ();
        frustum.setFromMatrix (new THREE.Matrix4 ().multiplyMatrices (camera.projectionMatrix, camera.matrixWorldInverse));

        labels.forEach (function (label)
        {
            if (frustum.containsPoint (label.pos))
            {
                label.obj.show ();
                var v2 = to2d (label.pos);
                label.obj.css ('left', v2.x + 'px');
                label.obj.css ('top',  v2.y + 'px');
            }
            else
            {
                label.obj.hide ();
            }
        });

        requestAnimationFrame (animate);
    }) ();

    load (true, ['FJ3199', 'FJ3200', 'FJ3274', 'FJ3281', 'FJ3309', 'FJ3380', 'FJ3386']);
};
