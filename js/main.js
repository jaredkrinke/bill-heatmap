window.onload = function () {
    var tbody = document.getElementById('billsBody');
    var editTemplate = document.getElementById('editTemplate');
    var addHint = document.getElementById('addHint');

    var showEditor = function () {
        addHint.className = 'hidden';
        editTemplate.className = 'visible';
    };

    var hideEditor = function () {
        addHint.className = null;
        editTemplate.className = null;
    };

    // Map from anchor IDs to associated handlers
    var clickHandlers = [
        ['add', showEditor],
        ['editCancel', hideEditor],
    ];

    // Setup event handling
    for (var i = 0, count = clickHandlers.length; i < count; i++) {
        (function (entry) {
            var id = entry[0];
            var handler = entry[1];
            var anchor = document.getElementById(id);
            anchor.href = '#';
            anchor.onclick = function () {
                handler();
                return false;
            };
        })(clickHandlers[i]);
    }
};
