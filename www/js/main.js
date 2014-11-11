function main ()
{
    var sig =
    {
        lightTouchPathwayShow:         new signals.Signal (),
        painAndTemperaturePathwayShow: new signals.Signal (),
        faceLightTouchPathwayShow:     new signals.Signal (),
        pathwayPlay:                   new signals.Signal (),
        pathwayClear:                  new signals.Signal (),
    };

    if (!Detector.webgl)
    {
        $('body').empty ();
        Detector.addGetWebGLMessage ();
        throw 'WebGL not supported';
    }

    new TabsControl (sig, new Ontology (), new Viewport (sig, $('#viewport')));
}
