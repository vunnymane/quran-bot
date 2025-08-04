# 🕌 Quran Accountability Bot

A Discord bot designed to help users stay consistent with their daily Quran reading or memorization goals. The bot provides accountability through daily logging, streak tracking, donation pledges, and automatic reminders.

## ✨ Features

### 📝 Core Functionality
- **User Registration**: Register with daily Quran goal and donation pledge
- **Daily Logging**: Mark daily progress with `!log` command
- **Backfill Support**: Use `!forgot` to log yesterday's progress (before 7am)
- **Exemptions**: Mark exemptions for sick/travel days with `!exempt`
- **Streak Tracking**: Automatic streak calculation and milestone celebrations
- **Auto-Pause**: Users missing 3 consecutive days are automatically paused

### 📊 Reports & Reminders
- **Daily Summaries**: Posted at 7am showing who completed/missed
- **Weekly Reports**: Private reports sent every Sunday with detailed stats
- **Friday Reminders**: Automatic reminders for Surah Kahf (morning) and Surah Mulk (evening)
- **Progress Tracking**: Check your streak and stats with `!streak`

### 💰 Donation System
- **Pledge Tracking**: Users pledge donation amount for missed days
- **Admin Controls**: Admins can mark payments with `!paid @user <amount>`
- **Balance Tracking**: Automatic calculation of donation balances

### 👤 User Management
- **Account Pause**: Users can pause tracking with `!leave`
- **Account Resume**: Resume tracking with `!continue`
- **Admin Controls**: Admin-only commands for payment management

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- Discord application and bot token
- Railway account (for hosting)

### Installation

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to "Bot" section and create a bot
   - Copy the bot token

2. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd quran-bot
   npm install
   ```

3. **Configure Bot Token**
   Set your Discord bot token as an environment variable:
   ```bash
   export DISCORD_TOKEN=your_bot_token_here
   ```

4. **Configure Admin Users**
   Edit `app.js` and add admin user IDs to the `admins` array:
   ```javascript
   admins: ['123456789012345678'] // Add admin Discord user IDs here
   ```

5. **Start the Bot**
   ```bash
   npm start
   ```

6. **Invite Bot to Server**
   - Use the OAuth2 URL generator in Discord Developer Portal
   - Select "bot" scope and required permissions
   - Invite the bot to your server

7. **Setup Channel**
   - Run `!setup` in the channel where you want daily summaries
   - Only admins can run this command

## 📋 Commands

### User Commands
| Command | Description | Example |
|---------|-------------|---------|
| `!register <goal> <pledge>` | Register with daily goal and pledge | `!register "Read 1 page" 5` |
| `!log` | Mark today as completed | `!log` |
| `!forgot` | Log yesterday's progress (before 7am) | `!forgot` |
| `!exempt <reason>` | Mark exemption for today | `!exempt sick` |
| `!streak` | Check your current streak and stats | `!streak` |
| `!leave` | Pause your tracking | `!leave` |
| `!continue` | Resume tracking after auto-pause | `!continue` |
| `!ping` | Check if bot is online | `!ping` |
| `!help` | Show all commands | `!help` |

### Admin Commands
| Command | Description | Example |
|---------|-------------|---------|
| `!setup` | Configure channel for daily summaries | `!setup` |
| `!paid @user <amount>` | Mark donation payment | `!paid @user 25` |

## ⏰ Automatic Features

### Daily Schedule
- **7:00 AM**: Daily summary posted to configured channel
- **8:00 AM**: Friday morning reminder (Surah Kahf)
- **8:00 PM**: Friday evening reminder (Surah Mulk)

### Weekly Schedule
- **Sunday 8:00 AM**: Private weekly reports sent to all users

### Auto-Pause System
- Users missing 3 consecutive days are automatically paused
- Warning messages sent via private message
- Users must use `!continue` to resume

## 🏗️ Architecture

### File Structure
```
quran-bot/
├── app.js                 # Main bot application
├── data.json             # Persistent user data (auto-created)
├── package.json          # Dependencies and scripts
├── README.md            # This file
├── utils/
│   ├── time.js          # Time utility functions
│   ├── helpers.js       # Data management helpers
│   └── cron.js          # Scheduled task functions
└── commands/
    ├── register.js       # User registration
    ├── log.js           # Daily logging
    ├── forgot.js        # Backfill logging
    ├── exempt.js        # Exemption handling
    ├── streak.js        # Progress tracking
    ├── paid.js          # Admin payment marking
    ├── leave.js         # Pause tracking
    └── continue.js      # Resume tracking
```

### Data Storage
- **`data.json`**: Persistent storage for user data, logs, and settings
- **Discord User IDs**: Used for user identification and permissions

### Key Dependencies
- `discord.js`: Discord bot framework
- `node-cron`: Scheduled tasks
- `moment`: Date/time handling

## 🚀 Deployment

### Railway Deployment
1. Connect your GitHub repository to Railway
2. Set `DISCORD_TOKEN` environment variable
3. Deploy and monitor logs
4. Invite bot to your Discord server
5. Run `!setup` in desired channel

### Local Development
```bash
npm run dev
```

## 🔧 Configuration

### Bot Permissions
The bot needs the following permissions:
- Send Messages
- Embed Links
- Read Message History
- Use Slash Commands (if implemented)

### Time Zones
The bot uses the server's local timezone. For accurate scheduling:
- Ensure server timezone is set correctly
- Adjust cron schedules in `app.js` if needed

### Admin Setup
Add admin Discord user IDs to the `admins` array in `app.js`:
```javascript
admins: ['123456789012345678', '876543210987654321']
```

### Custom Messages
Edit message templates in the respective command files to customize bot responses.

## 🛡️ Error Handling

The bot includes comprehensive error handling:
- Graceful recovery from data corruption
- Validation of all user inputs
- Prevention of duplicate logs
- Time-based restrictions for backfill
- Admin permission checks

## 📈 Monitoring

### Logs
The bot provides detailed console logging:
- User registrations and actions
- Error messages and debugging info
- Scheduled task execution status

### Data Backup
- `data.json` contains all user data
- Regular backups recommended for production
- Data can be restored by replacing `data.json`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues or questions:
1. Check the console logs for error messages
2. Verify Discord bot token and permissions
3. Ensure all dependencies are installed
4. Check file permissions for data.json

---

**🕌 May Allah make this bot beneficial for the Ummah!** 