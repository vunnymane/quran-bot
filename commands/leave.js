const { EmbedBuilder } = require('discord.js');
const { getUser } = require('../utils/helpers');

/**
 * Handle leave command (pause tracking)
 * Command: !leave
 */
async function leaveCommand(client, message, args, data) {
    const userId = message.author.id;
    
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
    
    // Check if already paused
    if (user.paused) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Already Paused')
            .setDescription('Your tracking is already paused. Use `!continue` to resume.')
            .setColor('#ff0000');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Pause user tracking
    user.paused = true;
    user.pauseDate = new Date().toISOString();
    
    // Send confirmation
    const embed = new EmbedBuilder()
        .setTitle('⏸️ Tracking Paused')
        .setColor('#ffaa00')
        .addFields(
            { name: '👤 Name', value: user.name, inline: true },
            { name: '📖 Goal', value: user.goal, inline: true },
            { name: '📅 Paused', value: new Date().toLocaleDateString(), inline: true }
        )
        .addFields({
            name: '💡 To resume tracking',
            value: 'Use `!continue`',
            inline: false
        })
        .setFooter({ text: 'We hope to see you back soon!' });
    
    await message.reply({ embeds: [embed] });
    
    console.log(`⏸️ User paused: ${user.name} (${userId})`);
}

module.exports = leaveCommand; 