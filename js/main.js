window.onload = function () {
    // TODO: Persist this data
    var bills = [];

    // TODO: Should weekday vs. weekend be taken into account for bills? It seems like it should...
    var tbody = document.getElementById('billsBody');
    var updateTemplate = document.getElementById('updateTemplate');
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

    var periodNameToPeriod = {
        Weekly: PeriodicTask.period.oneWeek,
        Biweekly: PeriodicTask.period.twoWeeks,
        Monthly: PeriodicTask.period.oneMonth,
        Bimonthly: PeriodicTask.period.twoMonths,
        Semiannual: PeriodicTask.period.sixMonths,
        Annual: PeriodicTask.period.oneYear,
    };

    var addNewBill = function () {
        var name = document.getElementById('editName').value;
        var period = periodNameToPeriod[document.getElementById('editPeriod').value];
        var dateDue = new Date(Date.parse(document.getElementById('editDueDate').value));
        var bill = new PeriodicTask({
            name: name,
            period: period,
            dateDue: dateDue
        });

        bills.push(bill);
        
        // Update UI
        var tr = document.createElement('tr');
        var tdName = document.createElement('td');
        tdName.textContent = name;
        tr.appendChild(tdName);
        var tdDateDue = document.createElement('td');
        // TODO: Format string with just date
        tdDateDue.textContent = dateDue.toString();
        tr.appendChild(tdDateDue);
        tbody.insertBefore(tr, updateTemplate);
        // TODO: Enable updating
        // TODO: Color based on status
        // TODO: Sort based on due date?

        hideEditor();
    };

    // Map from anchor IDs to associated handlers
    var clickHandlers = [
        ['add', showEditor],
        ['editCancel', hideEditor],
        ['editSave', addNewBill],
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
