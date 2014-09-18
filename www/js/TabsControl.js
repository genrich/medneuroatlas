function TabsControl (sig, ontology, viewport)
{
    var that = this,
        conceptId = $('#concept_id');

    // tabs ----------------------------------------------------------------------------------------
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
    $('#loaded_toolbar').buttonset ();
    $("#toolbar_transparent").buttonset();
    $("#toolbar_opaque").buttonset();
    $("#loaded_btn_pin_transparent").button ({ text: false, icons: { primary: "ui-icon-radio-off" }})
                                    .tooltip ({ show: { delay: 1000 }})
                                    .click (function () { pinTransparent (true); });
    $("#btn_unpin_all_transparent").button ({ text: false, icons: { primary: "ui-icon-trash" }})
                                   .tooltip ({ show: { delay: 1000 }})
                                   .click (function () { unpinAllTransparent (); });
    $("#loaded_btn_pin_opaque").button ({ text: false, icons: { primary: "ui-icon-bullet" }})
                               .tooltip ({ show: { delay: 1000 }})
                               .click (function () { pinOpaque (true); });
    $("#btn_unpin_all_opaque").button ({ text: false, icons: { primary: "ui-icon-trash" }})
                              .tooltip ({ show: { delay: 1000 }})
                              .click (function () { unpinAllOpaque (); });
    $("#btn_unpin").button ({ text: false, icons: { primary: "ui-icon-extlink" }})
                   .tooltip ({ show: { delay: 1000 }})
                   .click (function () { unpinSelected (); });
    $("#btn_refresh").button ({ text: false, icons: { primary: "ui-icon-refresh" }})
                     .tooltip ({ show: { delay: 1000 }})
                     .click (function () { refresh (); });
    $("#btn_help").button ({ text: false, icons: { primary: "ui-icon-help" }})
                  .tooltip ({ show: { delay: 1000 }})
                  .click (function () { help (); });

    var loadedResult = $('#loaded_result');

    // search tab ----------------------------------------------------------------------------------
    var searchText = $('#search_text'), searchResult = $('#search_result');
    $("#search_btn_pin_transparent").button ({ text: false, icons: { primary: "ui-icon-radio-off" }})
                                    .tooltip ({ show: { delay: 1000 }})
                                    .click (function () { pinTransparent (false); });
    $("#search_btn_pin_opaque").button ({ text: false, icons: { primary: "ui-icon-bullet" }})
                               .tooltip ({ show: { delay: 1000 }})
                               .click (function () { pinOpaque (false); });

    $('#search_btn').button ().click (function (evnt)
    {
        searchText.prop ('disabled', true);

        // deselect
        var selectedSearchResult = $('li.ui-selected', searchResult);
        if (selectedSearchResult.length != 0)
        {
            // conceptId.text ('');
            ontology.conceptRetrieved (selectedSearchResult.data ('concept')).done (function (concept)
            {
                viewport.deselect (concept);
            });
        }

        var li = [];
        ontology.search (searchText.val ()).forEach (function (el)
        {
            li.push ('<li data-concept="' + el.key + '" class="ui-selectee">' + el.name + '</li>');
        });

        searchResult.html (li.join (''));

        searchText.prop ('disabled', false);
    });

    searchResult.selectable (
    {
        selected: function (evnt, ui)
        {
            var key = $(ui.selected).data ('concept');
            // conceptId.text (key);
            ontology.conceptRetrieved (key).done (function (concept)
            {
                viewport.select (concept);
            });
        },
        unselected: function (evnt, ui)
        {
            var key = $(ui.unselected).data ('concept');
            // conceptId.text ('');
            ontology.conceptRetrieved (key).done (function (concept)
            {
                viewport.deselect (concept);
            });
        }
    });

    searchText.keydown (function (evnt)
    {
        if (evnt.keyCode == 38 || evnt.keyCode == 40 || evnt.keyCode == 188) // up/down/,
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
                        showConcept (selected.data ('concept'), false);
                }
                else if (evnt.shiftKey)
                {
                    var selected = $('.ui-selected', searchResult);
                    if (selected.length)
                        showConcept (selected.data ('concept'), true);
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
    $('#light_touch_pathway_show').button ().click (function (evnt)
    {
        showConcept ('isa.FMA7163',   true);
        showConcept ('isa.FMA9915',   true);
        showConcept ('isa.FMA62004',  true);
        showConcept ('isa.FMA258716', true);
        showConcept ('isa.FMA72666',  true);

        sig.lightTouchPathwayShow.dispatch ();
    });

    $('#pain_and_temperature_pathway_show').button ().click (function (evnt)
    {
        showConcept ('isa.FMA7163',   true);
        showConcept ('isa.FMA9915',   true);
        showConcept ('isa.FMA62004',  true);
        showConcept ('isa.FMA258716', true);
        showConcept ('isa.FMA72666',  true);

        sig.painAndTemperaturePathwayShow.dispatch ();
    });

    $('#face_light_touch_pathway_show').button ().click (function (evnt)
    {
        showConcept ('isa.FMA7163',   true);
        showConcept ('isa.FMA52640',  true);
        showConcept ('isa.FMA52623',  true);
        showConcept ('isa.FMA67943',  true);
        showConcept ('isa.FMA258714', true);
        showConcept ('isa.FMA72665',  true);

        sig.faceLightTouchPathwayShow    .dispatch ();
    });

    $('#pathway_clear').button ().click (function (evnt)
    {
        unpinAllTransparent ();
        unpinAllOpaque ();
        sig.pathwayClear.dispatch ();
    });

    $('#pathway_play').button ({ disabled: true, text: false, icons: { primary: "ui-icon-play" }})
        .click  (function (evnt) { sig.pathwayPlay.dispatch (); });

    // global keys
    $(document).keydown (function (evnt)
    {
        switch (evnt.keyCode)
        {
        case 188: // ,
            $('#tabs').tabs ('option', 'active', 0);
            break;
        case 190: // .
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

        showConcept (opaqueOrgan, false);
        showConcept (transparentOrgan, true);
    }
    else
    {
        showConcept ('partof.FMA50801', false);
        showConcept ('partof.FMA53672', true);
    }

    function pinTransparent (isFromLoadedTab)
    {
        if (isFromLoadedTab)
        {
            var selected = $('li > span.ui-selected', loadedResult);
            selected.parent ().addClass ('loaded transparent');
            viewport.show ({ transparent: true, fileIds: selected.parent ().data ('fileIds') });
        }
        else
        {
            var selected = $('li.ui-selected', searchResult);
            if (selected.length != 0)
                showConcept (selected.data ('concept'), true);
        }
    }

    function unpinAllTransparent ()
    {
        loadedResult.children ('.loaded.transparent').each (function (i, el)
        {
            viewport.hide ({ fileIds: $(el).data ('fileIds') });
            $(el).remove ();
        });
    }

    function pinOpaque (isFromLoadedTab)
    {
        if (isFromLoadedTab)
        {
            var selected = $('li > span.ui-selected', loadedResult);
            selected.parent ().addClass ('loaded').removeClass ('transparent');
            viewport.show ({ transparent: false, fileIds: selected.parent ().data ('fileIds') });
        }
        else
        {
            var selected = $('li.ui-selected', searchResult);
            if (selected.length != 0)
                showConcept (selected.data ('concept'), false);
        }
    }

    function unpinAllOpaque ()
    {
        loadedResult.children ('.loaded').not ('.transparent').each (function (i, el)
        {
            viewport.hide ({ fileIds: $(el).data ('fileIds') });
            $(el).remove ();
        });
    }

    function unpinSelected ()
    {
        var selected = $('li > span.ui-selected', loadedResult);
        selected.parent ().removeClass ();
        selected.parent ().children ('ul').remove ();
        selected.parent ().children ('button').children ('span').removeClass ('ui-icon-minus').addClass ('ui-icon-plus');

        selected.removeClass ('ui-selected');
        if (selected.length != 0)
        {
            viewport.deselect ({ fileIds: selected.parent ().data ('fileIds') });
            viewport.hide     ({ fileIds: selected.parent ().data ('fileIds') });
        }
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
        $('#loaded_toolbar button').each (function (i, el)
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
        var isLoaded = btn.parent ().hasClass ('loaded');
        var isTransparent = btn.parents ('li.transparent').length !== 0;

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
                        ul.append (createLi (concept, isLoaded ? 'loaded' + (isTransparent ? ' transparent' : '') : ''));
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
            .attr ('data-concept', concept.key)
            .data ('fileIds', concept.fileIds)
            .addClass (classes)
            .append ($('<button/>').button ({ text: false, icons: { primary: 'ui-icon-plus'}})
                                   .removeClass ('ui-button-icon-only')
                                   .click (function (evnt) { parentsToggle (this); evnt.stopPropagation (); })
                                   .focus (function () { this.blur (); }))
            .append ($('<span/>').text (concept.name).click (function (evnt) { select (this); evnt.stopPropagation (); }))
            .append ($('<button/>').button ({ text: false, icons: { primary: 'ui-icon-plus'}})
                                   .removeClass ('ui-button-icon-only')
                                   .click (function (evnt) { childrenToggle (this); evnt.stopPropagation (); })
                                   .focus (function () { this.blur (); }));
    }

    function showConcept (treeConceptId, isTransparent)
    {
        ontology.conceptRetrieved (treeConceptId).done (function (concept)
        {
            concept.transparent = isTransparent;
            viewport.show (concept);
            loadedResult.append (createLi (concept, 'loaded' + (isTransparent ? ' transparent' : '')));
            console.log (concept.name + '(' + treeConceptId + ')');
        });
    };

    function select (that)
    {
        var oldSelected = $('li > span.ui-selected', loadedResult);
        deselectSpan (oldSelected);

        if (!oldSelected.is ($(that)))
            selectSpan ($(that));
    }

    function selectSpan (liSpan)
    {
        // conceptId.text (liSpan.parent ().data ('concept'));

        liSpan.addClass ('ui-selected');

        if (liSpan.parent ().hasClass ('transparent'))
            var isTransparent = true;

        viewport.select ({ transparent: isTransparent, fileIds: liSpan.parent ().data ('fileIds') });
    }

    function deselectSpan (liSpan)
    {
        // conceptId.text ('');

        liSpan.removeClass ('ui-selected');

        if (liSpan.length != 0)
            viewport.deselect ({ fileIds: liSpan.parent ().data ('fileIds') });
    }
}
