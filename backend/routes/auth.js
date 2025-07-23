// routes/auth.js
import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const router = express.Router();

const CLIENT_ID = process.env.ZOOM_BOT_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOOM_BOT_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${process.env.PORT || 5000}/api/auth/zoom/callback`;

router.get("/zoom", (req, res) => {
  // Builds the URL string
  const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
  res.redirect(authUrl);
});

router.get("/zoom/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Error: Authorization code not found.");

  try {
    const tokenResponse = await axios.post("https://zoom.us/oauth/token", null, {
      params: { grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI },
      headers: { "Authorization": "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64") },
    });
    const { access_token, refresh_token } = tokenResponse.data;

    const userProfileResponse = await axios.get("https://api.zoom.us/v2/users/me", {
      headers: { "Authorization": `Bearer ${access_token}` },
    });
    const { id, email, first_name, last_name } = userProfileResponse.data;

    const user = await User.findOneAndUpdate(
      { zoomId: id },
      { zoomId: id, email, firstName: first_name, lastName: last_name, accessToken: access_token, refreshToken: refresh_token },
      { upsert: true, new: true }
    );

    const appToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ message: "User authentication successful!", token: appToken });
  } catch (error) {
    console.error("User OAuth Error:", error.response ? error.response.data : error.message);
    res.status(500).send("User authentication failed.");
  }
});

export default router;
