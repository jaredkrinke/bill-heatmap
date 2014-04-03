(function () {
    // Comparison
    var millisecondsPerDay = 1000 * 60 * 60 * 24;
    var truncateTime = function (date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    Date.compareDates = function (a, b) {
        // Note: This is rounding rather than truncating the quotient in an attempt to ignore leap seconds
        return Math.round((truncateTime(a).getTime() - truncateTime(b).getTime()) / millisecondsPerDay);
    };

    // Creation
    Date.create = function (year, month, day) {
        return new Date(year, month - 1, day);
    };

    Date.today = function () {
        return new Date();
    };

    // Getters/properties
    Date.prototype.year = function () { return this.getFullYear(); };
    Date.prototype.month = function () { return this.getMonth() + 1; };
    Date.prototype.day = function () { return this.getDate(); };

    // Manipulation
    // TODO: Subtraction?
    Date.prototype.addYears = function (years) {
        // Note: It looks like the Date constructor handles leap years internally (so there is no special logic here)
        return Date.create(this.year() + years, this.month(), this.day());
    };

    var getDaysInMonth = function (year, month) {
        switch (month) {
            case 1:
            case 3:
            case 5:
            case 7:
            case 8:
            case 10:
            case 12:
                return 31;
                break;

            case 4:
            case 6:
            case 9:
            case 11:
                return 30;
                break;

            case 2:
                return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28;
                break;

            default:
                throw 'Invalid month';
                break;
        }
    };

    Date.prototype.addMonths = function (months) {
        // Handle years first
        var years = Math.floor(months / 12);
        var baseDate = this;
        if (years > 0) {
            baseDate = baseDate.addYears(years);
            months = months % 12;
        }

        // Handle wrap-around
        var endingYear = baseDate.year() + ((baseDate.month() + months > 12) ? 1 : 0);
        var endingMonth = (baseDate.month() + months - 1) % 12 + 1;

        // Ensure the date still lands in the month
        var endingDay = Math.min(baseDate.day(), getDaysInMonth(endingYear, endingMonth));

        return Date.create(endingYear, endingMonth, endingDay);
    };

    Date.prototype.addDays = function (days) {
        // Note that this could be made more efficient when handling >= 1 year's worth of days
        var endingYear = this.year();
        var endingMonth = this.month();
        var endingDay = this.day();

        while (days > 0) {
            var daysInMonth = getDaysInMonth(endingYear, endingMonth);
            if (endingDay + days <= daysInMonth) {
                // Fits in the same month, so break out of the loop
                endingDay += days;
                break;
            } else {
                // Wrap to the next month
                days -= (daysInMonth - endingDay + 1);
                endingDay = 1;
                if (++endingMonth > 12) {
                    // Wrap to next year
                    endingMonth = 1;
                    endingYear++;
                }
            }
        }

        return Date.create(endingYear, endingMonth, endingDay);
    };
})();

function PeriodicTask(properties) {
    this.properties = properties;
}

PeriodicTask.period = {
    oneWeek: 0,
    twoWeeks: 1,
    oneMonth: 2,
    twoMonths: 3,
    sixMonths: 4,
    oneYear: 5
};

PeriodicTask.status = {
    upToDate: 0,
    nearDue: 1,
    due: 2,
    pastDue: 3,
    wayPastDue: 4,
    unknown: 5
};

PeriodicTask.nearPeriodDays = 3;
PeriodicTask.wayPastPeriodDays = 7;

PeriodicTask.prototype.getName = function () {
    return this.properties.name;
};

PeriodicTask.prototype.getPeriod = function () {
    return this.properties.period;
};

PeriodicTask.prototype.getDueDate = function () {
    return this.properties.dateDue;
};

PeriodicTask.prototype.getStatusForDate = function (date) {
    // TODO: Shouldn't this just compute the number of days difference instead of doing a bunch of addition/comparisons?
    var dateDue = this.properties.dateDue;
    if (dateDue) {
        var daysUntilDue = Date.compareDates(dateDue, date);
        if (daysUntilDue > PeriodicTask.nearPeriodDays) {
            return PeriodicTask.status.upToDate;
        } else if (daysUntilDue > 0) {
            return PeriodicTask.status.nearDue;
        } else if (daysUntilDue === 0) {
            return PeriodicTask.status.due;
        } else if (daysUntilDue > -PeriodicTask.wayPastPeriodDays) {
            return PeriodicTask.status.pastDue;
        } else {
            return PeriodicTask.status.wayPastDue;
        }
    }

    return PeriodicTask.status.unknown;
};

PeriodicTask.prototype.getStatus = function () {
    return this.getStatusForDate(Date.today());
};

PeriodicTask.prototype.complete = function (dateCompleted) {
    // Record when the task was completed
    this.properties.dateCompleted = dateCompleted;

    // Advanced the due date according to the period
    switch (this.properties.period) {
        case PeriodicTask.period.oneWeek:
            this.properties.dateDue = this.properties.dateDue.addDays(7);
            break;

        case PeriodicTask.period.twoWeeks:
            this.properties.dateDue = this.properties.dateDue.addDays(14);
            break;

        case PeriodicTask.period.oneMonth:
            this.properties.dateDue = this.properties.dateDue.addMonths(1);
            break;

        case PeriodicTask.period.twoMonths:
            this.properties.dateDue = this.properties.dateDue.addMonths(2);
            break;

        case PeriodicTask.period.sixMonths:
            this.properties.dateDue = this.properties.dateDue.addMonths(6);
            break;

        case PeriodicTask.period.oneYear:
            this.properties.dateDue = this.properties.dateDue.addYears(1);
            break;

        default:
            throw 'Invalid period for task!';
            break;

    }
};
