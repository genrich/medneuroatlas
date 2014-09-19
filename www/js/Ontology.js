function Ontology ()
{
    const dbName = 'medneuroatlas', dbVersion = 2;

    var dbOpened = $.Deferred (), dbUpgraded, dbDataLoaded = [];

    var request = indexedDB.open (dbName, dbVersion);
    request.onsuccess = function (evnt)
    {
        if (dbUpgraded)
            $.when.apply ($, dbDataLoaded).then (function () { dbOpened.resolve (evnt.target.result); });
        else
            dbOpened.resolve (evnt.target.result);
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

            localStorage.clear ();
            loadSearchablePartsList ('isa',    'isa_parts_list_e');
            loadSearchablePartsList ('partof', 'partof_parts_list_e');
        };
    }

    if (localStorage.length == 0)
    {
        loadSearchablePartsList ('isa',    'isa_parts_list_e');
        loadSearchablePartsList ('partof', 'partof_parts_list_e');
    }

    this.search = function (str)
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

        return results;
    };

    this.conceptRetrieved = function (treeConceptId)
    {
        var deferred = $.Deferred ();

        dbOpened.done (function (db)
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

        dbOpened.done (function (db)
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

        dbOpened.done (function (db)
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

    function loadSearchablePartsList (tree, fileName)
    {
        $.get ('data/' + fileName + '.txt', function (data)
        {
            var lines = data.split ('\n');

            for (var i = 1; i < lines.length; i++)
            {
                var fields = lines[i].split ('\t');
                if (fields.length == 3)
                    localStorage.setItem (tree + '.' + fields[0], fields[2]);
            }
        });
    }

    function loadPartsList (db, storeName)
    {
        var deferred = $.Deferred ();

        $.get ('data/' + storeName + '.txt', function (data)
        {
            var lines = data.split ('\n');

            var trx = db.transaction ([storeName], 'readwrite');
            trx.oncomplete = function () { deferred.resolve (); };
            var objectStore = trx.objectStore (storeName);

            for (var i = 1; i < lines.length; i++)
            {
                var fields = lines[i].split ('\t');
                if (fields.length == 3)
                objectStore.add ({ conceptId: fields[0], representationId: fields[1], name: fields[2] });
            }
        });

        return deferred.promise ();
    }

    function loadInclusionRelationList (db, storeName)
    {
        var deferred = $.Deferred ();

        $.get ('data/' + storeName + '.txt', function (data)
        {
            var lines = data.split ('\n');

            var trx = db.transaction ([storeName], 'readwrite');
            trx.oncomplete = function () { deferred.resolve (); };
            var objectStore = trx.objectStore (storeName);

            for (var i = 1; i < lines.length; i++)
            {
                var fields = lines[i].split ('\t');
                if (fields.length == 4)
                objectStore.add ({ parentId: fields[0], childId: fields[2] });
            }
        });

        return deferred.promise ();
    }

    function loadElementParts (db, storeName)
    {
        var deferred = $.Deferred ();

        $.get ('data/' + storeName + '.txt', function (data)
        {
            var lines = data.split ('\n');

            var trx = db.transaction ([storeName], 'readwrite');
            trx.oncomplete = function () { deferred.resolve (); };
            var objectStore = trx.objectStore (storeName);

            // groupBy conceptId
            var id, name, fileIds = [];
            for (var i = 1; i < lines.length; i++)
            {
                var fields = lines[i].split ('\t');
                if (fields.length !== 3)
                    continue;

                if (id && id !== fields[0])
                {
                    objectStore.add ({ conceptId: id, name: name, elementFileIds: fileIds });
                    fileIds = [];
                }

                id = fields[0];
                name = fields[1];
                fileIds.push (fields[2]);
            }
            objectStore.add ({ conceptId: id, name: name, elementFileIds: fileIds });
        });

        return deferred.promise ();
    }

    function parseConcept (treeConceptId)
    {
        var vals = treeConceptId.split ('.');
        return {tree: vals[0], id: vals[1]};
    }
}
