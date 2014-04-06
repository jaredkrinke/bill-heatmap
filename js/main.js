window.onload = function () {
    var bills;

    // TODO: Should weekday vs. weekend be taken into account for bills? It seems like it should...
    var tbody = document.getElementById('billsBody');
    var updateTemplate = document.getElementById('updateTemplate');
    var editTemplate = document.getElementById('editTemplate');
    var addHint = document.getElementById('addHint');

    var showEditor = function () {
        // Move the editor as needed
        tbody.removeChild(editTemplate);
        if (activeBill && activeTr) {
            tbody.insertBefore(editTemplate, activeTr.nextSibling);

            // Set the contents of the editor to match the item
            document.getElementById('editName').value = activeBill.getName();
            document.getElementById('editPeriod').selectedIndex = activeBill.getPeriod();
            var date = activeBill.getDueDate();
            document.getElementById('editDueDate').value = date.month() + '/' + date.day() + '/' + date.year();
        } else {
            tbody.insertBefore(editTemplate, addHint.nextSibling);

            // Reset the form
            document.getElementById('editName').value = '';
            document.getElementById('editPeriod').selectedIndex = PeriodicTask.period.oneMonth;
            document.getElementById('editDueDate').value = '';
        }

        // Now show the template and hide the hint (and update form, in case it's visible)
        addHint.className = 'hidden';
        editTemplate.className = 'visible';
        updateTemplate.className = null;
    };

    var activeBill = null;
    var activeTr = null;
    var setActive = function (bill, tr) {
        activeBill = bill;
        activeTr = tr;
    };

    var hideEditor = function () {
        addHint.className = null;
        editTemplate.className = null;
        setActive(null);
    };

    var showUpdateTemplate = function (bill, tr) {
        // Show the update template
        tbody.removeChild(updateTemplate);
        tbody.insertBefore(updateTemplate, tr.nextSibling);
        updateTemplate.className = 'visible';

        // Note the current bill and row
        setActive(bill, tr);

        // Hide the new bill hint (and the editor) when updating a bill
        addHint.className = 'hidden';
        editTemplate.className = null;
    };

    var hideUpdateTemplate = function () {
        updateTemplate.className = null;
        activeBill = null;
        activeTr = null;

        addHint.className = null;
    };

    var periodNameToPeriod = {
        Weekly: PeriodicTask.period.oneWeek,
        Biweekly: PeriodicTask.period.twoWeeks,
        Monthly: PeriodicTask.period.oneMonth,
        Bimonthly: PeriodicTask.period.twoMonths,
        Semiannual: PeriodicTask.period.sixMonths,
        Annual: PeriodicTask.period.oneYear,
    };
    var periodToPeriodName = [];
    for (var periodName in periodNameToPeriod) {
        periodToPeriodName[periodNameToPeriod[periodName]] = periodName;
    }

    var currentYear = Date.today().year();
    var formatDate = function (date) {
        var str = date.month() + '/' + date.day();
        if (date.year() !== currentYear) {
            str += '/' + date.year();
        }
        return str;
    };

    var statusToClass = [];
    for (var statusName in PeriodicTask.status) {
        statusToClass[PeriodicTask.status[statusName]] = statusName;
    }

    var addEventHandler = function (anchor, handler) {
        anchor.href = '#';
        anchor.onclick = function () {
            handler();
            return false;
        };
    };

    var updateRowForBill = function (bill, tr) {
        tr.children[0].children[0].textContent = bill.getName();
        tr.children[1].textContent = formatDate(bill.getDueDate());
        tr.className = statusToClass[bill.getStatus()];
    };

    var createRow = function () {
        var tr = document.createElement('tr');
        var tdName = document.createElement('td');
        var aName = document.createElement('a');
        tdName.appendChild(aName);
        tr.appendChild(tdName);
        var tdDueDate = document.createElement('td');
        tr.appendChild(tdDueDate);
        tbody.insertBefore(tr, updateTemplate);
        // TODO: Sort based on due date?

        // Enable updating for the bill
        addEventHandler(aName, function () {
            showUpdateTemplate(bill, tr);
        });

        return tr;
    };

    var saveBill = function () {
        // TODO: Validation
        var name = document.getElementById('editName').value;
        var period = periodNameToPeriod[document.getElementById('editPeriod').value];
        var dueDate = new Date(Date.parse(document.getElementById('editDueDate').value));
        var bill;
        var tr;

        if (activeBill) {
            // Edit the active bill
            activeBill.setName(name);
            activeBill.setPeriod(period);
            activeBill.setDueDate(dueDate);

            bill = activeBill;
            tr = activeTr;
        } else {
            // This is a new bill, so create it
            bill = new PeriodicTask({
                name: name,
                period: period,
                dueDate: dueDate
            });

            bills.push(bill);
            tr = createRow();
            // TODO: Sort based on due date?

            // Enable updating for the bill
            addEventHandler(tr.children[0].children[0], function () {
                showUpdateTemplate(bill, tr);
            });
        }

        // Persist changes
        saveBills();

        // Populate columns and status
        if (bill && tr) {
            updateRowForBill(bill, tr);
        }

        hideEditor();
    };

    var markPaid = function () {
        if (activeBill && activeTr) {
            activeBill.complete();
            saveBills();
            updateRowForBill(activeBill, activeTr);
            // TODO: Give the user an easy way to undo this change
            // TODO: Keep a history of payment dates?
        }

        hideUpdateTemplate();
    };

    // Map from anchor IDs to associated handlers
    var clickHandlers = [
        ['add', showEditor],
        ['updatePaid', markPaid],
        ['updateEdit', showEditor],
        ['updateCancel', hideUpdateTemplate],
        ['editCancel', hideEditor],
        ['editSave', saveBill],
        // TODO: Delete button
    ];

    // Setup event handling
    for (var i = 0, count = clickHandlers.length; i < count; i++) {
        (function (entry) {
            var id = entry[0];
            var handler = entry[1];
            var anchor = document.getElementById(id);
            addEventHandler(anchor, handler);
        })(clickHandlers[i]);
    }

    // Load or create bills list
    var billsKey = 'bills';
    var billsJSON = localStorage[billsKey];
    if (billsJSON) {
        bills = JSON.parse(billsJSON).map(function (billJSON) { return PeriodicTask.createFromJSON(billJSON); });
        for (var i = 0, count = bills.length; i < count; i++) {
            updateRowForBill(bills[i], createRow());
        }
    } else {
        bills = [];
    }

    var saveBills = function () {
        localStorage[billsKey] = JSON.stringify(bills.map(function (bill) { return bill.toJSON() }));
    };
};
