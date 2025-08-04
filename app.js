const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Import command handlers
const registerCommand = require('./commands/register');
const logCommand = require('./commands/log');
const forgotCommand = require('./commands/forgot');
const exemptCommand = require('./commands/exempt');
const streakCommand = require('./commands/streak');
const paidCommand = require('./commands/paid');
const leaveCommand = require('./commands/leave');
const continueCommand = require('./commands/continue');

// Import utilities
const { getCurrentDate, isFajrToFajr, isBefore7AM } = require('./utils/time');
const { sendDailySummary, sendWeeklyReports, sendFridayReminders } = require('./utils/cron');
const { loadData, saveData, getUser, updateUser } = require('./utils/helpers');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Global data storage
let botData = {
    users: {},
    logs: {},
    admins: ['1150930976294318082'], // Add admin user IDs here - vunnymane
    guildId: null, // Will be set when bot joins a server
    channelId: null // Will be set for daily summaries
};

// Registration state tracking
const registrationStates = new Map();

// Load existing data
try {
    botData = loadData();
    console.log('✅ Data loaded successfully');
} catch (error) {
    console.log('⚠️ No existing data found, starting fresh');
}

// Create a simple web server for Railway health checks
const server = http.createServer((req, res) => {
    console.log(`🌐 Health check request received`);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Quran Bot is running!');
});

// Start the web server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('❌ Web server error:', err);
});

// Ready event
client.on('ready', () => {
    console.log('🤖 Quran Accountability Bot is ready!');
    console.log(`📊 Tracking ${Object.keys(botData.users).length} users`);
    console.log(`🖥️ Logged in as ${client.user.tag}`);
    
    // Start scheduled tasks
    startScheduledTasks();
});

// Message handling
client.on('messageCreate', async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;
    
    const content = message.content.trim();
    const userId = message.author.id;
    
    // Handle commands
    if (content.startsWith('!')) {
        const [command, ...args] = content.slice(1).split(' ');
        
        // Prevent spam by checking if user is already in registration
        if (command.toLowerCase() === 'register' && registrationStates.has(userId)) {
            const embed = new EmbedBuilder()
                .setTitle('⏳ Registration in Progress')
                .setDescription('You already have a registration in progress. Please complete it or wait for it to timeout.')
                .setColor('#ffaa00');
            await message.reply({ embeds: [embed] });
            return;
        }
        
        try {
            switch (command.toLowerCase()) {
                case 'register':
                    await registerCommand(client, message, args, botData, registrationStates);
                    break;
                    
                case 'log':
                    await logCommand(client, message, args, botData);
                    break;
                    
                case 'forgot':
                    await forgotCommand(client, message, args, botData);
                    break;
                    
                case 'exempt':
                    await exemptCommand(client, message, args, botData);
                    break;
                    
                case 'streak':
                    await streakCommand(client, message, args, botData);
                    break;
                    
                case 'paid':
                    await paidCommand(client, message, args, botData);
                    break;
                    
                case 'leave':
                    await leaveCommand(client, message, args, botData);
                    break;
                    
                case 'continue':
                    await continueCommand(client, message, args, botData);
                    break;
                    
                case 'ping':
                    await message.reply('🕌 Quran Bot is online!');
                    break;
                    
                case 'help':
                    await sendHelpMessage(message);
                    break;
                    
                case 'setup':
                    await setupCommand(message, botData);
                    break;
                    
                case 'exit':
                    await exitCommand(message, botData);
                    break;
                    
                case 'view':
                    await viewCommand(message, botData);
                    break;
                    
                default:
                    // Ignore unknown commands
                    break;
            }
            
            // Save data after each command
            saveData(botData);
            
        } catch (error) {
            console.error('❌ Error handling command:', error);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error Occurred')
                .setDescription('An error occurred while processing your command. Please try again.')
                .setColor('#ff0000');
            await message.reply({ embeds: [errorEmbed] });
        }
    }
});

// Setup command for admins
async function setupCommand(message, data) {
    // Check if user is admin
    if (!data.admins.includes(message.author.id)) {
        await message.reply('❌ You do not have permission to use this command.');
        return;
    }
    
    // Set up the channel for daily summaries
    data.guildId = message.guild.id;
    data.channelId = message.channel.id;
    
    const embed = new EmbedBuilder()
        .setTitle('🕌 Quran Bot Setup Complete')
        .setDescription('This channel will now receive daily summaries and reminders.')
        .setColor('#00ff00')
        .addFields(
            { name: '📊 Daily Summaries', value: 'Posted at 7:00 AM', inline: true },
            { name: '📅 Weekly Reports', value: 'Sent privately on Sundays', inline: true },
            { name: '🕌 Friday Reminders', value: 'Surah Kahf & Mulk reminders', inline: true }
        )
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
    console.log(`✅ Bot setup completed in ${message.guild.name}`);
}

// Exit command for users to leave the system completely
async function exitCommand(message, data) {
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
    
    // Remove user completely from the system
    delete data.users[userId];
    
    // Remove user from all logs
    Object.keys(data.logs).forEach(date => {
        if (data.logs[date][userId]) {
            delete data.logs[date][userId];
        }
    });
    
    const embed = new EmbedBuilder()
        .setTitle('👋 Goodbye!')
        .setColor('#ffaa00')
        .setDescription(`**${user.name}**, you have been completely removed from the Quran accountability system.`)
        .addFields({
            name: '💡 Thank you for participating',
            value: 'We hope you continue your Quran journey independently. You can always rejoin with `!register` if you change your mind.',
            inline: false
        })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
    
    console.log(`👋 User left system: ${user.name} (${userId})`);
}

// View command for all users to see system status
async function viewCommand(message, data) {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = data.logs[today] || {};
    
    // Get all active users
    const allUsers = Object.values(data.users).filter(user => user.active !== false && !user.paused);
    
    if (allUsers.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle('📊 Quran Accountability Status')
            .setColor('#0099ff')
            .setDescription('No users registered yet.')
            .setFooter({ text: 'Join the accountability system with !register' });
        
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Create user list with checkmarks
    const userList = allUsers.map(user => {
        const hasLogged = todayLogs[user.id] && todayLogs[user.id].completed;
        return hasLogged ? `✅ ${user.name}` : `⬜ ${user.name}`;
    }).join('\n');
    
    const loggedCount = allUsers.filter(user => todayLogs[user.id] && todayLogs[user.id].completed).length;
    
    const embed = new EmbedBuilder()
        .setTitle('📊 Quran Accountability Status')
        .setColor('#0099ff')
        .setDescription(`**Date:** ${today}\n**Total Participants:** ${allUsers.length}\n**Logged Today:** ${loggedCount}/${allUsers.length}`)
        .addFields({
            name: '👥 Participants',
            value: userList,
            inline: false
        })
        .setFooter({ text: '✅ = Logged today | ⬜ = Not logged yet' })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
    
    console.log(`📊 User viewed system status: ${message.author.username}`);
}

// Help message
async function sendHelpMessage(message) {
    const embed = new EmbedBuilder()
        .setTitle('🕌 Quran Accountability Bot Commands')
        .setColor('#0099ff')
        .setDescription('Here are all available commands:')
        .addFields(
            {
                name: '📝 Registration & Tracking',
                value: '• `!register` - Start interactive registration process\n• `!log` - Mark today as completed\n• `!forgot` - Log yesterday\'s progress (before 7am)\n• `!exempt <reason>` - Mark exemption for today',
                inline: false
            },
            {
                name: '📊 Progress & Reports',
                value: '• `!streak` - Check your current streak\n• `!view` - View system status\n• `!ping` - Check if bot is online\n• `!help` - Show this help message',
                inline: false
            },
            {
                name: '👤 Account Management',
                value: '• `!leave` - Pause your tracking\n• `!continue` - Resume tracking after auto-pause\n• `!exit` - Leave the system completely',
                inline: false
            },
            {
                name: '🔧 Admin Commands',
                value: '• `!setup` - Configure channel for summaries\n• `!paid @user <amount>` - Mark payment',
                inline: false
            },
            {
                name: '💡 Automatic Features',
                value: '• Daily summaries at 7am\n• Weekly reports on Sundays\n• Friday reminders for Surah Kahf & Mulk\n• Auto-pause after 3 missed days',
                inline: false
            }
        )
        .setFooter({ text: 'Example: !register (then follow the prompts)' });
    
    await message.reply({ embeds: [embed] });
}

// Scheduled tasks
function startScheduledTasks() {
    // Daily summary at 7am
    cron.schedule('0 7 * * *', async () => {
        try {
            await sendDailySummary(client, botData);
        } catch (error) {
            console.error('❌ Error sending daily summary:', error);
        }
    });
    
    // Weekly reports on Sunday at 8am
    cron.schedule('0 8 * * 0', async () => {
        try {
            await sendWeeklyReports(client, botData);
        } catch (error) {
            console.error('❌ Error sending weekly reports:', error);
        }
    });
    
    // Friday reminders
    cron.schedule('0 8 * * 5', async () => {
        try {
            await sendFridayReminders(client, botData, 'morning');
        } catch (error) {
            console.error('❌ Error sending Friday morning reminder:', error);
        }
    });
    
    cron.schedule('0 20 * * 5', async () => {
        try {
            await sendFridayReminders(client, botData, 'evening');
        } catch (error) {
            console.error('❌ Error sending Friday evening reminder:', error);
        }
    });
    
    console.log('⏰ Scheduled tasks started');
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down bot...');
    saveData(botData);
    await client.destroy();
    server.close();
    process.exit(0);
});

// Login with Discord token
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ DISCORD_TOKEN environment variable is required!');
    console.error('Please set the DISCORD_TOKEN environment variable in Railway.');
    process.exit(1);
}
console.log('🔑 Using Discord bot token from environment...');

client.login(token).catch(error => {
    console.error('❌ Failed to login:', error);
    console.error('Please check your Discord token and bot permissions.');
    process.exit(1);
}); 