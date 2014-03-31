window.onload = function () {
    // TODO: Should weekday vs. weekend be taken into account for bills? It seems like it should...
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

    var periodNameToPeriod = function (periodName) {
        switch (periodName) {
            case 'Weekly':
                return PeriodicTask.period.oneWeek;
                break;

            case 'Biweekly':
                return PeriodicTask.period.twoWeeks;
                break;

            case 'Monthly':
                return PeriodicTask.period.oneMonth;
                break;

            case 'Bimonthly':
                return PeriodicTask.period.twoMonths;
                break;

            case 'Semiannual':
                return PeriodicTask.period.sixMonths;
                break;

            case 'Annual':
                return PeriodicTask.period.oneYear;
                break;

            default:
                throw new 'Invalid period name: ' + periodName;
        }
    };

    var addNewBill = function () {
        var name = document.getElementById('editName').value;
        var period = periodNameToPeriod(document.getElementById('editPeriod').value);
        var dateDue = new Date(Date.parse(document.getElementById('editDueDate').value));
        var bill = new PeriodicTask({
            name: name,
            period: period,
            dateDue: dateDue
        });

        // TODO: Store and show the bill
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
