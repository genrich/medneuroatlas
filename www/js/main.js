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

    var viewport = new Viewport (sig, $('#viewport'));

    if (! window.indexedDB)
    {
        var element = Detector.getWebGLErrorMessage ();
        element.innerHTML = "Your browser doesn't support the Indexed Database API. Please use a browser with better support for "
                            + " <a href='http://caniuse.com/indexeddb' style='color:#000'>IndexedDB</a>";
        $('#viewport').append (element);
        throw 'IndexedDB not supported';
    }

    var ontology = new Ontology ();

    var control = new TabsControl (sig, ontology, viewport);
}
