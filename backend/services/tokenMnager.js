// services/tokenManager.js
import axios from 'axios';
import User from '../models/user.js';
import 'dotenv/config';

// These credentials are from your USER-LEVEL OAuth App
const CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const authHeader = 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

/**
 * Gets a valid access token for a specific user, refreshing if necessary.
 * @param {string} userId - The MongoDB _id of the user.
 * @returns {string|null} A valid access token, or null if refresh fails.
 */
export async function getUserAccessToken(userId) {
  const user = await User.findById(userId);
  if (!user) {
    console.error(`[TOKEN_MANAGER] User not found for ID: ${userId}`);
    return null;
  }

  // For simplicity, we can assume the token might be expired and try to refresh.
  // A more advanced solution would check an 'expires_at' field on the User model.
  
  console.log(`[TOKEN_MANAGER] Refreshing token for user ${user.email}...`);

  try {
    const response = await axios.post('https://zoom.us/oauth/token', null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token: user.refreshToken,
      },
      headers: { 'Authorization': authHeader },
    });

    const { access_token, refresh_token } = response.data;

    // Update the user's tokens in the database with the new ones
    user.accessToken = access_token;
    user.refreshToken = refresh_token;
    await user.save();
    
    console.log(`[TOKEN_MANAGER] Token refreshed successfully for ${user.email}.`);
    return access_token;

  } catch (error) {
    console.error(`[TOKEN_MANAGER] Failed to refresh token for ${user.email}:`, error.response?.data);
    // This can happen if the refresh token is revoked or expired.
    // The user would need to re-authenticate.
    return null;
  }
}
