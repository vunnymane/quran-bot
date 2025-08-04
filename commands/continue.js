const { EmbedBuilder } = require('discord.js');
const { getUser } = require('../utils/helpers');

/**
 * Handle continue command (resume tracking)
 * Command: !continue
 */
async function continueCommand(client, message, args, data) {
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
    
    // Check if not paused
    if (!user.paused) {
        const embed = new EmbedBuilder()
            .setTitle('✅ Already Active')
            .setDescription('Your tracking is already active! Use `!log` to record your progress.')
            .setColor('#00ff00');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Resume user tracking
    user.paused = false;
    user.warned = false;
    user.resumeDate = new Date().toISOString();
    
    // Send confirmation
    const embed = new EmbedBuilder()
        .setTitle('✅ Tracking Resumed!')
        .setColor('#00ff00')
        .addFields(
            { name: '👤 Name', value: user.name, inline: true },
            { name: '📖 Goal', value: user.goal, inline: true },
            { name: '📅 Resumed', value: new Date().toLocaleDateString(), inline: true }
        )
        .addFields({
            name: '💡 Next Steps',
            value: '• Use `!log` to record your daily progress\n• Use `!streak` to check your current streak\n• Stay consistent to avoid auto-pause',
            inline: false
        })
        .setFooter({ text: 'Welcome back! Let\'s continue your Quran journey!' });
    
    await message.reply({ embeds: [embed] });
    
    console.log(`✅ User resumed: ${user.name} (${userId})`);
}

module.exports = continueCommand; 