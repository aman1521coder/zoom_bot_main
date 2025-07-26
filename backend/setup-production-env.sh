#!/bin/bash

echo "=== Setting up OpenAI API Key on Production Server ==="
echo ""
echo "This script will help you add the OpenAI API key to your production environment."
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✅ .env file exists"
    
    # Check if it contains OPENAI_API_KEY
    if grep -q "OPENAI_API_KEY" .env; then
        echo "✅ OPENAI_API_KEY found in .env"
        
        # Get the key value
        API_KEY=$(grep "OPENAI_API_KEY" .env | cut -d '=' -f2)
        echo "📋 Key prefix: ${API_KEY:0:10}..."
        echo "📋 Key length: ${#API_KEY} characters"
        
        echo ""
        echo "⚠️  IMPORTANT: The .env file exists but may not be loaded by the Node.js app."
        echo ""
        echo "To fix this, you need to add the API key to cPanel:"
        echo ""
        echo "1. Log into cPanel"
        echo "2. Go to 'Setup Node.js App'"
        echo "3. Find your zoom_bot_main application"
        echo "4. Click 'Edit'"
        echo "5. In 'Environment variables' section:"
        echo "   - Variable name: OPENAI_API_KEY"
        echo "   - Variable value: $API_KEY"
        echo "6. Click 'Add Variable'"
        echo "7. Click 'Save'"
        echo "8. Click 'Restart' to restart the app"
        echo ""
        echo "Alternative: Run this command in cPanel Terminal or SSH:"
        echo "export OPENAI_API_KEY='$API_KEY'"
        echo ""
    else
        echo "❌ OPENAI_API_KEY not found in .env"
        echo "Add this line to your .env file:"
        echo "OPENAI_API_KEY=your-api-key-here"
    fi
else
    echo "❌ No .env file found"
    echo "Create a .env file with:"
    echo "OPENAI_API_KEY=your-api-key-here"
fi

echo ""
echo "After adding the key, test it by visiting:"
echo "https://blackkbingo.com/api/transcription/test-api-key"
echo "(You need to be logged in)" 