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

    if (!Detector.webgl || !window.indexedDB)
    {
        $('body').empty ();

        if (!Detector.webgl)
            Detector.addGetWebGLMessage ();

        if (!window.indexedDB)
        {
            var element = Detector.getWebGLErrorMessage ();
            element.innerHTML = "Your browser doesn't support the Indexed Database API. Please use a browser with better support for "
                                + " <a href='http://caniuse.com/indexeddb' style='color:#000'>IndexedDB</a>";
            $('body').append (element);
        }

        throw 'IndexedDB or WebGL not supported';
    }

    new TabsControl (sig, new Ontology (), new Viewport (sig, $('#viewport')));
}
