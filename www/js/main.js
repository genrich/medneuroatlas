function main ()
{
    var SIGNALS = window.signals;

    var sig =
    {
        progressInitialized: new SIGNALS.Signal (),
        progressUpdated:     new SIGNALS.Signal (),
        dataRetrieved:       new SIGNALS.Signal (),
        selected:            new SIGNALS.Signal ()

    };

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

    var viewport = new Viewport (sig, $('#viewport'));

    var ontology = new Ontology (sig);

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

    $('#help').fadeTo (5000, 0, function () { $(this).hide (); $(this).css ('opacity', '0.7'); });
    $(document).keydown (function (evnt)
    {
        if (evnt.keyCode == 63 || evnt.keyCode == 191) // show help for question mark ?
        {
            $('#help').toggle ();
            evnt.preventDefault ();
        }
    });
}
