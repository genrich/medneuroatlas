function Viewport (sig, container)
{
    var camera, scene, renderer, controls, light,
        projector = new THREE.Projector (),
        binaryLoader = new THREE.BinaryLoader (true),
        opaqueObjects = [],
        transparentObjects = [],
        elements = [],
        labels = [],
        pathway, spline,
        resetCamera = function () {},
        playTime, playFastFraction = 0.20, playLength = 90.0;

    scene = new THREE.Scene ();

    scene.add (new THREE.AmbientLight (0x404040));

    light = new THREE.DirectionalLight (0xffffff);
    scene.add (light);

    camera = new THREE.PerspectiveCamera (75, container.width () / container.height (), 1, 10000);
    camera.position.set (0, -300, 1500);
    camera.up.set (0, 0, 1);

    controls = new THREE.TrackballControls (camera, container[0]);
    controls.target.set (0, -100, 1500);
    controls.addEventListener ('change', updateLightPosition);
    updateLightPosition ();

    renderer = new THREE.WebGLRenderer ({ antialias: true });
    renderer.setClearColor ($('body').css ('background-color'));
    renderer.setSize (container.width (), container.height ());

    container.append (renderer.domElement);

    window.addEventListener ('resize', onWindowResize, false);

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

                    updateLightPosition ();
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

    this.show = function (concept)
    {
        concept.fileIds.forEach (function (fileId)
        {
            if (!elements[fileId])
                elements[fileId] = {};

            elements[fileId].loaded = true;
            elements[fileId].transparent = concept.transparent;

            updateElement (fileId);
        });
    }

    this.select = function (concept)
    {
        concept.fileIds.forEach (function (fileId)
        {
            if (!elements[fileId])
                elements[fileId] = {};

            elements[fileId].selected = true;

            updateElement (fileId);
        });
    }

    this.hide = function (concept)
    {
        concept.fileIds.forEach (function (fileId)
        {
            if (elements[fileId])
            {
                elements[fileId].loaded = false;

                if (!elements[fileId].selected)
                {
                    elements[fileId].transparent = false;
                    scene.remove (elements[fileId].mesh);
                }
            }
        });
    }

    this.deselect = function (concept)
    {
        concept.fileIds.forEach (function (fileId)
        {
            if (elements[fileId])
            {
                elements[fileId].selected = false;

                scene.remove (elements[fileId].mesh);

                if (elements[fileId].loaded)
                {
                    updateMesh (elements[fileId]);
                    scene.add (elements[fileId].mesh);
                }
                else
                {
                    elements[fileId].transparent = false;
                }
            }
        });
    }

    function onWindowResize ()
    {
        camera.aspect = container.width () / container.height ();
        camera.updateProjectionMatrix ();

        renderer.setSize (container.width (), container.height ());
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

    function updateLightPosition ()
    {
        light.position.copy (camera.position);
        light.target.position.copy (controls.target);
    };

    sig.lightTouchPathwayShow.add (function ()
    {
        resetCamera = function ()
        {
            camera.up.set (0, 0, 1);
            camera.position.set (-110, -237, 1743);
            controls.target.set (-26, -65, 1460);
            updateLightPosition ();
        };
        resetCamera ();

        binaryLoader.load ('data/bin/lightTouchPathway.js', function (geom, mat)
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
    });

    sig.painAndTemperaturePathwayShow.add (function ()
    {
        resetCamera = function ()
        {
            camera.up.set (0, 0, 1);
            camera.position.set (-110, -237, 1743);
            controls.target.set (-26, -65, 1460);
            updateLightPosition ();
        };
        resetCamera ();

        binaryLoader.load ('data/bin/painAndTemperaturePathway.js', function (geom, mat)
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
    });

    sig.faceLightTouchPathwayShow.add (function ()
    {
        resetCamera = function ()
        {
            camera.up.set (0, 0, 1);
            camera.position.set (-78.71, -285.92, 1639.19);
            controls.target.set (-1.49,-99.17,1505.93);
            updateLightPosition ();
        };
        resetCamera ();

        binaryLoader.load ('data/bin/faceLightTouchPathway.js', function (geom, mat)
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

    function updateElement (fileId)
    {
        if (elements[fileId].mesh)
        {
            scene.remove (elements[fileId].mesh);
            updateMesh (elements[fileId]);
            scene.add (elements[fileId].mesh);
        }
        else
        {
            var fileUrl = 'data/bin/' + fileId + '.js';
            $.ajax ({ url: fileUrl, type: 'HEAD' }).done (function ()
            {
                binaryLoader.load (fileUrl, function (geometry, material)
                {
                    if (elements[fileId].mesh)
                        geometry.dispose ();
                    else
                        elements[fileId].mesh = new THREE.Mesh (geometry, new THREE.MeshLambertMaterial ());

                    updateMesh (elements[fileId]);
                    scene.add (elements[fileId].mesh);
                });
            });
        }
    }

    function updateMesh (element)
    {
        if (element.selected)
        {
            element.mesh.material.setValues ({ color: 0xBB9900 });
            element.mesh.material.setValues ({ transparent: false, depthWrite: true });
        }
        else
        {
            element.mesh.material.setValues ({ color: 0x777777 });
            if (element.transparent)
            {
                element.mesh.material.setValues ({ transparent: true, opacity: 0.3, depthWrite: false });
            }
            else
            {
                element.mesh.material.setValues ({ transparent: false, depthWrite: true });
            }
        }
    }
}
