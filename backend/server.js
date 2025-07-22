// server.js
import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';

// Import Routes
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhook.js';
import meetingRoutes from './routes/meetings.js';

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Custom JSON parser to also capture the raw body for webhook verification
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/webhook')) {
      req.rawBody = buf;
    }
  }
}));

// Define API Routes
app.use('/api/auth', authRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/meetings', meetingRoutes);

app.get('/', (req, res) => {
  res.send('AI Zoom Assistant is running. Go to /api/auth/zoom to authenticate.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
