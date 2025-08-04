const { EmbedBuilder } = require('discord.js');
const { getCurrentDate, getYesterdayDate, isBefore7AM } = require('../utils/time');
const { getUser, getUserLog, setUserLog, calculateStreak } = require('../utils/helpers');

/**
 * Handle forgot log (backfill yesterday)
 * Command: !forgot
 */
async function forgotCommand(client, message, args, data) {
    const userId = message.author.id;
    const yesterday = getYesterdayDate();
    const today = getCurrentDate();
    
    // Check if user is registered
    const user = getUser(data, userId);
    if (!user) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Not Registered')
            .setDescription('You are not registered! Use `!register <goal> <pledge>` to join.')
            .setColor('#ff0000');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Check if user is paused
    if (user.paused) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Tracking Paused')
            .setDescription('Your tracking is paused due to missed days. Use `!continue` to resume.')
            .setColor('#ff0000');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Check if it's before 7am (allows backfill)
    if (!isBefore7AM()) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Too Late')
            .setDescription('You can only use `!forgot` before 7am to log yesterday\'s progress.')
            .setColor('#ff0000');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Check if already logged yesterday
    const existingLog = getUserLog(data, userId, yesterday);
    if (existingLog && existingLog.completed) {
        const embed = new EmbedBuilder()
            .setTitle('✅ Already Logged')
            .setDescription('You have already logged your progress for yesterday!')
            .setColor('#00ff00');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Check if already logged today
    const todayLog = getUserLog(data, userId, today);
    if (todayLog && todayLog.completed) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Cannot Backfill')
            .setDescription('You have already logged today. Cannot backfill yesterday.')
            .setColor('#ff0000');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Log yesterday's progress
    setUserLog(data, userId, yesterday, {
        completed: true,
        type: 'forgot_log',
        notes: args.join(' ') || 'Backfilled via !forgot command'
    });
    
    // Update user's last log date
    user.lastLogDate = yesterday;
    user.warned = false; // Reset warning if they log
    
    // Calculate new streak
    const newStreak = calculateStreak(data, userId);
    
    // Send confirmation
    const embed = new EmbedBuilder()
        .setTitle('✅ Yesterday\'s Log Recorded!')
        .setColor('#00ff00')
        .addFields(
            { name: '📖 Goal', value: user.goal, inline: true },
            { name: '🔥 Current Streak', value: `${newStreak} days`, inline: true },
            { name: '📅 Date', value: yesterday, inline: true },
            { name: '⏰ Backfilled', value: getCurrentDate(), inline: true }
        )
        .setDescription('💡 **Tip:** Try to log daily with `!log` to maintain consistency!');
    
    await message.reply({ embeds: [embed] });
    
    console.log(`✅ User backfilled: ${user.name} (${userId}) - Date: ${yesterday}`);
}

module.exports = forgotCommand; 