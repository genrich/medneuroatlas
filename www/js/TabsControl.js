function TabsControl (sig, ontology, viewport)
{
    var concepts = [];
    var that = this;

    this.loadConcept = function (treeConceptId, isTransparent)
    {
        ontology.conceptRetrieved (treeConceptId).done (function (concept)
        {
            $.extend (concept, { loaded: true, transparent: isTransparent });
            viewport.load (concept);
            appendLi (concept, loadedResult);
        });
    };

    $('#tabs').tabs (
    {
        activate: function (evnt, ui)
        {
            if (ui.newTab.text () == 'Search')
                $('#search-text').focus ();
        },
        collapsible: true,
        hide: { effect: "blind", duration: 200 },
        show: { effect: "blind", duration: 200 },
    });

    // loaded tab
    $('#toolbar').buttonset ();
    $("#toolbar-transparent").buttonset();
    $("#toolbar-opaque").buttonset();
    $("#clear-all-transparent").button ({ text: false, icons: { primary: "ui-icon-trash" }})
                               .click (function () { clearAllTransparent (); });
    $("#load-transparent").button ({ text: false, icons: { primary: "ui-icon-circle-plus" }})
                          .click (function () { loadTransparent (); });
    $("#clear-transparent").button ({ text: false, icons: { primary: "ui-icon-circle-minus" }})
                           .click (function () { clearTransparent (); });
    $("#load-opaque").button ({ text: false, icons: { primary: "ui-icon-plus" }})
                     .click (function () { loadOpaque (); });
    $("#clear-opaque").button ({ text: false, icons: { primary: "ui-icon-minus" }})
                      .click (function () { clearOpaque (); });
    $("#clear-all-opaque").button ({ text: false, icons: { primary: "ui-icon-trash" }})
                          .click (function () { clearAllOpaque (); });

    var loadedResult = $('#loaded-result');

    // search tab
    var searchText = $('#search-text'), searchResult = $('#search-result');
    $("#load-type").buttonset ();
    $('#search-btn').button ().click (function (evnt) { ontology.search (searchText.val ()); });
    $('#search-text').addClass ('ui-button ui-corner-all');

    searchResult.selectable (
    {
        selected: function (evnt, ui)
        {
            that.loadConcept ($(ui.selected).data ('concept'), $('#radio-transparent').is (':checked'));
        }
    });

    searchText.keydown (function (evnt)
    {
        if (evnt.keyCode == 38 || evnt.keyCode == 40 || evnt.keyCode == 189) // up/down/#
            evnt.preventDefault ();
    });

    searchText.keyup (function (evnt)
    {
        switch (evnt.keyCode)
        {
            case 13: // enter
                if (evnt.ctrlKey)
                {
                    var selected = $('.ui-selected', searchResult);
                    if (selected.length)
                        that.loadConcept (selected.data ('concept'), false);
                }
                else if (evnt.shiftKey)
                {
                    var selected = $('.ui-selected', searchResult);
                    if (selected.length)
                        that.loadConcept (selected.data ('concept'), true);
                }
                else
                {
                    $('#search-btn').click ();
                }
                break;
            case 38: // up
                var selected = $('.ui-selected', searchResult);
                    last     = $('li:last',      searchResult);
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
                var selected = $('.ui-selected',   searchResult);
                first    = $('li:first-child', searchResult);
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

    // pathways tab
    $('#light_touch_pathway_show')         .button ().click (function (evnt) { sig.lightTouchPathwayShow        .dispatch (); });
    $('#pain_and_temperature_pathway_show').button ().click (function (evnt) { sig.painAndTemperaturePathwayShow.dispatch (); });
    $('#face_light_touch_pathway_show')    .button ().click (function (evnt) { sig.faceLightTouchPathwayShow    .dispatch (); });
    $('#pathway_clear')                    .button ().click (function (evnt) { sig.pathwayClear                 .dispatch (); });

    $('#pathway_play').button ({ disabled: true, text: false, icons: { primary: "ui-icon-play" }})
        .click  (function (evnt) { sig.pathwayPlay.dispatch (); });

    // global keys
    $(document).keydown (function (evnt)
    {
        switch (evnt.keyCode)
        {
        case 189: // #
            $('#tabs').tabs ('option', 'active', 0);
            break;
        case 191: // /
            $('#tabs').tabs ('option', 'active', 1);
            break;
        case 27:
            $('#tabs').tabs ('option', 'active', false);
            break;
        }
    });

    // init view
    if (location.hash)
    {
        var str = decodeURI (location.hash.substring (1));
        var strs = str.split ('|'); if (strs.length != 2) return;

        var opaqueOrgan      = strs[0];
        var transparentOrgan = strs[1];

        this.loadConcept (opaqueOrgan, false);
        this.loadConcept (transparentOrgan, true);
    }
    else
    {
        that.loadConcept ('partof.FMA50801', false);
        that.loadConcept ('partof.FMA53672', true);
    }

    function clearAllTransparent ()
    {
        console.log ('clearAllTransparent');
    }

    function loadTransparent ()
    {
        console.log ('loadTransparent');
    }

    function clearTransparent ()
    {
        console.log ('clearTransparent');
    }

    function loadOpaque ()
    {
        console.log ('loadOpaque');
    }

    function clearOpaque ()
    {
        console.log ('clearOpaque');
    }

    function clearAllOpaque ()
    {
        console.log ('clearAllOpaque');
    }

    function childrenToggle (btn)
    {
        console.log ('childrenToggle');
        console.log (btn);
    }

    function parentsToggle (button)
    {
        var btn = $(button), span = btn.children ('span.ui-icon');
        if (span.hasClass ('ui-icon-plus'))
        {
            span.removeClass ('ui-icon-plus').addClass ('ui-icon-minus');
            ontology.parentConcepts (btn.parent ().data ('concept')).done (function (concepts)
            {
                concepts.forEach (function (concept)
                {
                    console.log (concept);
                });
            });
        }
        else
        {
            span.removeClass ('ui-icon-minus').addClass ('ui-icon-plus');
        }
    }

    function childrenToggle (button)
    {
        var btn = $(button), span = btn.children ('span.ui-icon');
        if (span.hasClass ('ui-icon-plus'))
        {
            span.removeClass ('ui-icon-plus').addClass ('ui-icon-minus');
            ontology.childConcepts (btn.parent ().data ('concept')).done (function (concepts)
            {
                var ul = $('<ul/>').appendTo (btn.parent ());
                concepts.forEach (function (treeConceptId)
                {
                    ontology.conceptRetrieved (treeConceptId).done (function (concept)
                    {
                        $.extend (concept, { loaded: false, transparent: false });
                        appendLi (concept, ul);
                    });
                });
            });
        }
        else
        {
            $('+ ul', btn).remove ();
            span.removeClass ('ui-icon-minus').addClass ('ui-icon-plus');
        }
    }

    function appendLi (concept, parnt)
    {
        $('<li/>')
            .data ('concept', concept.tree + '.' + concept.id)
            .data ('transparent', concept.transparent)
            .data ('loaded', concept.loaded)
            .addClass ('loaded root')
            .click (function (evnt)
            {
                console.log (this);
                $('li > span.ui-selected', loadedResult).removeClass ('ui-selected');
                $('> span', $(this)).addClass ('ui-selected');
                evnt.stopPropagation ();
            })
            .append ($('<button/>').button ({ text: false, icons: { primary: 'ui-icon-plus'}})
                                    .removeClass ('ui-button-icon-only')
                                    .click (function () { parentsToggle (this); })
                                    .focus (function () { this.blur (); }))
            .append ($('<span/>').text (concept.name))
            .append ($('<button/>').button ({ text: false, icons: { primary: 'ui-icon-plus'}})
                                    .removeClass ('ui-button-icon-only')
                                    .click (function () { childrenToggle (this); })
                                    .focus (function () { this.blur (); }))
            .appendTo (parnt);
    }
}
