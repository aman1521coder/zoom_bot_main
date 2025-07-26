import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhook.js';
import meetingRoutes from './routes/meeting.js';
// import botRoutes from './routes/bot.js'; // Deprecated - using recording routes instead
import recorderRoutes from './routes/recorder.js';
import alternativeRecorderRoutes from './routes/alternativeRecorder.js';
import transcriptionRoutes from './routes/transcription.js';
import recordingRoutes from './routes/recording.js';
import userRoutes from './routes/user.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Middleware
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/webhook/zoom')) {
      req.rawBody = buf;
    }
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/webhook/zoom', webhookRoutes);
app.use('/api/meetings', meetingRoutes);
// app.use('/api/bot', botRoutes); // Deprecated - using recording routes instead
app.use('/api/recorder', recorderRoutes);
app.use('/api/alternative-recorder', alternativeRecorderRoutes);
app.use('/api/transcription', transcriptionRoutes);
app.use('/api/recording', recordingRoutes);
app.use('/api/user', userRoutes);


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Zoom AI Bot Backend'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Allow external connections

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server is running on ${HOST}:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 OAuth endpoint: http://localhost:${PORT}/api/auth/zoom`);
  console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
