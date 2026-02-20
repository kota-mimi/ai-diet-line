"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
exports.getTodayString = getTodayString;
exports.getCurrentMealType = getCurrentMealType;
exports.formatDuration = formatDuration;
const date_fns_1 = require("date-fns");
const locale_1 = require("date-fns/locale");
function formatDate(date, formatString = 'yyyy-MM-dd') {
    const dateObj = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
    return (0, date_fns_1.format)(dateObj, formatString, { locale: locale_1.ja });
}
function getTodayString() {
    return formatDate(new Date(), 'yyyy-MM-dd');
}
function getCurrentMealType() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10)
        return 'breakfast';
    if (hour >= 10 && hour < 15)
        return 'lunch';
    if (hour >= 15 && hour < 21)
        return 'dinner';
    return 'snack';
}
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes}分`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
        return `${hours}時間`;
    }
    return `${hours}時間${remainingMinutes}分`;
}
//# sourceMappingURL=date.js.map