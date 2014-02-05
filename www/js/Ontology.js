function Ontology (sig)
{
    var db,
        dbName    = 'medneuroatlas',
        dbVersion = 1,
        // {conceptId: 'FMA123', description: 'organ name'}
        isA       = [],
        partOf    = [];

    function loadSearchablePartsList (arrayName, fileName)
    {
        $.get ('data/' + fileName + '.txt', function (data)
        {
            var lines = data.split ('\n');

            for (var i = 1; i < lines.length; i++)
            {
                var fields = lines[i].split ('\t');
                if (fields.length === 3)
                    arrayName.push ({ conceptId: fields[0], description: fields[2] });
            }
        });
    }

    function loadPartsList (db, storeName)
    {
        var objectStore = db.createObjectStore (storeName, { keyPath: 'conceptId' });
        objectStore.createIndex ('representationId', 'representationId', { unique: true });

        $.get ('data/' + storeName + '.txt', function (data)
        {
            var lines = data.split ('\n');

            objectStore.transaction.oncomplete = function (evnt)
            {
                var trx = db.transaction ([storeName], 'readwrite');
                var objectStore = trx.objectStore (storeName);

                for (var i = 1; i < lines.length; i++)
                {
                    var fields = lines[i].split ('\t');
                    if (fields.length === 3)
                        objectStore.add ({ conceptId: fields[0], representationId: fields[1], description: fields[2] });
                }
            }
        });
    }

    function loadInclusionRelationList (db, storeName)
    {
        var objectStore = db.createObjectStore (storeName, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex ('parentId', 'parentId', { unique: false });
        objectStore.createIndex ('childId',  'childId',  { unique: false });

        $.get ('data/' + storeName + '.txt', function (data)
        {
            var lines = data.split ('\n');

            objectStore.transaction.oncomplete = function (evnt)
            {
                var trx = db.transaction ([storeName], 'readwrite');
                var objectStore = trx.objectStore (storeName);

                for (var i = 1; i < lines.length; i++)
                {
                    var fields = lines[i].split ('\t');
                    if (fields.length === 4)
                        objectStore.add ({ parentId: fields[0], childId: fields[3] });
                }
            }
        });
    }

    function loadElementParts (db, storeName)
    {
        var objectStore = db.createObjectStore (storeName, { keyPath: 'conceptId' });
        objectStore.createIndex ('elementFileIds', 'elementFileIds', { unique: false });

        $.get ('data/' + storeName + '.txt', function (data)
        {
            var lines = data.split ('\n');

            objectStore.transaction.oncomplete = function (evnt)
            {
                var trx = db.transaction ([storeName], 'readwrite');
                var objectStore = trx.objectStore (storeName);

                // groupBy conceptId
                var id, fileIds = [];
                for (var i = 1; i < lines.length; i++)
                {
                    var fields = lines[i].split ('\t');
                    if (fields.length !== 3)
                        continue;

                    if (id && id !== fields[0])
                    {
                        objectStore.add ({ conceptId: id, elementFileIds: fileIds });
                        fileIds = [];
                    }

                    id = fields[0];
                    fileIds.push (fields[2]);
                }
                objectStore.add ({ conceptId: id, elementFileIds: fileIds });
            }
        });
    }
    this.search = function (str)
    {
        var li         = [],
            count      = 0,
            foundCount = 0;
        const limit = 10;

        $('#search').prop ('disabled', true);

        for (var i = 0; i < isA.length; i++)
        {
            var record = isA[i];
            if (record.description.indexOf (str) !== -1)
            {
                foundCount++;
                li.push ('<li>' + record.conceptId + ', ' + record.description + '</li>');
            }

            if (foundCount >= limit)
                break;
        }

        foundCount = 0;
        for (var i = 0; i < partOf.length; i++)
        {
            var record = partOf[i];
            if (record.description.indexOf (str) !== -1)
            {
                foundCount++;
                li.push ('<li>' + record.conceptId + ', ' + record.description + '</li>');
            }

            if (foundCount >= limit)
                break;
        }

        $('#search-result').html (li.join (''));
        $('#search').prop ('disabled', false);
    };

    (function init ()
    {
        sig.progressInitialized.dispatch ('Loading...', 10);

        loadSearchablePartsList (isA,    'isa_parts_list_e');    sig.progressUpdated.dispatch (1);
        loadSearchablePartsList (partOf, 'partof_parts_list_e'); sig.progressUpdated.dispatch (2);

        var request = indexedDB.open (dbName, dbVersion);

        request.onsuccess = function (evnt)
        {
            db = evnt.target.result;
        }

        request.onupgradeneeded = function (evnt)
        {
            var db = evnt.target.result;

            loadPartsList (db, 'isa_parts_list_e');    sig.progressUpdated.dispatch (3);
            loadPartsList (db, 'partof_parts_list_e'); sig.progressUpdated.dispatch (4);

            loadInclusionRelationList (db, 'isa_inclusion_relation_list');    sig.progressUpdated.dispatch (5);
            loadInclusionRelationList (db, 'partof_inclusion_relation_list'); sig.progressUpdated.dispatch (6);

            loadElementParts (db, 'isa_element_parts');        sig.progressUpdated.dispatch (8);
            loadElementParts (db, 'partof_element_parts.txt'); sig.progressUpdated.dispatch (10);
        }
    }) ();
}
