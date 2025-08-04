const { EmbedBuilder } = require('discord.js');
const { getCurrentDate } = require('../utils/time');
const { getUser, calculateStreak, calculateMissedDays, formatCurrency } = require('../utils/helpers');

/**
 * Handle streak check
 * Command: !streak
 */
async function streakCommand(client, message, args, data) {
    const userId = message.author.id;
    
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
    
    // Calculate stats
    const currentStreak = calculateStreak(data, userId);
    const totalMissed = calculateMissedDays(data, userId);
    const donationBalance = (totalMissed * user.pledge) || 0;
    
    // Get registration date
    const registeredDate = user.registeredDate || 'Unknown';
    const daysRegistered = Math.floor((new Date() - new Date(registeredDate)) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate completion rate
    const completionRate = daysRegistered > 0 ? ((daysRegistered - totalMissed) / daysRegistered * 100).toFixed(1) : 0;
    
    // Build streak message (public - no pledge info)
    const embed = new EmbedBuilder()
        .setTitle('📊 Your Progress Report')
        .setColor('#0099ff')
        .addFields(
            { name: '👤 Name', value: user.name, inline: true },
            { name: '🔥 Current Streak', value: `${currentStreak} days`, inline: true },
            { name: '📅 Registered', value: registeredDate, inline: true },
            { name: '📈 Days Active', value: `${daysRegistered} days`, inline: true },
            { name: '✅ Completion Rate', value: `${completionRate}%`, inline: true },
            { name: '❌ Total Missed', value: `${totalMissed} days`, inline: true }
        );
    
    // Add streak milestone messages
    if (currentStreak === 0) {
        embed.setDescription('💡 **Start your streak today with `!log`!**');
    } else if (currentStreak === 1) {
        embed.setDescription('🎉 **First day completed!** Keep the momentum going!');
    } else if (currentStreak < 7) {
        embed.setDescription(`🔥 **${currentStreak} day streak!** Building a great habit!`);
    } else if (currentStreak < 30) {
        embed.setDescription(`🔥 **${currentStreak} day streak!** You're on fire!`);
    } else if (currentStreak < 100) {
        embed.setDescription(`🔥 **${currentStreak} day streak!** Amazing consistency!`);
    } else {
        embed.setDescription(`🔥 **${currentStreak} day streak!** You're an inspiration!`);
    }
    
    // Add donation reminder if balance is high (will be sent privately)
    const hasHighBalance = donationBalance > 50;
    
    await message.reply({ embeds: [embed] });
    
    // Only send private message if user is in DM
    if (message.channel.type === 1) { // DM channel
        try {
            const privateEmbed = new EmbedBuilder()
                .setTitle('📖 Your Personal Details')
                .setColor('#0099ff')
                .setDescription('Here are your private details:')
                .addFields(
                    { name: '📖 Your Daily Goal', value: user.goal, inline: false },
                    { name: '💰 Your Pledge', value: `$${user.pledge} per missed day`, inline: true },
                    { name: '💳 Donation Balance', value: formatCurrency(donationBalance), inline: true },
                    { name: '📅 Last Log', value: user.lastLogDate || 'Never', inline: true }
                );
            
            // Add donation reminder if balance is high
            if (hasHighBalance) {
                privateEmbed.addFields({
                    name: '💰 Donation Reminder',
                    value: `You have ${formatCurrency(donationBalance)} in pledges. Consider making a donation to fulfill your commitment.\n\n**Zelle:** darsinitiative@gmail.com\n**Memo:** "Username-Quran Log"`,
                    inline: false
                });
            }
            
            privateEmbed.setFooter({ text: 'This information is private to you' });
            
            await message.reply({ embeds: [privateEmbed] });
            
        } catch (error) {
            console.error('❌ Error sending private details:', error);
        }
    }
    
    console.log(`📊 Streak checked: ${user.name} (${userId}) - Streak: ${currentStreak}`);
}

module.exports = streakCommand; 