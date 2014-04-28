$(function () {
    var bills = [];

    // TODO: Should weekday vs. weekend be taken into account for bills? It seems like it should...
    var root = $('#bills');
    var template = $('#template').hide();

    var editTemplate = $('#editTemplate');
    var deleteConfirm = $('#deleteConfirm');
    var editName = $('#editName');
    var editDueDate = $('#editDueDate');
    var editPeriod = $('#editPeriod');

    var notifications = [
        editTemplate,
        deleteConfirm,
    ];

    // Disable animations during page load
    $.fx.off = true;

    var showNotification = function (notification, elementBefore) {
        for (var i = 0, count = notifications.length; i < count; i++) {
            notifications[i].slideUp();
        }

        // Move the notification to the desired location
        notification.queue('fx', function (next) {
            notification.insertAfter(elementBefore ? elementBefore : $('div.bill').last());
            next();
        });

        notification.slideDown();
    };

    var activeBill = null;
    var activeDiv = null;
    var setActive = function (bill, div) {
        if (activeDiv) {
            activeDiv.removeClass('active');
        }

        activeBill = bill;
        activeDiv = div;

        if (activeDiv) {
            activeDiv.addClass('active');
        }
    };

    var showEditor = function () {
        showNotification(editTemplate, activeDiv);

        if (activeBill && activeDiv) {
            // Set the contents of the editor to match the item
            editName.val(activeBill.getName());
            editPeriod.val(periodToPeriodName[activeBill.getPeriod()]);
            var date = activeBill.getDueDate();
            editDueDate.val(date.month() + '/' + date.day() + '/' + date.year());
        } else {
            // Reset the form
            editName.val('');
            editPeriod.val(periodToPeriodName[PeriodicTask.period.oneMonth]);
            editDueDate.val('');
        }
    };

    var hideEditor = function () {
        setActive(null);
    };

    template.bind('click', function (event) {
            event.preventDefault();
            var source = $(this);
            var bill = source.data('bill');

            if (bill) {
                setActive(bill, source);
            }
    });

    var showDeleteConfirm = function () {
        if (activeBill && activeDiv) {
            showNotification(deleteConfirm, activeDiv);
        }
    };

    var hideDeleteConfirm = function () {
        showNotification(addHint);
    };

    var deleteActiveBill = function () {
        if (activeBill && activeDiv) {
            var index = bills.indexOf(activeBill);
            if (index >= 0) {
                bills.splice(index, 1);
                activeDiv.unbind()
                    .slideUp({
                        complete: function () {
                            activeDiv.remove();
                        }
                    });
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

    // Map states to table row styles
    var statusToClass = [];
    statusToClass[PeriodicTask.status.upToDate] = 'list-group-item-success';
    statusToClass[PeriodicTask.status.nearDue] = 'list-group-item-success';
    statusToClass[PeriodicTask.status.due] = 'list-group-item-warning';
    statusToClass[PeriodicTask.status.pastDue] = 'list-group-item-danger';
    statusToClass[PeriodicTask.status.wayPastDue] = 'list-group-item-danger';

    var statusStylesConcatenated = ['list-group-item-success', 'list-group-item-warning', 'list-group-item-danger'].join(' ');

    var updateRowForBill = function (bill, div) {
        div.find('.name').text(bill.getName());
        div.children('.date').text(formatDate(bill.getDueDate()));
        div.removeClass(statusStylesConcatenated).addClass(statusToClass[bill.getStatus()]);
    };

    var createRow = function (bill, index) {
        var row = template.clone(true)
            .data('bill', bill);
        var elementBefore = root.find('.bill').eq(index);
        if (elementBefore) {
            elementBefore.after(row);
        } else {
            root.append(row);
        }
        return row.show();
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
        if (!isNaN(dateMS)) {
            return new Date(dateMS);
        }

        else return null;
    };

    var addBillAndRow = function (bill) {
        // Insert bills in order of due date
        var dueDate = bill.getDueDate();
        for (var index = 0, count = bills.length; index < count && Date.compareDates(dueDate, bills[index].getDueDate()) > 0; index++);

        bills.splice(index, 0, bill);
        updateRowForBill(bill, createRow(bill, index));
    };

    var namePattern = /^\w(\w| ){0,24}$/i;

    var saveBill = function () {
        var name = editName.val();
        var period = periodNameToPeriod[editPeriod.val()];
        var dueDate = parseDate(editDueDate.val());

        // Validation
        var nameValid = namePattern.test(name);
        var periodValid = (period !== undefined);
        var dueDateValid = !!dueDate;
        valid = (nameValid && periodValid && dueDateValid);
        if (valid) {
            if (activeBill) {
                // Edit the active bill
                activeBill.setName(name);
                activeBill.setPeriod(period);
                activeBill.setDueDate(dueDate);

                updateRowForBill(activeBill, activeDiv);
            } else {
                // This is a new bill, so create it
                addBillAndRow(new PeriodicTask({
                    name: name,
                    period: period,
                    dueDate: dueDate
                }));
            }

            // Persist changes
            saveBills();
            hideEditor();
        }

        // Update visual error states as needed
        var validToElement = [
            [nameValid, editName],
            [dueDateValid, editDueDate],
        ];
        for (var i = 0, count = validToElement.length; i < count; i++) {
            var pair = validToElement[i];
            if (pair[0]) {
                pair[1].removeClass('error');
            } else {
                pair[1].addClass('error');
            }
        }
    };

    var markPaid = function () {
        if (activeBill && activeDiv) {
            activeBill.complete();
            saveBills();
            updateRowForBill(activeBill, activeDiv);
        }
    };

    // Map from element IDs to associated handlers
    var clickHandlers = [
        ['#add', showEditor],
        ['#updatePaid', markPaid],
        ['#updateEdit', showEditor],
        ['#editCancel', hideEditor],
        ['#editSave', saveBill],
        ['#editDelete', showDeleteConfirm],
        ['#deleteYes', deleteActiveBill],
        ['#deleteNo', hideDeleteConfirm],
    ];

    // Setup click handling
    for (var i = 0, count = clickHandlers.length; i < count; i++) {
        var entry = clickHandlers[i];
        $(entry[0]).attr('href', '#').click(entry[1]);
    }

    // Load or create bills list
    var billsKey = 'bills';
    var billsJSON = localStorage[billsKey];
    if (billsJSON) {
        var savedBills = JSON.parse(billsJSON).map(function (billJSON) { return PeriodicTask.createFromJSON(billJSON); });
        for (var i = 0, count = savedBills.length; i < count; i++) {
            addBillAndRow(savedBills[i]);
        }
    }

    var saveBills = function () {
        localStorage[billsKey] = JSON.stringify(bills.map(function (bill) { return bill.toJSON() }));
    };

    // Hide notifications on page load
    for (var i = 0, count = notifications.length; i < count; i++) {
        notifications[i].hide();
    }

    // Now that the page has loaded, turn on animations
    $.fx.off = false;
});
