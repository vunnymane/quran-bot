const { EmbedBuilder } = require('discord.js');
const { getUser, formatCurrency } = require('../utils/helpers');

/**
 * Handle admin payment marking
 * Command: !paid @user <amount>
 */
async function paidCommand(client, message, args, data) {
    const userId = message.author.id;
    
    // Check if user is admin
    const isAdmin = data.admins.includes(userId);
    if (!isAdmin) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Permission Denied')
            .setDescription('You do not have permission to use this command.')
            .setColor('#ff0000');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Validate arguments
    if (args.length < 2) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Missing Arguments')
            .setDescription('Please provide a user mention and amount.')
            .addFields(
                { name: 'Example', value: '`!paid @user 25`', inline: false }
            )
            .setColor('#ff0000');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Extract user mention and amount
    const userMention = args[0];
    const amount = parseFloat(args[1]);
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Invalid Amount')
            .setDescription('Please provide a valid amount greater than 0.')
            .setColor('#ff0000');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Extract user ID from mention
    let targetUserId = null;
    if (userMention.startsWith('<@') && userMention.endsWith('>')) {
        // Remove <@ and > and any ! if present
        targetUserId = userMention.replace(/[<@!>]/g, '');
    } else if (userMention.startsWith('@')) {
        // Try to find user by username
        const username = userMention.slice(1);
        for (const [id, user] of Object.entries(data.users)) {
            if (user.name.toLowerCase() === username.toLowerCase()) {
                targetUserId = id;
                break;
            }
        }
    }
    
    if (!targetUserId) {
        const embed = new EmbedBuilder()
            .setTitle('❌ User Not Found')
            .setDescription('Please check the user mention format.')
            .setColor('#ff0000');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Get target user
    const targetUser = getUser(data, targetUserId);
    if (!targetUser) {
        const embed = new EmbedBuilder()
            .setTitle('❌ User Not Found')
            .setDescription('User not found in registered users.')
            .setColor('#ff0000');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Update user's donation balance
    const currentBalance = (targetUser.totalMissedDays || 0) * targetUser.pledge;
    const newBalance = Math.max(0, currentBalance - amount);
    
    // Calculate how many missed days this payment covers
    const daysCovered = Math.floor(amount / targetUser.pledge);
    
    // Update user data
    targetUser.totalDonations = (targetUser.totalDonations || 0) + amount;
    targetUser.lastPaymentDate = new Date().toISOString();
    
    // Send confirmation to admin
    const adminEmbed = new EmbedBuilder()
        .setTitle('✅ Payment Recorded!')
        .setColor('#00ff00')
        .addFields(
            { name: '👤 User', value: targetUser.name, inline: true },
            { name: '💰 Amount', value: formatCurrency(amount), inline: true },
            { name: '📅 Date', value: new Date().toLocaleDateString(), inline: true },
            { name: '📊 Days Covered', value: `${daysCovered} days`, inline: true },
            { name: '💳 Remaining Balance', value: formatCurrency(newBalance), inline: true }
        );
    
    await message.reply({ embeds: [adminEmbed] });
    
    // Send notification to user
    try {
        const userEmbed = new EmbedBuilder()
            .setTitle('💰 Payment Received!')
            .setColor('#00ff00')
            .setDescription(`Thank you for your donation of ${formatCurrency(amount)}!`)
            .addFields(
                { name: '📊 Payment Details', value: `Amount: ${formatCurrency(amount)}\nDays Covered: ${daysCovered} days\nRemaining Balance: ${formatCurrency(newBalance)}`, inline: false },
                { name: '💳 Payment Method', value: '**Zelle:** darsinitiative@gmail.com\n**Memo:** "Username-Quran Log"', inline: false }
            )
            .setFooter({ text: 'Keep up your Quran reading habit!' });
        
        const discordUser = await client.users.fetch(targetUserId);
        if (discordUser) {
            await discordUser.send({ embeds: [userEmbed] });
        }
        
    } catch (error) {
        console.error('❌ Error sending payment notification to user:', error);
    }
    
    console.log(`💰 Payment recorded: ${targetUser.name} (${targetUserId}) - Amount: ${amount}`);
}

module.exports = paidCommand; 