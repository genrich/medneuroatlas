function Ontology (sig)
{
    var db,
        dbName    = 'medneuroatlas',
        dbVersion = 1;

    function loadData (db, storeName, keyName, indexes)
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

    this.searchPartOf = function (str)
    {
        var storeName = 'partof_parts_list_e';
        var li = [];
        var maxCount = 1368;
        var count = 0;
        var foundCount = 0;

        $('#search').prop ('disabled', true);

        sig.progressInitialized.dispatch ('Searching...', maxCount);

        var store = db.transaction (storeName).objectStore (storeName);
        store.openCursor ().onsuccess = function (evnt)
        {
            var cursor = evnt.target.result;
            if (cursor && foundCount < 10)
            {
                var record = cursor.value;
                if (record.description.indexOf (str) !== -1)
                {
                    foundCount++;
                    li.push ('<li>' + record.conceptId + ', ' + record.description + '</li>');
                }
                sig.progressUpdated.dispatch (++count);

                cursor.continue ();
            }
            else
            {
                if (count !== maxCount)
                    sig.progressUpdated.dispatch (maxCount);

                $('#search-result').html (li.join (''));
                $('#search').prop ('disabled', false);
            }
        };
    };

    (function init ()
    {
        var request = indexedDB.open (dbName, dbVersion);

        request.onsuccess = function (evnt)
        {
            db = evnt.target.result;
        }

        request.onupgradeneeded = function (evnt)
        {
            var db = evnt.target.result;
            loadData (db, 'isa_parts_list_e',    'conceptId', ['representationId']);
            loadData (db, 'partof_parts_list_e', 'conceptId', ['representationId']);
        }
    }) ();
}
