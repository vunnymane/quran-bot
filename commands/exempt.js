const { EmbedBuilder } = require('discord.js');
const { getCurrentDate } = require('../utils/time');
const { getUser, getUserLog, setUserLog } = require('../utils/helpers');

/**
 * Handle exemption
 * Command: !exempt <reason>
 */
async function exemptCommand(client, message, args, data) {
    const userId = message.author.id;
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
    
    // Validate reason
    if (args.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Missing Reason')
            .setDescription('Please provide a reason for exemption.')
            .addFields(
                { name: 'Examples', value: '• `!exempt sick`\n• `!exempt travel`\n• `!exempt family emergency`', inline: false }
            )
            .setColor('#ff0000');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    const reason = args.join(' ');
    
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
    
    // Check if already exempt today
    if (existingLog && existingLog.exempt) {
        const embed = new EmbedBuilder()
            .setTitle('✅ Already Exempt')
            .setDescription('You have already marked an exemption for today!')
            .setColor('#00ff00');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Log the exemption
    setUserLog(data, userId, today, {
        completed: false,
        exempt: true,
        type: 'exemption',
        reason: reason,
        notes: `Exemption: ${reason}`
    });
    
    // Send confirmation
    const embed = new EmbedBuilder()
        .setTitle('✅ Exemption Recorded!')
        .setColor('#ffaa00')
        .addFields(
            { name: '📖 Goal', value: user.goal, inline: true },
            { name: '📅 Date', value: today, inline: true },
            { name: '🚫 Reason', value: reason, inline: true }
        )
        .setDescription('💡 **Note:** This day won\'t count against your streak or pledge.');
    
    await message.reply({ embeds: [embed] });
    
    console.log(`✅ User exempted: ${user.name} (${userId}) - Reason: ${reason}`);
}

module.exports = exemptCommand; 