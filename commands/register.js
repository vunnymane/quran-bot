const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCurrentDate } = require('../utils/time');
const { getUser, updateUser, validateGoal, validatePledge } = require('../utils/helpers');

/**
 * Handle user registration
 * Command: !register
 */
async function registerCommand(client, message, args, data, registrationStates) {
    const userId = message.author.id;
    const userName = message.author.username;
    
    // Check if user is already registered
    const existingUser = getUser(data, userId);
    if (existingUser) {
        const embed = new EmbedBuilder()
            .setTitle('❌ Already Registered')
            .setDescription('You are already registered! Use `!help` to see available commands.')
            .setColor('#ff0000');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Check if already in registration process
    if (registrationStates.has(userId)) {
        const embed = new EmbedBuilder()
            .setTitle('⏳ Registration in Progress')
            .setDescription('You already have a registration in progress. Please complete it or wait for it to timeout.')
            .setColor('#ffaa00');
        await message.reply({ embeds: [embed] });
        return;
    }
    
    // Initialize registration state
    registrationStates.set(userId, {
        step: 'goal',
        goal: null,
        pledge: null
    });
    
    // Send initial DM redirect message
    const redirectEmbed = new EmbedBuilder()
        .setTitle('🕌 Quran Accountability Registration')
        .setColor('#0099ff')
        .setDescription(`Welcome **${userName}**! I've sent you a private message to complete your registration.`)
        .addFields({
            name: '💡 Next Steps',
            value: 'Please check your DMs to continue with the registration process.',
            inline: false
        })
        .setFooter({ text: 'Registration will be completed in private messages' });
    
    await message.reply({ embeds: [redirectEmbed] });
    
    // Send initial goal prompt via DM
    const goalEmbed = new EmbedBuilder()
        .setTitle('🕌 Quran Accountability Registration')
        .setColor('#0099ff')
        .setDescription(`Welcome **${userName}**! Let's set up your Quran accountability tracking.`)
        .addFields({
            name: '📖 Step 1: What is your daily Quran goal?',
            value: 'Please reply with your daily goal. Examples:\n• "Read 1 page daily"\n• "Memorize 3 verses"\n• "Read 10 minutes"\n• "Complete 1 juz per week"\n\n**Your goal will be kept private** - only you and admins can see it.',
            inline: false
        })
        .setFooter({ text: 'Reply with your goal to continue' });
    
    try {
        await message.author.send({ embeds: [goalEmbed] });
    } catch (error) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('❌ Cannot Send DM')
            .setDescription('I cannot send you a private message. Please enable DMs from server members and try again.')
            .setColor('#ff0000');
        await message.reply({ embeds: [errorEmbed] });
        registrationStates.delete(userId);
        return;
    }
    
    // Set up message collector for goal in DM
    const filter = m => m.author.id === userId && m.channel.type === 1; // DM only
    const collector = message.author.dmChannel.createMessageCollector({ filter, time: 300000, max: 1 }); // 5 minutes
    
    collector.on('collect', async (goalMessage) => {
        const goal = goalMessage.content.trim();
        
        if (!validateGoal(goal)) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Invalid Goal')
                .setDescription('Goal must be between 3-100 characters. Please try again with `!register`.')
                .setColor('#ff0000');
            await message.author.send({ embeds: [errorEmbed] });
            registrationStates.delete(userId);
            return;
        }
        
        // Store goal and ask for pledge
        const state = registrationStates.get(userId);
        state.goal = goal;
        state.step = 'pledge';
        
        const pledgeEmbed = new EmbedBuilder()
            .setTitle('💰 Step 2: Set Your Donation Pledge')
            .setColor('#ffaa00')
            .setDescription('Now let\'s set your donation pledge for missed days.')
            .addFields(
                {
                    name: '💡 Why a pledge?',
                    value: 'The pledge helps with accountability. When you miss a day, you pledge to donate this amount. This encourages consistency and helps others in need.',
                    inline: false
                },
                {
                    name: '💰 How much will you pledge per missed day?',
                    value: 'Enter any amount (can be $0). Examples:\n• `5` (pledge $5 per missed day)\n• `10` (pledge $10 per missed day)\n• `0` (no pledge, just accountability)',
                    inline: false
                },
                {
                    name: '💳 Payment Method',
                    value: '**Zelle:** darsinitiative@gmail.com\n**Include in memo:** "Username-Quran Log"',
                    inline: false
                }
            )
            .setFooter({ text: 'Reply with your pledge amount' });
        
        await message.author.send({ embeds: [pledgeEmbed] });
        
        // Set up collector for pledge in DM
        const pledgeCollector = message.author.dmChannel.createMessageCollector({ filter, time: 300000, max: 1 });
        
        pledgeCollector.on('collect', async (pledgeMessage) => {
            const pledgeText = pledgeMessage.content.trim();
            const pledge = parseFloat(pledgeText);
            
            if (isNaN(pledge) || pledge < 0 || pledge > 1000) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Invalid Pledge')
                    .setDescription('Please enter a valid amount between $0-$1000. Try again with `!register`.')
                    .setColor('#ff0000');
                await message.author.send({ embeds: [errorEmbed] });
                registrationStates.delete(userId);
                return;
            }
            
            // Complete registration
            const finalState = registrationStates.get(userId);
            finalState.pledge = pledge;
            
            // Create new user
            const newUser = {
                id: userId,
                name: userName,
                goal: finalState.goal,
                pledge: pledge,
                registeredDate: getCurrentDate(),
                active: true,
                paused: false,
                warned: false,
                totalDonations: 0,
                lastLogDate: null
            };
            
            // Add user to data
            data.users[userId] = newUser;
            
            // Send confirmation message via DM
            const confirmation = new EmbedBuilder()
                .setTitle('✅ Registration Successful!')
                .setColor('#00ff00')
                .addFields(
                    { name: '👤 Name', value: newUser.name, inline: true },
                    { name: '💰 Pledge', value: `$${pledge} per missed day`, inline: true },
                    { name: '📅 Registered', value: getCurrentDate(), inline: true }
                )
                .addFields({
                    name: '💡 Next Steps',
                    value: '• Use `!log` daily to mark your progress\n• Use `!streak` to check your current streak\n• Use `!help` for all available commands',
                    inline: false
                })
                .setFooter({ text: 'May Allah make it easy for you to be consistent!' });
            
            await message.author.send({ embeds: [confirmation] });
            
            // Send welcome message with payment info
            const welcomeEmbed = new EmbedBuilder()
                .setTitle('🕌 Welcome to Quran Accountability!')
                .setColor('#0099ff')
                .setDescription(`Assalamu alaikum **${newUser.name}**,\n\nYou've successfully registered for Quran accountability tracking.`)
                .addFields(
                    { name: '📖 Your Daily Goal', value: finalState.goal, inline: true },
                    { name: '💰 Your Pledge', value: `$${pledge} per missed day`, inline: true }
                )
                .addFields({
                    name: '📝 How it works',
                    value: '• Log your progress daily with `!log`\n• If you forget, use `!forgot` before 7am next day\n• Miss 3 consecutive days → auto-pause\n• Weekly reports sent every Sunday',
                    inline: false
                })
                .addFields({
                    name: '💳 Payment Information',
                    value: '**Zelle:** darsinitiative@gmail.com\n**Memo:** "Username-Quran Log"\n\nWhen you miss days, you can fulfill your pledge using this payment method.',
                    inline: false
                })
                .addFields({
                    name: '💡 Tips for success',
                    value: '• Set a consistent time for your Quran reading\n• Keep your goal realistic and achievable\n• Use the server for motivation and accountability',
                    inline: false
                })
                .setFooter({ text: 'May Allah bless your journey!' });
            
            await message.author.send({ embeds: [welcomeEmbed] });
            
            // Clean up
            registrationStates.delete(userId);
            
            console.log(`✅ New user registered: ${newUser.name} (${userId})`);
        });
        
        pledgeCollector.on('end', (collected) => {
            if (collected.size === 0) {
                const timeoutEmbed = new EmbedBuilder()
                    .setTitle('⏰ Registration Timeout')
                    .setDescription('Registration timed out. Please try again with `!register`.')
                    .setColor('#ff0000');
                message.author.send({ embeds: [timeoutEmbed] });
                registrationStates.delete(userId);
            }
        });
    });
    
    collector.on('end', (collected) => {
        if (collected.size === 0) {
            const timeoutEmbed = new EmbedBuilder()
                .setTitle('⏰ Registration Timeout')
                .setDescription('Registration timed out. Please try again with `!register`.')
                .setColor('#ff0000');
            message.author.send({ embeds: [timeoutEmbed] });
            registrationStates.delete(userId);
        }
    });
}

module.exports = registerCommand; 