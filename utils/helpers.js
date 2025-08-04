const fs = require('fs');
const path = require('path');
const moment = require('moment');

const DATA_FILE = 'data.json';

/**
 * Load data from JSON file
 */
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
    
    // Return default structure if file doesn't exist or is corrupted
    return {
        users: {},
        logs: {},
        admins: []
    };
}

/**
 * Save data to JSON file
 */
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Error saving data:', error);
        return false;
    }
}

/**
 * Get user by ID
 */
function getUser(data, userId) {
    return data.users[userId] || null;
}

/**
 * Update user data
 */
function updateUser(data, userId, userData) {
    data.users[userId] = {
        ...data.users[userId],
        ...userData,
        lastUpdated: new Date().toISOString()
    };
    return data.users[userId];
}

/**
 * Get user's log for a specific date
 */
function getUserLog(data, userId, date) {
    const dateKey = date || getCurrentDate();
    return data.logs[dateKey]?.[userId] || null;
}

/**
 * Set user's log for a specific date
 */
function setUserLog(data, userId, date, logData) {
    const dateKey = date || getCurrentDate();
    if (!data.logs[dateKey]) {
        data.logs[dateKey] = {};
    }
    data.logs[dateKey][userId] = {
        ...logData,
        timestamp: new Date().toISOString()
    };
}

/**
 * Calculate user's current streak
 */
function calculateStreak(data, userId) {
    const user = getUser(data, userId);
    if (!user) return 0;
    
    let streak = 0;
    let currentDate = moment();
    
    while (true) {
        const dateKey = currentDate.format('YYYY-MM-DD');
        const log = getUserLog(data, userId, dateKey);
        
        if (log && log.completed) {
            streak++;
            currentDate = currentDate.subtract(1, 'day');
        } else {
            break;
        }
    }
    
    return streak;
}

/**
 * Calculate user's missed days
 */
function calculateMissedDays(data, userId) {
    const user = getUser(data, userId);
    if (!user) return 0;
    
    let missedDays = 0;
    let currentDate = moment(user.registeredDate || moment().subtract(30, 'days'));
    const today = moment();
    
    while (currentDate.isBefore(today, 'day')) {
        const dateKey = currentDate.format('YYYY-MM-DD');
        const log = getUserLog(data, userId, dateKey);
        
        if (!log || !log.completed) {
            missedDays++;
        }
        
        currentDate = currentDate.add(1, 'day');
    }
    
    return missedDays;
}

/**
 * Check if user has missed 3 consecutive days
 */
function hasMissedThreeDays(data, userId) {
    const user = getUser(data, userId);
    if (!user) return false;
    
    let consecutiveMissed = 0;
    let currentDate = moment().subtract(1, 'day');
    
    for (let i = 0; i < 3; i++) {
        const dateKey = currentDate.format('YYYY-MM-DD');
        const log = getUserLog(data, userId, dateKey);
        
        if (!log || !log.completed) {
            consecutiveMissed++;
        } else {
            break;
        }
        
        currentDate = currentDate.subtract(1, 'day');
    }
    
    return consecutiveMissed >= 3;
}

/**
 * Get all active users
 */
function getActiveUsers(data) {
    return Object.values(data.users).filter(user => 
        user.active !== false && !user.paused
    );
}

/**
 * Get users who logged today
 */
function getTodayLogs(data) {
    const today = getCurrentDate();
    return data.logs[today] || {};
}

/**
 * Get users who missed today
 */
function getTodayMissed(data) {
    const activeUsers = getActiveUsers(data);
    const todayLogs = getTodayLogs(data);
    const today = getCurrentDate();
    
    return activeUsers.filter(user => {
        const log = todayLogs[user.id];
        return !log || !log.completed;
    });
}

/**
 * Format user mention for WhatsApp
 */
function formatUserMention(contact) {
    return `@${contact.id.user}`;
}

/**
 * Format currency amount
 */
function formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
}

/**
 * Validate pledge amount
 */
function validatePledge(pledge) {
    const amount = parseFloat(pledge);
    return !isNaN(amount) && amount >= 0 && amount <= 1000;
}

/**
 * Validate goal text
 */
function validateGoal(goal) {
    return goal && goal.length >= 3 && goal.length <= 100;
}

/**
 * Get current date (import from time utils)
 */
const { getCurrentDate } = require('./time');

module.exports = {
    loadData,
    saveData,
    getUser,
    updateUser,
    getUserLog,
    setUserLog,
    calculateStreak,
    calculateMissedDays,
    hasMissedThreeDays,
    getActiveUsers,
    getTodayLogs,
    getTodayMissed,
    formatUserMention,
    formatCurrency,
    validatePledge,
    validateGoal
}; 