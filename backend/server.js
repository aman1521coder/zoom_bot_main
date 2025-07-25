import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhook.js';
import meetingRoutes from './routes/meeting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/webhook/zoom')) {
      req.rawBody = buf;
    }
  }
}));

// This makes the saved recordings in 'public/recordings' accessible via a URL
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/webhook/zoom', webhookRoutes);
app.use('/api/meetings', meetingRoutes);

// cPanel's Node.js selector uses its own port management,
// so we don't need to define a PORT here.
// The startup script will handle it.
// app.listen(PORT, ...);
app.listen(5000, () => {
  console.log(`Server is running on port 5000`);
});

export default app; // Export the app for cPanel's passenger loader
