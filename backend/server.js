// --- Logging Setup: Redirect console.log and console.error ---
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create or append to output.log in the same directory
const logStream = fs.createWriteStream(path.join(__dirname, 'output.log'), { flags: 'a' });

// Override console.log and console.error to log to both file and terminal
console.log = (...args) => {
  const log = `[LOG ${new Date().toISOString()}] ${args.join(' ')}\n`;
  logStream.write(log);
  process.stdout.write(log);
};

console.error = (...args) => {
  const error = `[ERROR ${new Date().toISOString()}] ${args.join(' ')}\n`;
  logStream.write(error);
  process.stderr.write(error);
};

// --- Main Server Code ---
import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';

// --- Import Route Files ---
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhook.js';
// import twilioRoutes from './routes/twilio.js'; // REMOVED - No longer using Twilio/SIP
import meetingRoutes from './routes/meeting.js';

// Initialize Express
const app = express();
app.set('trust proxy', 1);

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- Middleware Setup ---

// JSON body parser with Zoom webhook raw body capture
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/webhook/zoom')) {
      req.rawBody = buf;
    }
  }
}));

// REMOVED - This was for processing form data from Twilio's webhooks.
// app.use(express.urlencoded({ extended: true }));

// CRITICAL: Static file serving for the SDK bot page
// This allows our server to provide the 'bot.html' file to Puppeteer.
app.use(express.static(path.join(__dirname, 'public')));

// --- Define Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/webhook/zoom', webhookRoutes);
// app.use('/api/twilio', twilioRoutes); // REMOVED - No longer using Twilio/SIP
app.use('/api/meetings', meetingRoutes);

// --- Root Route ---
app.get('/', (req, res) => {
  res.send('AI Zoom Assistant Server is running!');
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
