function main ()
{
    var SIGNALS = window.signals;

    var sig =
    {
        progressInitialized:           new SIGNALS.Signal (),
        progressUpdated:               new SIGNALS.Signal (),
        dataRetrieved:                 new SIGNALS.Signal (),
        selected:                      new SIGNALS.Signal (),
        organsInitialized:             new SIGNALS.Signal (),
        lightTouchPathwayShow:         new SIGNALS.Signal (),
        painAndTemperaturePathwayShow: new SIGNALS.Signal (),
        faceLightTouchPathwayShow:     new SIGNALS.Signal (),
        pathwayPlay:                   new SIGNALS.Signal (),
        pathwayClear:                  new SIGNALS.Signal (),
    };
    sig.organsInitialized.memorize = true;

    function initView ()
    {
        if (location.hash)
        {
            var str = decodeURI (location.hash.substring (1));
            var strs = str.split ('|'); if (strs.length != 2) return;

            var solidOrgan       = strs[0];
            var transparentOrgan = strs[1];

            var solid = solidOrgan.split ('.');       if (strs.length != 2) return;
            var trans = transparentOrgan.split ('.'); if (strs.length != 2) return;

            sig.organsInitialized.dispatch (solid[0], solid[1], trans[0], trans[1]);
        }
        else
        {
            sig.organsInitialized.dispatch ('partOf', 'FMA50801', 'partOf', 'FMA53672');
        }
    }

    (function initHelp ()
    {
        $('#help').fadeTo (5000, 0, function ()
        {
            $(this).hide ();
            $(this).css ('opacity', '0.7');
            initView ();
        });

        $(document).keydown (function (evnt)
        {
            if (evnt.keyCode == 63 || evnt.keyCode == 191) // show help for question mark ?
            {
                $('#help').toggle ();
                evnt.preventDefault ();
            }
        });
    }) ();

    (function initPathwayControls ()
    {
        $('#light_touch_pathway_show')         .button ().click (function (evnt) { sig.lightTouchPathwayShow        .dispatch (); });
        $('#pain_and_temperature_pathway_show').button ().click (function (evnt) { sig.painAndTemperaturePathwayShow.dispatch (); });
        $('#face_light_touch_pathway_show')    .button ().click (function (evnt) { sig.faceLightTouchPathwayShow    .dispatch (); });
        $('#pathway_clear')                    .button ().click (function (evnt) { sig.pathwayClear                 .dispatch (); });

        $('#pathway_play').button ({ disabled: true, text: false, icons: { primary: "ui-icon-play" }})
                          .click  (function (evnt) { sig.pathwayPlay.dispatch (); });
    }) ();

    (function initProgressBar ()
    {
        var progressUI      = $('#progressbar'),
            progressLabelUI = $('.progress-label'),
            progressLabel   = '',
            progressDisableTimeout;

        function disableProgressBar ()
        {
            progressLabel = '';
            progressLabelUI.text ('');
            progressUI.progressbar ('destroy');
        }

        sig.progressInitialized.add (function (label, maxValue)
        {
            progressUI.progressbar (
            {
                value:    0,
                max:      maxValue,
                change:   function ()
                {
                    progressLabelUI.text (progressLabel + ' ' + progressUI.progressbar ('value'));
                },
                complete: function ()
                {
                    progressLabelUI.text (progressLabel + ' done!');
                    progressDisableTimeout = setTimeout (disableProgressBar, 5000);
                }
            });

            clearTimeout (progressDisableTimeout);

            progressLabel = label;
        });

        sig.progressUpdated.add (function (val)
        {
            progressUI.progressbar ('value', val);
        });

    }) ();

    (function initSeachDialog ()
    {
        var searchUI       = $('#search'),
            searchResultUI = $('#search-result');
        
        searchResultUI.selectable ();

        searchUI.keydown (function (evnt)
        {
            if (evnt.keyCode == 38 || evnt.keyCode == 40) 
                evnt.preventDefault ();
        });

        searchUI.keyup (function (evnt)
        {
            switch (evnt.keyCode)
            {
            case 13: // enter
                if (evnt.ctrlKey)
                {
                    var selected = $('.ui-selected', searchResultUI);
                    if (selected.length)
                        sig.selected.dispatch (selected.data ('flag'), false, selected.data ('concept'));
                }
                else if (evnt.shiftKey)
                {
                    var selected = $('.ui-selected', searchResultUI);
                    if (selected.length)
                        sig.selected.dispatch (selected.data ('flag'), true, selected.data ('concept'));
                }
                else
                {
                    ontology.search (searchUI.val ());
                }
                break;
            case 38: // up
                var selected = $('.ui-selected', searchResultUI);
                    last     = $('li:last',      searchResultUI);
                if (selected.length)
                {
                    selected.removeClass ('ui-selected');
                    (selected.prev ('li').length ? selected.prev ('li') : last).addClass ('ui-selected');
                }
                else
                {
                    last.addClass ('ui-selected');
                }
                break;
            case 40: // down
                var selected = $('.ui-selected',   searchResultUI);
                    first    = $('li:first-child', searchResultUI);
                if (selected.length)
                {
                    selected.removeClass ('ui-selected');
                    (selected.next ('li').length ? selected.next ('li') : first).addClass ('ui-selected');
                }
                else
                {
                    first.addClass ('ui-selected');
                }
                break;
            }
        });

        searchUI.focus ();
    }) ();

    var viewport = new Viewport (sig, $('#viewport'));

    if (! window.indexedDB)
    {
        var element = Detector.getWebGLErrorMessage ();
        element.innerHTML = "Your browser doesn't support the Indexed Database API. Please use a browser with better support for "
                            + " <a href='http://caniuse.com/indexeddb' style='color:#000'>IndexedDB</a>";
        $('#viewport').append (element);
        throw 'IndexedDB not supported';
    }

    var ontology = new Ontology (sig);
}
