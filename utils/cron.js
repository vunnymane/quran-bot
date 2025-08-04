const moment = require('moment');
const { EmbedBuilder } = require('discord.js');
const { getCurrentDate, isFriday, isSunday } = require('./time');
const { 
    getActiveUsers, 
    getTodayLogs, 
    getTodayMissed, 
    calculateStreak, 
    calculateMissedDays,
    formatCurrency,
    hasMissedThreeDays
} = require('./helpers');

/**
 * Send daily summary to Discord channel
 */
async function sendDailySummary(client, data) {
    try {
        if (!data.channelId) {
            console.log('⚠️ No channel configured for daily summaries');
            return;
        }

        const today = getCurrentDate();
        const todayLogs = getTodayLogs(data);
        const missedUsers = getTodayMissed(data);
        
        const embed = new EmbedBuilder()
            .setTitle(`📊 Daily Summary - ${moment().format('DD/MM/YYYY')}`)
            .setColor('#00ff00')
            .setTimestamp();
        
        // Users who logged
        const loggedUsers = Object.keys(todayLogs).filter(userId => 
            todayLogs[userId].completed
        );
        
        if (loggedUsers.length > 0) {
            const loggedNames = loggedUsers.map(userId => {
                const user = data.users[userId];
                return user ? user.name : 'Unknown User';
            });
            embed.addFields({
                name: '✅ Completed Today',
                value: loggedNames.join('\n') || 'None',
                inline: true
            });
        }
        
        // Users who missed
        if (missedUsers.length > 0) {
            const missedNames = missedUsers.map(user => user.name);
            embed.addFields({
                name: '❌ Missed Today',
                value: missedNames.join('\n') || 'None',
                inline: true
            });
        }
        
        embed.addFields({
            name: '📈 Stats',
            value: `${loggedUsers.length} completed, ${missedUsers.length} missed`,
            inline: false
        });
        
        // Send to configured channel
        const channel = await client.channels.fetch(data.channelId);
        if (channel) {
            await channel.send({ embeds: [embed] });
            console.log('✅ Daily summary sent');
        }
        
    } catch (error) {
        console.error('❌ Error sending daily summary:', error);
    }
}

/**
 * Send weekly reports to individual users via DM
 */
async function sendWeeklyReports(client, data) {
    try {
        const activeUsers = getActiveUsers(data);
        const weekStart = moment().startOf('week');
        const weekEnd = moment().endOf('week');
        
        for (const user of activeUsers) {
            try {
                // Calculate weekly stats
                let completedDays = 0;
                let missedDays = 0;
                let currentDate = weekStart.clone();
                
                while (currentDate.isSameOrBefore(weekEnd, 'day')) {
                    const dateKey = currentDate.format('YYYY-MM-DD');
                    const log = data.logs[dateKey]?.[user.id];
                    
                    if (log && log.completed) {
                        completedDays++;
                    } else {
                        missedDays++;
                    }
                    
                    currentDate.add(1, 'day');
                }
                
                const streak = calculateStreak(data, user.id);
                const totalMissed = calculateMissedDays(data, user.id);
                const donationBalance = (totalMissed * user.pledge) || 0;
                
                const embed = new EmbedBuilder()
                    .setTitle(`📊 Weekly Report - ${weekStart.format('DD/MM')} to ${weekEnd.format('DD/MM')}`)
                    .setColor('#0099ff')
                    .setDescription(`**${user.name}**`)
                    .addFields(
                        { name: '📅 This Week', value: `Completed: ${completedDays} days\nMissed: ${missedDays} days`, inline: true },
                        { name: '🔥 Current Streak', value: `${streak} days`, inline: true },
                        { name: '💰 Donation Balance', value: formatCurrency(donationBalance), inline: true },
                        { name: '📖 Your Goal', value: user.goal, inline: false }
                    )
                    .setFooter({ text: 'Keep up the great work! Use !log daily to maintain your streak.' });
                
                // Send private message
                const discordUser = await client.users.fetch(user.id);
                if (discordUser) {
                    await discordUser.send({ embeds: [embed] });
                }
                
            } catch (error) {
                console.error(`❌ Error sending report to ${user.name}:`, error);
            }
        }
        
        console.log('✅ Weekly reports sent');
        
    } catch (error) {
        console.error('❌ Error sending weekly reports:', error);
    }
}

/**
 * Send Friday reminders to Discord channel
 */
async function sendFridayReminders(client, data, time) {
    try {
        if (!isFriday() || !data.channelId) return;
        
        let embed = new EmbedBuilder()
            .setColor('#ffaa00')
            .setTimestamp();
        
        if (time === 'morning') {
            embed.setTitle('🕌 Friday Morning Reminder')
                .setDescription('**Surah Al-Kahf**')
                .addFields({
                    name: '📖 Hadith',
                    value: '"Whoever reads Surah Al-Kahf on Friday, a light will shine for him between the two Fridays."',
                    inline: false
                })
                .setFooter({ text: 'Take time today to read this blessed surah and gain its rewards!' });
        } else if (time === 'evening') {
            embed.setTitle('🌙 Friday Evening Reminder')
                .setDescription('**Surah Al-Mulk**')
                .addFields({
                    name: '📖 Hadith',
                    value: '"Whoever recites Surah Al-Mulk every night, Allah will protect him from the punishment of the grave."',
                    inline: false
                })
                .setFooter({ text: 'Don\'t forget to recite this surah before sleeping tonight!' });
        }
        
        if (embed.data.title) {
            // Send to configured channel
            const channel = await client.channels.fetch(data.channelId);
            if (channel) {
                await channel.send({ embeds: [embed] });
                console.log(`✅ Friday ${time} reminder sent`);
            }
        }
        
    } catch (error) {
        console.error(`❌ Error sending Friday ${time} reminder:`, error);
    }
}

/**
 * Check for users who missed 3 consecutive days and send warnings
 */
async function checkMissedUsers(client, data) {
    try {
        const activeUsers = getActiveUsers(data);
        
        for (const user of activeUsers) {
            const hasMissed = hasMissedThreeDays(data, user.id);
            
            if (hasMissed && !user.warned) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Accountability Alert')
                    .setColor('#ff0000')
                    .setDescription(`Hi **${user.name}**,\n\nYou've missed 3 consecutive days of your Quran goal. Your tracking has been paused.\n\nTo resume tracking, use: \`!continue\`\n\n💡 Remember: Consistency is key to building good habits!`)
                    .setTimestamp();
                
                try {
                    const discordUser = await client.users.fetch(user.id);
                    if (discordUser) {
                        await discordUser.send({ embeds: [embed] });
                        
                        // Mark as warned and paused
                        user.warned = true;
                        user.paused = true;
                    }
                    
                } catch (error) {
                    console.error(`❌ Error sending warning to ${user.name}:`, error);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking missed users:', error);
    }
}

module.exports = {
    sendDailySummary,
    sendWeeklyReports,
    sendFridayReminders,
    checkMissedUsers
}; 