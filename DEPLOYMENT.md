# 🚀 Deploy Your Quran Bot to Railway

## Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Make sure all files are committed

## Step 2: Deploy to Railway
1. Go to [Railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your quran-bot repository
5. Railway will automatically detect it's a Node.js project

## Step 3: Set Environment Variables
1. In your Railway project dashboard, go to "Variables"
2. Add a new variable:
   - **Name**: `DISCORD_TOKEN`
   - **Value**: Your Discord bot token (the long string from Discord Developer Portal)

## Step 4: Deploy
1. Railway will automatically deploy your bot
2. Check the "Deployments" tab to see the build status
3. Once deployed, your bot will be online 24/7!

## 🔧 Alternative: Render Deployment

### Option A: Render (Free Tier)
1. Go to [Render.com](https://render.com)
2. Sign up and create a new "Web Service"
3. Connect your GitHub repository
4. Set build command: `npm install`
5. Set start command: `node app.js`
6. Add environment variable `DISCORD_TOKEN`
7. Deploy!

### Option B: Heroku
1. Install Heroku CLI
2. Run: `heroku create your-bot-name`
3. Run: `heroku config:set DISCORD_TOKEN=your_token`
4. Run: `git push heroku main`

## 🛡️ Security Notes
- Never commit your bot token to GitHub
- Use environment variables for sensitive data
- Your bot will run 24/7 on the cloud
- No need to keep your computer running

## 📊 Monitoring
- Railway/Render provide logs and monitoring
- You can see if your bot is online
- Automatic restarts if it crashes 