#!/bin/bash

echo "🚀 Deploying API Key Fix to Production"
echo "====================================="

# Check git status
echo -e "\n📋 Git Status:"
git status --short

# Add and commit changes
echo -e "\n💾 Committing changes..."
git add services/transcriptionService.js
git commit -m "Fix OpenAI API key handling - use instance key instead of local variable"

# Push to remote
echo -e "\n📤 Pushing to remote..."
git push origin main

echo -e "\n✅ Changes pushed successfully!"
echo -e "\n📝 Next steps on your production server:"
echo "1. SSH into your server"
echo "2. Run these commands:"
echo "   cd /home/blackkgz/zoom_bot_main/backend/"
echo "   git pull"
echo "   pm2 restart all"
echo ""
echo "3. Check the logs:"
echo "   pm2 logs --lines 50"
echo ""
echo "4. Look for these debug lines:"
echo "   [DEBUG] Key being sent to OpenAI: Bearer sk-..."
echo "   [DEBUG] Key length: 167 characters"
echo "   [DEBUG] Key starts with 'sk-': true"
echo ""
echo "5. Test transcription again" 