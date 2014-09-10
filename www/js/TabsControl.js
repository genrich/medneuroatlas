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
            loadedResult.append (createLi (concept, 'loaded'));
        });
    };

    $('#tabs').tabs (
    {
        activate: function (evnt, ui)
        {
            if (ui.newTab.text () == 'Search')
                searchText.focus ();
        },
        collapsible: true,
        hide: { effect: "blind", duration: 200 },
        show: { effect: "blind", duration: 200 },
    });

    // loaded tab ----------------------------------------------------------------------------------
    $('#toolbar').buttonset ();
    $("#toolbar_transparent").buttonset();
    $("#toolbar_opaque").buttonset();
    $("#clear_all_transparent").button ({ text: false, icons: { primary: "ui-icon-trash" }})
                               .tooltip ()
                               .click (function () { clearAllTransparent (); });
    $("#load_transparent").button ({ text: false, icons: { primary: "ui-icon-circle-plus" }})
                          .tooltip ({ show: { delay: 1000 }})
                          .click (function () { loadTransparent (); });
    $("#clear_transparent").button ({ text: false, icons: { primary: "ui-icon-circle-minus" }})
                           .tooltip ({ show: { delay: 1000 }})
                           .click (function () { clearTransparent (); });
    $("#load_opaque").button ({ text: false, icons: { primary: "ui-icon-plus" }})
                     .tooltip ({ show: { delay: 1000 }})
                     .click (function () { loadOpaque (); });
    $("#clear_opaque").button ({ text: false, icons: { primary: "ui-icon-minus" }})
                      .tooltip ({ show: { delay: 1000 }})
                      .click (function () { clearOpaque (); });
    $("#clear_all_opaque").button ({ text: false, icons: { primary: "ui-icon-trash" }})
                          .tooltip ({ show: { delay: 1000 }})
                          .click (function () { clearAllOpaque (); });
    $("#refresh").button ({ text: false, icons: { primary: "ui-icon-refresh" }})
                 .tooltip ({ show: { delay: 1000 }})
                 .click (function () { refresh (); });
    $("#help").button ({ text: false, icons: { primary: "ui-icon-help" }})
              .tooltip ({ show: { delay: 1000 }})
              .click (function () { help (); });

    $("#loaded_tab_load_type").buttonset ();

    var loadedResult = $('#loaded_result');

    // search tab ----------------------------------------------------------------------------------
    var searchText = $('#search_text'), searchResult = $('#search_result');
    $("#search_tab_load_type").buttonset ();

    $('#search_btn').button ().click (function (evnt)
    {
        searchText.prop ('disabled', true);

        var li = [];
        ontology.search (searchText.val ()).forEach (function (el)
        {
            li.push ('<li data-concept="' + el.key + '" class="ui-selectee">' + el.name + '</li>');
        });

        $('#search_result').html (li.join (''));
        $('#search_result li:first-child').addClass ('ui-selected');

        searchText.prop ('disabled', false);
    });

    searchResult.selectable (
    {
        selected: function (evnt, ui)
        {
            that.loadConcept ($(ui.selected).data ('concept'), $('#search_tab_radio_transparent').is (':checked'));
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
                    $('#search_btn').click ();
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

    // pathways tab --------------------------------------------------------------------------------
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
        this.loadConcept ('partof.FMA50801', false);
        this.loadConcept ('partof.FMA53672', true);
    }

    function clearAllTransparent ()
    {
        throw 'Not implmented yet';
    }

    function loadTransparent ()
    {
        throw 'Not implmented yet';
    }

    function clearTransparent ()
    {
        throw 'Not implmented yet';
    }

    function loadOpaque ()
    {
        throw 'Not implmented yet';
    }

    function clearOpaque ()
    {
        throw 'Not implmented yet';
    }

    function clearAllOpaque ()
    {
        throw 'Not implmented yet';
    }

    function refresh ()
    {
        loadedResult.children ('li').not ('.loaded').remove ();
        loadedResult.children ('li.loaded').children ('ul').remove ();
        loadedResult.children ('li.loaded').children ('button').children ('span')
                    .removeClass ('ui-icon-minus').addClass ('ui-icon-plus');
    }

    function help ()
    {
        $('#toolbar button').each (function (i, el)
        {
            var start = i * 2000, stop = start + 3000;
            setTimeout (function () { $(el).tooltip ('open'); }, start);
            setTimeout (function () { $(el).tooltip ('close'); }, stop);
        });
    }

    function parentsToggle (button)
    {
        var btn = $(button), span = btn.children ('span.ui-icon');
        var concept = btn.parent ().data ('concept');
        if (span.hasClass ('ui-icon-plus'))
        {
            ontology.parentConcepts (concept).done (function (parentConcepts)
            {
                parentConcepts.forEach (function (parentConcept)
                {
                    ontology.conceptRetrieved (parentConcept).done (function (parentConceptObj)
                    {
                        $.extend (parentConceptObj, { loaded: false, transparent: false });
                        btn.parent ().before (createLi (parentConceptObj));
                    });
                });
            });
            span.removeClass ('ui-icon-plus').addClass ('ui-icon-minus');
        }
        else
        {
            ontology.parentConcepts (concept).done (function (parentConcepts)
            {
                parentConcepts.forEach (function (parentConcept)
                {
                    btn.parent ().siblings ('[data-concept="' + parentConcept + '"]').remove ();
                });
            });
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
                        ul.append (createLi (concept));
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

    function createLi (concept, classes)
    {
        return $('<li/>')
            .attr ('data-concept', concept.tree + '.' + concept.id)
            .data ('transparent', concept.transparent)
            .data ('loaded', concept.loaded)
            .addClass (classes)
            .click (function (evnt)
            {
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
                                    .focus (function () { this.blur (); }));
    }
}
