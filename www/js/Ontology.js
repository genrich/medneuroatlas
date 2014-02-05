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

    function loadPartsList (db, storeName, keyName, indexes)
    {
        var objectStore = db.createObjectStore (storeName, { keyPath: keyName });
        indexes.forEach (function (idx)
        {
            objectStore.createIndex (idx, idx, { unique: true });
        });

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
        loadSearchablePartsList (isA,    'isa_parts_list_e');
        loadSearchablePartsList (partOf, 'partof_parts_list_e');

        var request = indexedDB.open (dbName, dbVersion);

        request.onsuccess = function (evnt)
        {
            db = evnt.target.result;
        }

        request.onupgradeneeded = function (evnt)
        {
            var db = evnt.target.result;
            loadPartsList (db, 'isa_parts_list_e',    'conceptId', ['representationId']);
            loadPartsList (db, 'partof_parts_list_e', 'conceptId', ['representationId']);
        }
    }) ();
}
