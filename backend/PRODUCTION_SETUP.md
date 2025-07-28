# Production Setup - API Keys

## Problem
The OpenAI API key works locally but returns 401 (Unauthorized) on the production server.

## Solution Options

### Option 1: cPanel Environment Variables (Recommended)
1. Log into your cPanel account
2. Go to "Setup Node.js App"
3. Find your `zoom_bot_main` application
4. Click "Edit"
5. Scroll to "Environment variables" section
6. Add a new variable:
   - Name: `OPENAI_API_KEY`
   - Value: `your-actual-api-key-here`
7. Click "Add Variable"
8. Click "Save"
9. Click "Restart" to restart the application

### Option 2: Using api-keys.json file
1. SSH into your server or use cPanel File Manager
2. Navigate to `/home/blackkgz/zoom_bot_main/backend/config/`
3. Create a file named `api-keys.json` (not .example)
4. Add your API key:
   ```json
   {
     "OPENAI_API_KEY": "sk-your-actual-key-here"
   }
   ```
5. Save the file
6. Restart the Node.js app from cPanel

### Option 3: Direct .env file
1. SSH into your server
2. Navigate to `/home/blackkgz/zoom_bot_main/backend/`
3. Edit the `.env` file:
   ```bash
   nano .env
   ```
4. Ensure it contains:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
5. Save and exit
6. Restart the app

## Testing
After setting up, test the API key:
1. Visit: https://aizoomai.com/api/transcription/test-api-key
2. You should see: `"success": true, "message": "API key is valid"`

## Troubleshooting
- Make sure there are no extra spaces or quotes around the API key
- The key should start with `sk-`
- After adding the key, you MUST restart the Node.js app
- Check the app logs in cPanel for any error messages

## Security Note
- Never commit the `api-keys.json` file to git
- Keep your API keys secret
- Regenerate keys if they're ever exposed 