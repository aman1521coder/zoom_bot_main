import express from 'express';
import multer from 'multer';
import path from 'path';
import transcriptionService from '../services/transcriptionService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/recordings/');
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
router.post('/upload', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { meetingId } = req.body;
    const audioPath = req.file.path;

    console.log(`[TRANSCRIPTION API] Received audio for meeting ${meetingId}`);
    console.log(`[TRANSCRIPTION API] File saved: ${audioPath}`);

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
router.post('/summarize', authenticateToken, async (req, res) => {
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

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    status: 'Transcription service ready',
    hasApiKey: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

export default router; 