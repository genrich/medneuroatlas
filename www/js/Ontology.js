function Ontology ()
{
    const dbName = 'medneuroatlas', dbVersion = 3;
    const load_batch = 100;

    var dbDeferred, localStorageDeferred;

    this.search = function (str)
    {
        var deferred = $.Deferred ();

        getLocalStorage ().done (function ()
        {
            var results = [], foundCount = 0;
            const limit = 30;

            for (var i = 0; i < localStorage.length; i++)
            {
                var key = localStorage.key (i); // key = '(isa|partof).FMA123'
                var name = localStorage.getItem (key);
                if (name.indexOf (str) !== -1)
                {
                    ++foundCount;
                    results.push ({ key: key, name: name });
                }

                if (foundCount >= limit)
                    break;
            }

            deferred.resolve (results);
        });

        return deferred.promise ();
    };

    this.conceptRetrieved = function (treeConceptId)
    {
        var deferred = $.Deferred ();

        getDB ().done (function (db)
        {
            var concept = parseConcept (treeConceptId);
            var storeName = concept.tree + '_element_parts';

            var request = db.transaction (storeName).objectStore (storeName).get (concept.id);
            request.onsuccess = function (evnt)
            {
                deferred.resolve ({ tree:    concept.tree,
                                    id:      concept.id,
                                    key:     treeConceptId,
                                    name:    evnt.target.result.name,
                                    fileIds: evnt.target.result.elementFileIds });
            };

            request.onerror = function ()
            {
                deferred.reject ();
            }
        });

        return deferred.promise ();
    }

    this.parentConcepts = function (treeConceptId)
    {
        var vals = treeConceptId.split ('.');
        var tree = vals[0], conceptId = vals[1];

        var deferred = $.Deferred (), parents = [], storeName = tree + '_inclusion_relation_list';

        getDB ().done (function (db)
        {
            db.transaction (storeName).objectStore (storeName)
                .index ('childId').openCursor (IDBKeyRange.only (conceptId)).onsuccess = function (evnt)
                {
                    var cursor = evnt.target.result;
                    if (cursor)
                    {
                        parents.push (tree + '.' + cursor.value.parentId);
                        cursor.continue ();
                    }
                    else
                    {
                        deferred.resolve (parents);
                    }
                };
            return deferred.promise ();
        });
        return deferred.promise ();
    };

    this.childConcepts = function (treeConceptId)
    {
        var vals = treeConceptId.split ('.');
        var tree = vals[0], conceptId = vals[1];

        var deferred = $.Deferred (), children = [], storeName = tree + '_inclusion_relation_list';

        getDB ().done (function (db)
        {
            db.transaction (storeName).objectStore (storeName)
                .index ('parentId').openCursor (IDBKeyRange.only (conceptId)).onsuccess = function (evnt)
                {
                    var cursor = evnt.target.result;
                    if (cursor)
                    {
                        children.push (tree + '.' + cursor.value.childId);
                        cursor.continue ();
                    }
                    else
                    {
                        deferred.resolve (children);
                    }
                };
        });
        return deferred.promise ();
    }

    function getLocalStorage ()
    {
        if (!localStorageDeferred)
        {
            localStorageDeferred = $.Deferred ();

            if (localStorage.length == 0)
            {
                $.when (loadSearchablePartsList ('isa',    'isa_parts_list_e'),
                        loadSearchablePartsList ('partof', 'partof_parts_list_e'))
                .then (function ()
                {
                    localStorageDeferred.resolve ();
                });
            }
            else
            {
                localStorageDeferred.resolve ();
            }
        }

        return localStorageDeferred.promise ();
    }

    function getDB ()
    {
        var dbUpgraded, dbDataLoaded = [];

        if (!dbDeferred)
        {
            if (!window.indexedDB)
            {
                var element = Detector.getWebGLErrorMessage ();
                element.innerHTML = "Your browser doesn't support the Indexed Database API. Please use a browser with better support for "
                                    + " <a href='http://caniuse.com/indexeddb' style='color:#000'>IndexedDB</a>";
                element.style.position = 'relative';
                element.style.zIndex = 100;

                $('body').empty ();
                $('body').append (element);

                throw 'IndexedDB not supported';
            }

            dbDeferred = $.Deferred ();

            var request = indexedDB.open (dbName, dbVersion);

            request.onsuccess = function (evnt)
            {
                if (dbUpgraded)
                    $.when.apply ($, dbDataLoaded).then (function () { dbDeferred.resolve (evnt.target.result); });
                else
                    dbDeferred.resolve (evnt.target.result);
            }

            request.onupgradeneeded = function (evnt)
            {
                dbUpgraded = $.Deferred ();
                var db = evnt.target.result;
                var objectStore;

                ['isa_parts_list_e', 'partof_parts_list_e'].forEach (function (storeName)
                {
                    if (db.objectStoreNames.contains (storeName))
                        db.deleteObjectStore (storeName);
                    objectStore = db.createObjectStore (storeName, { keyPath: 'conceptId' });
                    objectStore.createIndex ('representationId', 'representationId', { unique: true });
                });

                ['isa_inclusion_relation_list', 'partof_inclusion_relation_list'].forEach (function (storeName)
                {
                    if (db.objectStoreNames.contains (storeName))
                        db.deleteObjectStore (storeName);
                    objectStore = db.createObjectStore (storeName, { keyPath: 'id', autoIncrement: true });
                    objectStore.createIndex ('parentId', 'parentId', { unique: false });
                    objectStore.createIndex ('childId',  'childId',  { unique: false });
                });

                ['isa_element_parts', 'partof_element_parts'].forEach (function (storeName)
                {
                    if (db.objectStoreNames.contains (storeName))
                        db.deleteObjectStore (storeName);
                    objectStore = db.createObjectStore (storeName, { keyPath: 'conceptId' });
                    objectStore.createIndex ('elementFileIds', 'elementFileIds', { unique: false });
                });

                objectStore.transaction.oncomplete = function ()
                {
                    ['isa_parts_list_e', 'partof_parts_list_e'].forEach (function (storeName)
                    {
                        dbDataLoaded.push (loadPartsList (db, storeName));
                    });

                    ['isa_inclusion_relation_list', 'partof_inclusion_relation_list'].forEach (function (storeName)
                    {
                        dbDataLoaded.push (loadInclusionRelationList (db, storeName));
                    });


                    ['isa_element_parts', 'partof_element_parts'].forEach (function (storeName)
                    {
                        dbDataLoaded.push (loadElementParts (db, storeName));
                    });

                    if (localStorageDeferred)
                        localStorageDeferred.reject ();
                    localStorageDeferred = undefined;
                    localStorage.clear ();
                };
            }
        }

        return dbDeferred.promise ();
    }

    function loadSearchablePartsList (tree, fileName)
    {
        var deferred = $.Deferred ();

        $.get ('data/' + fileName + '.txt', function (data)
        {
            var lines = data.split ('\n');

            for (var i = 1; i < lines.length; i++)
            {
                var fields = lines[i].split ('\t');
                if (fields.length == 3)
                    localStorage.setItem (tree + '.' + fields[0], fields[2]);
            }

            deferred.resolve ();
        });

        return deferred.promise ();
    }

    function loadPartsList (db, storeName)
    {
        var deferred = $.Deferred ();

        $.get ('data/' + storeName + '.txt', function (data)
        {
            var lines = data.trim ().split ('\n');

            var trx = db.transaction ([storeName], 'readwrite');
            trx.oncomplete = function () { deferred.resolve (); };
            trx.onabort    = function () { deferred.reject  (); };
            trx.onerror    = function () { deferred.reject  (); };
            var objectStore = trx.objectStore (storeName);

            var progress = createProgress (storeName, lines.length),
                i = 0;
            (function processLine ()
            {
                if (i < lines.length)
                {
                    var fields = lines[i++].split ('\t');
                    if (fields.length != 3)
                        throw 'expecting 3 fields in "' + storeName + '" line: ' + (i + 1);

                    if (i % load_batch == 0)
                    {
                        objectStore.add ({ conceptId: fields[0], representationId: fields[1], name: fields[2] }).onsuccess = processLine;
                        updateProgress (progress, i);
                    }
                    else
                    {
                        objectStore.add ({ conceptId: fields[0], representationId: fields[1], name: fields[2] });
                        processLine ();
                    }
                }
                else
                {
                    destroyProgress (progress);
                }
            }) ();
        });

        return deferred.promise ();
    }

    function loadInclusionRelationList (db, storeName)
    {
        var deferred = $.Deferred ();

        $.get ('data/' + storeName + '.txt', function (data)
        {
            var lines = data.trim ().split ('\n').slice (1);

            var trx = db.transaction ([storeName], 'readwrite');
            trx.oncomplete = function () { deferred.resolve (); };
            trx.onabort    = function () { deferred.reject  (); };
            trx.onerror    = function () { deferred.reject  (); };
            var objectStore = trx.objectStore (storeName);

            var progress = createProgress (storeName, lines.length),
                i = 0;
            (function processLine ()
            {
                if (i < lines.length)
                {
                    var fields = lines[i++].split ('\t');
                    if (fields.length != 4)
                        throw 'expecting 4 fields in "' + storeName + '" line: ' + (i + 1);

                    if (i % load_batch == 0)
                    {
                        objectStore.add ({ parentId: fields[0], childId: fields[2] }).onsuccess = processLine;
                        updateProgress (progress, i);
                    }
                    else
                    {
                        objectStore.add ({ parentId: fields[0], childId: fields[2] });
                        processLine ();
                    }
                }
                else
                {
                    destroyProgress (progress);
                }
            }) ();
        });

        return deferred.promise ();
    }

    function loadElementParts (db, storeName)
    {
        var deferred = $.Deferred ();

        $.get ('data/' + storeName + '.txt', function (data)
        {
            var lines = data.trim ().split ('\n').slice (1);

            var trx = db.transaction ([storeName], 'readwrite');
            trx.oncomplete = function () { deferred.resolve (); };
            trx.onabort    = function () { deferred.reject  (); };
            trx.onerror    = function () { deferred.reject  (); };
            var objectStore = trx.objectStore (storeName);

            var progress = createProgress (storeName, lines.length),
                i = 0, id, name, fileIds = [], call_count = 0;

            (function processLine ()
            {
                ++call_count;

                if (i < lines.length)
                {
                    var fields = lines[i++].split ('\t');
                    if (fields.length != 3)
                        throw 'expecting 3 fields in "' + storeName + '" line: ' + (i + 1);

                    if (id && id !== fields[0]) // groupBy id
                    {
                        if (load_batch < call_count)
                        {
                            call_count = 0;
                            objectStore.add ({ conceptId: id, name: name, elementFileIds: fileIds }).onsuccess = processLine;
                            id      =  fields[0];
                            name    =  fields[1];
                            fileIds = [fields[2]];
                            updateProgress (progress, i);
                        }
                        else
                        {
                            objectStore.add ({ conceptId: id, name: name, elementFileIds: fileIds });
                            id      =  fields[0];
                            name    =  fields[1];
                            fileIds = [fields[2]];
                            processLine ();
                        }
                    }
                    else
                    {
                        id   =        fields[0];
                        name =        fields[1];
                        fileIds.push (fields[2]);
                        processLine ();
                    }
                }
                else
                {
                    objectStore.add ({ conceptId: id, name: name, elementFileIds: fileIds });
                    destroyProgress (progress);
                }
            }) ();
        });

        return deferred.promise ();
    }

    function parseConcept (treeConceptId)
    {
        var vals = treeConceptId.split ('.');
        return {tree: vals[0], id: vals[1]};
    }

    function createProgress (name, max)
    {
        var progress = $('<div/>'), progressLabel = $('<span/>');
        progress.css ({ position: 'relative', 'z-index': 10 });
        progressLabel.css ({ position: 'absolute', width: '100%', 'text-align': 'center' });
        $('body').prepend (progress.append (progressLabel));
        progress.progressbar (
        {
            value:  0,
            max:    max,
            change: function ()
            {
                var percent = (progress.progressbar ('value') / progress.progressbar ('option', 'max') * 100).toFixed ();
                progressLabel.text ('preloading organ data ' + percent + '%');
            }
        });

        return progress;
    }

    function updateProgress (progress, value)
    {
        progress.progressbar ('value', value);
    }

    function destroyProgress (progress)
    {
        progress.progressbar ('destroy');
        progress.remove ();
    }
}
