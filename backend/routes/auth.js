// routes/auth.js
import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const router = express.Router();

// --- Configuration ---
// Ensure these are loaded correctly from your .env file
const CLIENT_ID = process.env.ZOOM_BOT_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOOM_BOT_CLIENT_SECRET;
// This URI MUST EXACTLY MATCH the "Redirect URL for OAuth" in your Zoom App settings
const REDIRECT_URI = `https://blackkbingo.com/api/auth/zoom/callback`;

// Helper function to check for required environment variables on startup
const checkEnvVariables = () => {
  if (!CLIENT_ID || !CLIENT_SECRET || !process.env.JWT_SECRET) {
    console.error("FATAL ERROR: Missing required environment variables (ZOOM_BOT_CLIENT_ID, ZOOM_BOT_CLIENT_SECRET, JWT_SECRET).");
    process.exit(1); // Exit the application if secrets are not set
  }
};

checkEnvVariables();


/**
 * @route   GET /api/auth/zoom
 * @desc    Redirects the user to the Zoom authorization screen.
 * @access  Public
 */
router.get("/zoom", (req, res) => {
  // Build the authorization URL
  const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
  
  // For debugging: log the URL to ensure it's correct
  console.log("Redirecting to Zoom auth URL:", authUrl);
  
  res.redirect(authUrl);
});

/**
 * @route   GET /api/auth/zoom/callback
 * @desc    Handles the callback from Zoom after user authorization.
 * @access  Public
 */
router.get("/zoom/callback", async (req, res) => {
  // Zoom redirects with a temporary authorization code
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Error: Authorization code not found in callback query.");
  }

  console.log("Received authorization code from Zoom.");

  try {
    // --- Step 1: Exchange authorization code for an access token ---
    console.log("Exchanging authorization code for an access token...");
    const tokenResponse = await axios.post("https://zoom.us/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI // This must match the initial redirect_uri
      },
      headers: {
        "Authorization": "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded" // Good practice to include
      },
    });

    const { access_token, refresh_token } = tokenResponse.data;
    console.log("Successfully received access token.");

    // --- Step 2: Use the access token to get user's profile info ---
    console.log("Fetching user profile from Zoom API...");
    const userProfileResponse = await axios.get("https://api.zoom.us/v2/users/me", {
      headers: { "Authorization": `Bearer ${access_token}` },
    });
    
    const { id, email, first_name, last_name } = userProfileResponse.data;
    console.log(`Successfully fetched profile for user: ${email} (Zoom ID: ${id})`);

    // --- Step 3: Find or create a user in your local database (Upsert) ---
    console.log("Upserting user into the database...");
    const user = await User.findOneAndUpdate(
      { zoomId: id },
      {
        zoomId: id,
        email: email,
        firstName: first_name,
        lastName: last_name,
        accessToken: access_token, // Encrypt these in a real production app
        refreshToken: refresh_token, // Encrypt these in a real production app
      },
      { upsert: true, new: true }
    );
    console.log("Database operation successful. User ID:", user._id);

    // --- Step 4: Create a JWT token for your application's session management ---
    const appToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // --- Step 5: Send a success response to the client ---
    // In a real frontend application, you would likely redirect the user
    // to their dashboard with the token, e.g., res.redirect(`/dashboard?token=${appToken}`);
    res.status(200).json({
      message: "User authentication successful!",
      token: appToken,
      user: { id: user._id, email: user.email }
    });

  } catch (error) {
    // --- Detailed Error Logging ---
    console.error("--- Zoom OAuth Error ---");
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Status:", error.response.status);
      console.error("Headers:", error.response.headers);
      console.error("Data:", error.response.data); // This is often the most useful part!
      console.error("Request Config:", error.config);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Request Error:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("General Error Message:", error.message);
    }
    res.status(500).send("User authentication failed due to an internal error.");
  }
});

export default router;