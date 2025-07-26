import 'dotenv/config';

console.log('=== API Key Deployment Test ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('API Key exists:', !!process.env.OPENAI_API_KEY);
console.log('API Key length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 10) || 'None');

// Also check if .env file exists
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
console.log('.env file exists:', fs.existsSync(envPath));

// Test loading with different methods
console.log('\n=== Testing different loading methods ===');

// Method 1: Direct process.env
console.log('Method 1 - Direct:', !!process.env.OPENAI_API_KEY);

// Method 2: Try reading .env file directly
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasApiKey = envContent.includes('OPENAI_API_KEY');
  console.log('Method 2 - File contains OPENAI_API_KEY:', hasApiKey);
}

// Show all env vars starting with OPENAI (safely)
console.log('\n=== OpenAI-related env vars ===');
Object.keys(process.env).forEach(key => {
  if (key.includes('OPENAI')) {
    console.log(`${key}: ${process.env[key]?.length || 0} chars`);
  }
});

console.log('\n=== Recommendation ===');
if (!process.env.OPENAI_API_KEY) {
  console.log('❌ API key not loaded. You need to:');
  console.log('1. Add OPENAI_API_KEY to cPanel Node.js app environment variables');
  console.log('2. OR ensure .env file is in the deployment directory');
  console.log('3. Restart the Node.js app after adding the key');
} else {
  console.log('✅ API key is loaded locally but may not be on server');
} 