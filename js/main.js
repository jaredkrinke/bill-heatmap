window.onload = function () {
    // TODO: Add a cache manifest so the site works even without connectivity
    var bills;

    // TODO: Should weekday vs. weekend be taken into account for bills? It seems like it should...
    var tbody = document.getElementById('billsBody');

    var updateTemplate = document.getElementById('updateTemplate');
    var editTemplate = document.getElementById('editTemplate');
    var deleteConfirm = document.getElementById('deleteConfirm');
    var addHint = document.getElementById('addHint');
    var editDueDate = document.getElementById('editDueDate');

    var notifications = [
        updateTemplate,
        editTemplate,
        deleteConfirm,
        addHint,
    ];
    var interactive = document.getElementById('interactive');

    var showNotification = function (notification, elementBefore) {
        // Replace the current notification
        while (interactive.childNodes.length > 0) {
            interactive.removeChild(interactive.childNodes[0]);
        }
        interactive.appendChild(notification);

        // Move the notification to the desired location
        tbody.removeChild(interactive);
        if (elementBefore) {
            tbody.insertBefore(interactive, activeTr.nextSibling);
        } else {
            tbody.appendChild(interactive);
        }
    };

    var showEditor = function () {
        showNotification(editTemplate, activeTr);

        if (activeBill && activeTr) {
            // Set the contents of the editor to match the item
            document.getElementById('editName').value = activeBill.getName();
            document.getElementById('editPeriod').selectedIndex = activeBill.getPeriod();
            var date = activeBill.getDueDate();
            editDueDate.value = date.month() + '/' + date.day() + '/' + date.year();
        } else {
            // Reset the form
            document.getElementById('editName').value = '';
            document.getElementById('editPeriod').selectedIndex = PeriodicTask.period.oneMonth;
            editDueDate.value = '';
        }
    };

    var activeBill = null;
    var activeTr = null;
    var setActive = function (bill, tr) {
        activeBill = bill;
        activeTr = tr;
    };

    var hideEditor = function () {
        setActive(null);
        showNotification(addHint, null);
    };

    var showUpdateTemplate = function (bill, tr) {
        setActive(bill, tr);
        showNotification(updateTemplate, tr);
    };

    var hideUpdateTemplate = function () {
        setActive(null, null);
        showNotification(addHint, null);
    };

    var showDeleteConfirm = function () {
        if (activeBill && activeTr) {
            showNotification(deleteConfirm, activeTr);
        }
    };

    var hideDeleteConfirm = function () {
        showNotification(addHint, null);
    };

    var deleteActiveBill = function () {
        if (activeBill && activeTr) {
            var index = bills.indexOf(activeBill);
            if (index >= 0) {
                bills.splice(index, 1);
                tbody.removeChild(activeTr);
                saveBills();
            }
        }

        hideDeleteConfirm();
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

    var addClickHandler = function (anchor, handler) {
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

    var createRow = function (bill) {
        var tr = document.createElement('tr');
        var tdName = document.createElement('td');
        var aName = document.createElement('a');
        tdName.appendChild(aName);
        tr.appendChild(tdName);
        var tdDueDate = document.createElement('td');
        tdDueDate.className = 'date';
        tr.appendChild(tdDueDate);
        tbody.appendChild(tr);

        // Enable updating for the bill
        addClickHandler(aName, function () {
            showUpdateTemplate(bill, tr);
        });

        return tr;
    };

    var datePattern = /^\d{1,2}\/\d{1,2}(\/(\d{2}|\d{4}))?$/i;
    var parseDate = function (dateString) {
        // Try the US pattern first
        if (datePattern.test(dateString)) {
            var elements = dateString.split('/');
            var month = elements[0];
            var day = elements[1];
            var year;
            if (elements.length < 3) {
                year = Date.today().year();
            } else if (elements[2].length === 2) {
                year = 2000 + parseInt(elements[2]);
            } else {
                year = elements[2];
            }

            return Date.create(year, month, day);
        }

        // Fall back to default parsing logic
        var dateMS = Date.parse(dateString);
        if (!isNan(dateMS)) {
            return new Date(dateMS);
        }

        else return null;
    };

    var namePattern = /^(\w| ){1,25}$/i;

    var saveBill = function () {
        var name = document.getElementById('editName').value;
        var period = periodNameToPeriod[document.getElementById('editPeriod').value];
        var dueDate = parseDate(editDueDate.value);

        // Validation
        if (namePattern.test(name) && period !== undefined && dueDate) {
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
                tr = createRow(bill);
                // TODO: Sort based on due date?
            }

            // Persist changes
            saveBills();

            // Populate columns and status
            if (bill && tr) {
                updateRowForBill(bill, tr);
            }

            hideEditor();
        } else {
            // TODO: Show an error on validation failure
        }
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
        ['editDelete', showDeleteConfirm],
        ['deleteYes', deleteActiveBill],
        ['deleteNo', hideDeleteConfirm],
    ];

    // Setup click handling
    for (var i = 0, count = clickHandlers.length; i < count; i++) {
        (function (entry) {
            var id = entry[0];
            var handler = entry[1];
            var anchor = document.getElementById(id);
            addClickHandler(anchor, handler);
        })(clickHandlers[i]);
    }

    // Load or create bills list
    var billsKey = 'bills';
    var billsJSON = localStorage[billsKey];
    if (billsJSON) {
        bills = JSON.parse(billsJSON).map(function (billJSON) { return PeriodicTask.createFromJSON(billJSON); });
        for (var i = 0, count = bills.length; i < count; i++) {
            updateRowForBill(bills[i], createRow(bills[i]));
        }
    } else {
        bills = [];
    }

    var saveBills = function () {
        localStorage[billsKey] = JSON.stringify(bills.map(function (bill) { return bill.toJSON() }));
    };

    // Hide notifications on page load (they will be reinserted into the interactive area as needed
    for (var i = 0, count = notifications.length; i < count; i++) {
        notifications[i].removeNode(true);
    }

    // Start with the add hint showing
    showNotification(addHint, null);
};
