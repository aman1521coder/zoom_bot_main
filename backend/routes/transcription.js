import express from 'express';
import multer from 'multer';
import path from 'path';
import transcriptionService from '../services/transcriptionService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = 'public/recordings/';
    // Create directory if it doesn't exist
    try {
      const fs = await import('fs');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (error) {
      console.error('[UPLOAD] Error creating directory:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `recording-${uniqueSuffix}.webm`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Upload and transcribe audio
router.post('/upload', protect, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { meetingId } = req.body;
    const audioPath = req.file.path;

    console.log(`[TRANSCRIPTION API] Received audio for meeting ${meetingId}`);
    console.log(`[TRANSCRIPTION API] File saved: ${audioPath}`);

    // Ensure meeting record exists before processing
    const Meeting = await import('../models/meeting.js').then(m => m.default);
    await Meeting.findOneAndUpdate(
      { meetingId },
      { 
        $setOnInsert: {
          meetingId,
          userId: req.user._id,
          status: 'processing',
          createdAt: new Date()
        },
        recordingUrl: audioPath,
        recordingEndTime: new Date()
      },
      { upsert: true }
    );

    // Process the recording
    const result = await transcriptionService.processRecording(meetingId, audioPath);

    if (!result) {
      return res.status(500).json({ error: 'Transcription failed' });
    }

    res.json({
      success: true,
      meetingId,
      audioPath,
      transcription: result.transcription,
      wordCount: result.wordCount,
      duration: result.duration
    });

  } catch (error) {
    console.error('[TRANSCRIPTION API] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate summary from transcription
router.post('/summarize', protect, async (req, res) => {
  try {
    const { transcription } = req.body;

    if (!transcription) {
      return res.status(400).json({ error: 'No transcription provided' });
    }

    const result = await transcriptionService.generateSummary(transcription);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      summary: result.summary,
      tokens: result.tokens
    });

  } catch (error) {
    console.error('[TRANSCRIPTION API] Summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test API key configuration
router.get('/test-api-key', protect, async (req, res) => {
  try {
    // Use hardcoded key directly
    const apiKey = 'process.env.OPENAI_API_KEY';

    // Test the API key with a simple request
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`
      }
    });

    if (response.ok) {
      res.json({
        success: true,
        message: 'API key is valid',
        keyPrefix: apiKey.substring(0, 10),
        keyLength: apiKey.length
      });
    } else {
      res.json({
        success: false,
        error: `API returned ${response.status}: ${response.statusText}`,
        keyPrefix: apiKey.substring(0, 10),
        keyLength: apiKey.length,
        hint: response.status === 401 ? 'Invalid API key - check for typos or generate a new one' : 'Unknown error'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    status: 'Transcription service ready',
    hasApiKey: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

export default router; 