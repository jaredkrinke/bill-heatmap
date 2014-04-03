window.onload = function () {
    // TODO: Persist this data
    var bills = [];

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
            // TODO: This doesn't actually work yet...
            document.getElementById('editName').value = activeBill.getName();
            document.getElementById('editPeriod').value = periodToPeriodName[activeBill.getPeriod()];
            document.getElementById('editDueDate').value = activeBill.getDueDate();
        } else {
            tbody.insertBefore(editTemplate, addHint.nextSibling);
        }

        // Now show the template and hide the hint (and update form, in case it's visible)
        addHint.className = 'hidden';
        editTemplate.className = 'visible';
        updateTemplate.className = null;

        // TODO: Reset the form?
    };

    var hideEditor = function () {
        addHint.className = null;
        editTemplate.className = null;
        // TODO: Move the active stuff to a helper so it's easier to search for
        activeBill = null;
        activeTr = null;
    };

    var activeBill = null;
    var activeTr = null;
    var showUpdateTemplate = function (bill, tr) {
        // Show the update template
        tbody.removeChild(updateTemplate);
        tbody.insertBefore(updateTemplate, tr.nextSibling);
        updateTemplate.className = 'visible';

        // Note the current bill and row
        // TODO: Is there a better way to handle this?
        activeBill = bill;
        activeTr = tr;

        // Hide the new bill hint when updating a bill
        addHint.className = 'hidden';
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

    var saveBill = function () {
        if (activeBill) {
            // Edit the active bill
            // TODO: Implement
        } else {
            // This is a new bill, so create it
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
            var aName = document.createElement('a');
            aName.textContent = name;
            tdName.appendChild(aName);
            tr.appendChild(tdName);
            var tdDateDue = document.createElement('td');
            tdDateDue.textContent = formatDate(dateDue);
            tr.appendChild(tdDateDue);
            tbody.insertBefore(tr, updateTemplate);
            tr.className = statusToClass[bill.getStatus()];
            // TODO: Sort based on due date?

            // Enable updating for the bill
            addEventHandler(aName, function () {
                showUpdateTemplate(bill, tr);
            });
        }

        hideEditor();
    };

    var markPaid = function () {
        if (activeBill && activeTr) {
            // TODO: Implement
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
};
