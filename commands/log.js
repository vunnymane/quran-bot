const { EmbedBuilder } = require('discord.js');
const { getCurrentDate, isFutureDate } = require('../utils/time');
const { getUser, getUserLog, setUserLog, calculateStreak } = require('../utils/helpers');

/**
 * Handle daily log
 * Command: !log
 */
async function logCommand(client, message, args, data) {
    const userId = message.author.id;
    const today = getCurrentDate();
    
    // Check if user is registered
    const user = getUser(data, userId);
    if (!user) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Not Registered')
            .setDescription('You are not registered! Use `!register` to join the Quran accountability system.')
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
    
    // Check if already logged today
    const existingLog = getUserLog(data, userId, today);
    if (existingLog && existingLog.completed) {
        const embed = new EmbedBuilder()
            .setTitle('✅ Already Logged')
            .setDescription('You have already logged your progress for today!')
            .setColor('#00ff00');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Log the progress
    setUserLog(data, userId, today, {
        completed: true,
        type: 'daily_log',
        notes: args.join(' ') || null
    });
    
    // Update user's last log date
    user.lastLogDate = today;
    user.warned = false; // Reset warning if they log
    
    // Calculate new streak
    const newStreak = calculateStreak(data, userId);
    
    // Send confirmation (public - no pledge info)
    const embed = new EmbedBuilder()
        .setTitle('✅ Daily Log Recorded!')
        .setColor('#00ff00')
        .addFields(
            { name: '🔥 Current Streak', value: `${newStreak} days`, inline: true },
            { name: '📅 Date', value: today, inline: true }
        );
    
    // Add streak milestone messages
    if (newStreak === 1) {
        embed.setDescription('🎉 **First day completed!** You\'ve started your Quran journey! Keep going!');
    } else if (newStreak === 7) {
        embed.setDescription('🎉 **One week streak!** Amazing consistency! You\'re building a strong habit!');
    } else if (newStreak === 30) {
        embed.setDescription('🎉 **One month streak!** You\'re building a great habit! May Allah reward you!');
    } else if (newStreak === 100) {
        embed.setDescription('🎉 **100 days!** You\'re an inspiration! May Allah bless your dedication!');
    } else if (newStreak % 10 === 0) {
        embed.setDescription(`🎉 **${newStreak} day streak!** Keep it up! Your consistency is amazing!`);
    } else {
        embed.setDescription('💡 **Great job!** Keep up the excellent work on your Quran journey!');
    }
    
    // Add accountability reminder
    embed.addFields({
        name: '💡 Accountability Reminder',
        value: 'Remember: Your goal is to build a strong connection with the Quran. Every day counts!',
        inline: false
    });
    
    await message.reply({ embeds: [embed] });
    
    console.log(`✅ User logged: ${user.name} (${userId}) - Streak: ${newStreak}`);
}

module.exports = logCommand; 