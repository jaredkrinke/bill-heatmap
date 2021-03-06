﻿(function () {
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
    if (!properties.count && !properties.originalDueDate) {
        this.resetCount();
    }
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

PeriodicTask.createFromJSON = function (json) {
    var properties = JSON.parse(json);

    // Dates are saved as strings, so convert them back here
    properties.dueDate = new Date(properties.dueDate);
    properties.originalDueDate = new Date(properties.originalDueDate);

    return new PeriodicTask(properties);
};

PeriodicTask.prototype.resetCount = function () {
    this.properties.originalDueDate = this.properties.dueDate;
    this.properties.count = 0;
};

PeriodicTask.prototype.getName = function () {
    return this.properties.name;
};

PeriodicTask.prototype.setName = function (name) {
    this.properties.name = name;
};

PeriodicTask.prototype.getPeriod = function () {
    return this.properties.period;
};

PeriodicTask.prototype.setPeriod = function (period) {
    this.properties.period = period;
    this.resetCount();
};

PeriodicTask.prototype.getDueDate = function () {
    return this.properties.dueDate;
};

PeriodicTask.prototype.setDueDate = function (dueDate) {
    this.properties.dueDate = dueDate;
    this.resetCount();
};

PeriodicTask.prototype.getStatusForDate = function (date) {
    var dueDate = this.properties.dueDate;
    if (dueDate) {
        var daysUntilDue = Date.compareDates(dueDate, date);
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

PeriodicTask.prototype.toJSON = function () {
    return JSON.stringify(this.properties);
};

PeriodicTask.prototype.complete = function () {
    // Record when the task was completed
    this.properties.count++;

    // Advanced the due date according to the period
    switch (this.properties.period) {
        case PeriodicTask.period.oneWeek:
            this.properties.dueDate = this.properties.dueDate.addDays(7);
            break;

        case PeriodicTask.period.twoWeeks:
            this.properties.dueDate = this.properties.dueDate.addDays(14);
            break;

        case PeriodicTask.period.oneMonth:
            this.properties.dueDate = this.properties.originalDueDate.addMonths(this.properties.count);
            break;

        case PeriodicTask.period.twoMonths:
            this.properties.dueDate = this.properties.originalDueDate.addMonths(2 * this.properties.count);
            break;

        case PeriodicTask.period.sixMonths:
            this.properties.dueDate = this.properties.originalDueDate.addMonths(6 * this.properties.count);
            break;

        case PeriodicTask.period.oneYear:
            this.properties.dueDate = this.properties.originalDueDate.addYears(this.properties.count);
            break;

        default:
            throw 'Invalid period for task!';
            break;

    }
};
