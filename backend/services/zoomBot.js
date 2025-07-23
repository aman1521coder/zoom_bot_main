// services/zoomBot.js
import axios from 'axios';
import 'dotenv/config';

// Load the Server-to-Server OAuth credentials from your .env file

import 'dotenv/config';

// *** TEMPORARY DEBUGGING LOGS ***
console.log("--- DEBUGGING .env values ---");
console.log("ZOOM_BOT_ACCOUNT_ID:", process.env.ZOOM_BOT_ACCOUNT_ID);
console.log("ZOOM_BOT_CLIENT_ID:", process.env.ZOOM_BOT_CLIENT_ID);
console.log("ZOOM_BOT_CLIENT_SECRET:", !!process.env.ZOOM_BOT_CLIENT_SECRET ? "Exists" : "MISSING or empty"); // Don't log the actual secret
console.log("----------------------------");


const ACCOUNT_ID = process.env.ZOOM_BOT_ACCOUNT_ID;
const CLIENT_ID = process.env.ZOOM_BOT_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOOM_BOT_CLIENT_SECRET;


// These variables will act as an in-memory cache for our access token.
let cachedToken = null;
let tokenExpiresAt = null;

/**
 * Gets a valid access token for our Server-to-Server OAuth bot.
 * It will return a cached token if one is available and not expired.
 * Otherwise, it will request a new one from Zoom.
 */
async function getBotAccessToken() {
  // Check if we have a valid, non-expired token in our cache.
  if (cachedToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
    // console.log('[ZOOM BOT] Using cached access token.');
    return cachedToken;
  }

  console.log('[ZOOM BOT] No valid token in cache. Requesting a new one from Zoom...');
  
  // A safety check to ensure credentials are in the .env file.
  if (!ACCOUNT_ID || !CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Missing Zoom Server-to-Server OAuth credentials in .env file.');
  }

  try {
    // This is the API call to Zoom to get an access token.
    const response = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'account_credentials',
        account_id: ACCOUNT_ID,
      },
      headers: {
        // We must send the Client ID and Secret as a base64 encoded string.
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      },
    });

    const tokenData = response.data;
    cachedToken = tokenData.access_token;
    
    // The token expires in `expires_in` seconds (usually 3600).
    // We'll set our internal expiry time to be 5 minutes shorter, just to be safe.
    const expiresIn = tokenData.expires_in;
    tokenExpiresAt = new Date(Date.now() + (expiresIn - 300) * 1000); 

    console.log('[ZOOM BOT] Successfully generated and cached a new token.');
    return cachedToken;

  } catch (error) {
    console.error('[ZOOM BOT] FATAL: Could not get access token from Zoom.', error.response?.data || error.message);
    throw new Error('Could not authenticate the Zoom bot.');
  }
}

/**
 * The main exported function. It returns an Axios instance that is
 * pre-configured with the base URL and a valid Authorization header.
 * Any service can call this to get a ready-to-use API client.
 */
export async function getZoomBotApiClient() {
  const token = await getBotAccessToken();
  
  return axios.create({
    baseURL: 'https://api.zoom.us/v2',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
}
