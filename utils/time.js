const moment = require('moment');

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate() {
    return moment().format('YYYY-MM-DD');
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
function getYesterdayDate() {
    return moment().subtract(1, 'day').format('YYYY-MM-DD');
}

/**
 * Check if current time is before 7am
 */
function isBefore7AM() {
    const currentHour = moment().hour();
    return currentHour < 7;
}

/**
 * Check if a date is within Fajr-to-Fajr window (simplified)
 * For MVP, we'll use 7am as the cutoff
 */
function isFajrToFajr(date) {
    const targetDate = moment(date);
    const now = moment();
    
    // If it's today, check if it's before 7am
    if (targetDate.isSame(now, 'day')) {
        return isBefore7AM();
    }
    
    // If it's yesterday, allow if it's before 7am today
    if (targetDate.isSame(now.clone().subtract(1, 'day'), 'day')) {
        return isBefore7AM();
    }
    
    return false;
}

/**
 * Check if a date is in the future
 */
function isFutureDate(date) {
    return moment(date).isAfter(moment(), 'day');
}

/**
 * Get day of week (0 = Sunday, 5 = Friday)
 */
function getDayOfWeek() {
    return moment().day();
}

/**
 * Check if today is Friday
 */
function isFriday() {
    return getDayOfWeek() === 5;
}

/**
 * Check if today is Sunday
 */
function isSunday() {
    return getDayOfWeek() === 0;
}

/**
 * Get formatted time for display
 */
function getFormattedTime() {
    return moment().format('HH:mm');
}

/**
 * Get formatted date for display
 */
function getFormattedDate() {
    return moment().format('DD/MM/YYYY');
}

module.exports = {
    getCurrentDate,
    getYesterdayDate,
    isBefore7AM,
    isFajrToFajr,
    isFutureDate,
    getDayOfWeek,
    isFriday,
    isSunday,
    getFormattedTime,
    getFormattedDate
}; 