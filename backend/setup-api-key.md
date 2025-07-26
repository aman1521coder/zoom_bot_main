# Setting Up OpenAI API Key on Deployed Server

The transcription feature requires a valid OpenAI API key. If you're seeing "Unauthorized" errors, follow these steps:

## 1. Get your OpenAI API Key
- Go to https://platform.openai.com/api-keys
- Create a new API key or use an existing one
- Copy the key (it starts with `sk-`)

## 2. Add to Production Environment

### Option A: Through cPanel (Recommended)
1. Log into your cPanel account
2. Go to "Setup Node.js App"
3. Find your zoom_bot_main application
4. Click "Edit"
5. In the "Environment variables" section, add:
   - Variable: `OPENAI_API_KEY`
   - Value: `your-api-key-here`
6. Click "Add Variable"
7. Click "Save" and restart the app

### Option B: Via SSH
1. SSH into your server
2. Navigate to the backend directory
3. Edit the .env file:
   ```bash
   cd ~/zoom_bot_main/backend
   nano .env
   ```
4. Add or update the line:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```
5. Save and restart the app

## 3. Verify Setup
After adding the key, test it:
```bash
node -e "require('dotenv').config(); console.log('Key exists:', !!process.env.OPENAI_API_KEY)"
```

## Note
If transcription still fails, the app will save recordings without transcription. You can manually transcribe them later when the API key is fixed. 