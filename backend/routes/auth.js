// routes/auth.js - SAFE VERSION
import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const router = express.Router();

// Environment variables
const CLIENT_ID = process.env.ZOOM_BOT_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOOM_BOT_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const REDIRECT_URI = process.env.ZOOM_REDIRECT_URI || `https://blackkbingo.com/api/auth/zoom/callback`;

// Check for required environment variables
if (!CLIENT_ID || !CLIENT_SECRET || !JWT_SECRET) {
  console.error("FATAL ERROR: Missing environment variables in auth.js");
  process.exit(1);
}

/**
 * @route GET /api/auth/zoom
 * @description Redirects the user to the Zoom authorization page
 */
router.get("/zoom", (req, res) => {
  console.log("ZOOM_REDIRECT_URI env var:", process.env.ZOOM_REDIRECT_URI);
  console.log("Using REDIRECT_URI:", REDIRECT_URI);
  const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
  console.log("Redirecting user to Zoom for authorization...");
  console.log("Auth URL:", authUrl);
  res.redirect(authUrl);
});

/**
 * @route GET /api/auth/zoom/callback
 * @description The callback URL that Zoom redirects to after user authorization
 */
router.get("/zoom/callback", async (req, res) => {
  console.log("✅ /api/auth/zoom/callback route handler ENTERED");
  console.log("Received query parameters from Zoom:", req.query);

  const { code } = req.query;

  if (!code) {
    console.error("❌ Authorization code was not found in the callback query params");
    return res.status(400).json({ message: "Authorization code is missing." });
  }

  console.log("Received authorization code. Preparing to exchange for token.");

  try {
    // Exchange Authorization Code for Access Token
    console.log("Exchanging code for token...");
    const tokenResponse = await axios.post("https://zoom.us/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI
      },
      headers: {
        "Authorization": "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
    });

    const { access_token, refresh_token } = tokenResponse.data;
    console.log("Successfully received access token.");

    // Fetch User Profile from Zoom API
    console.log("Fetching user profile from Zoom API...");
    const userProfileResponse = await axios.get("https://api.zoom.us/v2/users/me", {
      headers: { "Authorization": `Bearer ${access_token}` },
    });
    
    const { id: zoomId, email, first_name, last_name } = userProfileResponse.data;
    console.log(`Successfully fetched profile for user: ${email} (Zoom ID: ${zoomId})`);

    // Upsert User in Database
    console.log("Upserting user data into the database...");
    const user = await User.findOneAndUpdate(
      { zoomId: zoomId },
      {
        zoomId: zoomId,
        email: email,
        firstName: first_name,
        lastName: last_name,
        accessToken: access_token,
        refreshToken: refresh_token,
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`User upserted successfully. DB User ID: ${user._id}`);

    // Create Application-Specific JWT
    const appToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    console.log("Application JWT created. Redirecting to frontend.");

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}?token=${appToken}&user=${encodeURIComponent(JSON.stringify({
      id: user._id, 
      email: user.email, 
      firstName: user.firstName 
    }))}`;
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error("❌ Error during OAuth flow:", error);
    res.status(500).send("Authentication failed due to an internal error.");
  }
});

export default router; 