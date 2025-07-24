// services/tokenManager.js
import axios from 'axios';
import User from '../models/user.js';
import 'dotenv/config';

const CLIENT_ID = process.env.ZOOM_BOT_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOOM_BOT_CLIENT_SECRET;
const authHeader = 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

export async function getUserAccessToken(userId) {
  const user = await User.findById(userId);
  if (!user) {
    console.error(`[TOKEN_MANAGER] User not found: ${userId}`);
    return null;
  }
  
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
    user.accessToken = access_token;
    user.refreshToken = refresh_token;
    await user.save();
    console.log(`[TOKEN_MANAGER] Token refreshed successfully for ${user.email}.`);
    return access_token;
  } catch (error) {
    console.error(`[TOKEN_MANAGER] Failed to refresh token for ${user.email}:`, error.response?.data);
    return null;
  }
}
