// server.js
import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// --- Import All Our Route Files ---
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhook.js';
import twilioRoutes from './routes/twilio.js';
import meetingRoutes from './routes/meeting.js';

// Helper for getting __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the Express app
const app = express();

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- Middleware Setup ---

// 1. JSON body parser with a special 'verify' function for Zoom webhooks.
// This captures the raw body so we can verify the signature BEFORE parsing.
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/webhook')) {
      req.rawBody = buf;
    }
  }
}));

// 2. URL-encoded body parser.
// This is REQUIRED for Twilio webhooks, as they send data in
// 'application/x-www-form-urlencoded' format, not JSON.
app.use(express.urlencoded({ extended: true }));

// 3. Serve static files (like index.html for a potential future SDK client).
app.use(express.static(path.join(__dirname, 'public')));


// --- Define API Routes ---
// Each route file handles a specific part of our application.
app.use('/api/auth', authRoutes);         // Handles user login with Zoom OAuth
app.use('/api/webhook', webhookRoutes);   // Handles incoming webhooks FROM ZOOM
app.use('/api/twilio', twilioRoutes);     // Handles incoming webhooks FROM TWILIO
app.use('/api/meetings', meetingRoutes);  // Handles fetching meeting data for a frontend


// --- Root Route for Basic Status Check ---
app.get('/', (req, res) => {
  res.send('AI Zoom Assistant Server is running!');
});


// --- Start the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  // We no longer start any monitors here. The server is purely event-driven.
});

