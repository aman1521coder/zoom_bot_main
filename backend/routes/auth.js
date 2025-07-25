// routes/auth.js
import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/user.js'; // Make sure this path is correct

const router = express.Router();

// --- Configuration ---
// Ensure these variables are loaded correctly from your .env file in your main server file (e.g., server.js)
const CLIENT_ID = process.env.ZOOM_BOT_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOOM_BOT_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
// IMPORTANT: This URI must EXACTLY match the "Redirect URL for OAuth" in your Zoom App Marketplace settings.
// Mismatches (e.g., http vs https, trailing slashes) are a common cause of errors.
const REDIRECT_URI = `https://blackkbingo.com/api/auth/zoom/callback`;

// This check confirms that the variables are available in this module.
if (!CLIENT_ID || !CLIENT_SECRET || !JWT_SECRET) {
  console.error("FATAL ERROR in routes/auth.js: Environment variables are missing. Check that your main server file is loading them with dotenv before importing routes.");
  process.exit(1);
}

/**
 * @route GET /api/auth/zoom
 * @description Redirects the user to the Zoom authorization page to start the OAuth flow.
 */
router.get("/zoom", (req, res) => {
  const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
  console.log("Redirecting user to Zoom for authorization...");
  res.redirect(authUrl);
});

/**
 * @route GET /api/auth/zoom/callback
 * @description The callback URL that Zoom redirects to after user authorization.
 */
router.get("/zoom/callback", async (req, res) => {
  // --- NEW DIAGNOSTIC LOGGING ---
  console.log("\n✅✅✅ /api/auth/zoom/callback route handler ENTERED. ✅✅✅");
  console.log("Received query parameters from Zoom:", req.query);

  const { code } = req.query;

  // 1. Check for Authorization Code
  if (!code) {
    console.error("❌ Authorization code was not found in the callback query params.");
    return res.status(400).json({ message: "Authorization code is missing." });
  }

  console.log("Received authorization code. Preparing to enter the try...catch block.");

  try {
    // 2. Exchange Authorization Code for Access Token
    console.log("Exchanging code for token...");
    const tokenResponse = await axios.post("https://zoom.us/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI // The redirect_uri is required here for security
      },
      headers: {
        "Authorization": "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
    });

    const { access_token, refresh_token } = tokenResponse.data;
    console.log("Successfully received access token.");

    // 3. Fetch User Profile from Zoom API
    console.log("Fetching user profile from Zoom API...");
    const userProfileResponse = await axios.get("https://api.zoom.us/v2/users/me", {
      headers: { "Authorization": `Bearer ${access_token}` },
    });
    
    const { id: zoomId, email, first_name, last_name } = userProfileResponse.data;
    console.log(`Successfully fetched profile for user: ${email} (Zoom ID: ${zoomId})`);

    // 4. Upsert User in your Database
    console.log("Upserting user data into the database...");
    const user = await User.findOneAndUpdate(
      { zoomId: zoomId },
      {
        zoomId: zoomId,
        email: email,
        firstName: first_name,
        lastName: last_name,
        accessToken: access_token, // Consider encrypting tokens before storing
        refreshToken: refresh_token, // Consider encrypting tokens before storing
      },
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`User upserted successfully. DB User ID: ${user._id}`);

    // 5. Create Application-Specific JWT
    const appToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    console.log("Application JWT created. Sending success response.");

    res.status(200).json({
      message: "User authentication successful!",
      token: appToken,
      user: { id: user._id, email: user.email, firstName: user.firstName }
    });

  } catch (error) {
    console.error("\n--- ❌ ZOOM OAUTH ERROR ❌ ---");
    // Axios errors have a `isAxiosError` property and a `response` object
    if (error.isAxiosError && error.response) {
      console.error(`Error during API call to: ${error.config.url}`);
      console.error(`Status: ${error.response.status}`);
      console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
        console.error("A database error occurred.");
        console.error("Error Message:", error.message);
    } else {
      // For other types of errors (e.g., JWT signing, etc.)
      console.error("An unexpected error occurred.");
      console.error("Error Message:", error.message);
    }
    // --- NEW: Log the raw error object to ensure nothing is missed ---
    console.error("\nRaw error object:");
    console.error(error);
    res.status(500).send("User authentication failed due to an internal error.");
  }
});

export default router;
