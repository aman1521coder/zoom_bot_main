import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load OpenAI API key from multiple sources
function loadOpenAIKey() {
  // 1. First try environment variable
  if (process.env.OPENAI_API_KEY) {
    console.log('[API_KEYS] OpenAI key loaded from environment');
    return process.env.OPENAI_API_KEY.trim();
  }

  // 2. Try loading from .env file manually (backup method)
  try {
    const envPath = path.join(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/OPENAI_API_KEY=(.+)/);
      if (match && match[1]) {
        console.log('[API_KEYS] OpenAI key loaded from .env file (manual)');
        return match[1].trim().replace(/["']/g, '');
      }
    }
  } catch (error) {
    console.error('[API_KEYS] Error reading .env file:', error.message);
  }

  // 3. Try loading from a separate api-keys.json file (for production)
  try {
    const keysPath = path.join(__dirname, 'api-keys.json');
    if (fs.existsSync(keysPath)) {
      const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
      if (keys.OPENAI_API_KEY) {
        console.log('[API_KEYS] OpenAI key loaded from api-keys.json');
        return keys.OPENAI_API_KEY.trim();
      }
    }
  } catch (error) {
    console.error('[API_KEYS] Error reading api-keys.json:', error.message);
  }

  console.warn('[API_KEYS] ⚠️  No OpenAI API key found in any source');
  return '';
}

// Load and export the API key
export const OPENAI_API_KEY = loadOpenAIKey();

// Set it in process.env for other modules
if (OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = OPENAI_API_KEY;
  console.log('[API_KEYS] Set OPENAI_API_KEY in process.env');
}

export default {
  OPENAI_API_KEY
}; 