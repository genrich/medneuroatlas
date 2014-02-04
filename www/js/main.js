function main (parentElement)
{
    var SIGNALS = window.signals;

    var sig =
    {
        progressInitialized: new SIGNALS.Signal (),
        progressUpdated:     new SIGNALS.Signal ()
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

        progressDisableTimeout = setTimeout (disableProgressBar, 1);
    }) ();

    parentElement.append (new ThreeJsCanvas ());

    var ontology = new Ontology (sig);

    (function initSeachDialog ()
    {
        var searchUI = $('#search');
        
        searchUI.keyup (function (evnt)
        {
            if (evnt.keyCode == 13)
                ontology.searchPartOf (searchUI.val ());
        });

        searchUI.focus ();
    }) ();
}
