// routes/meeting.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Import Node's built-in file system module
import Meeting from '../models/meeting.js';
import { protect } from '../middleware/auth.js';
import { processRecordingFile } from '../services/meetingProcessor.js';

const router = express.Router();

// --- MODIFIED: Configure multer to save to a public directory ---
const recordingsDir = 'public/recordings';

// Ensure the directory exists
fs.mkdirSync(recordingsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, recordingsDir); // Save files in 'public/recordings/'
  },
  filename: (req, file, cb) => {
    // Create a unique filename to avoid conflicts
    cb(null, `${Date.now()}-${req.params.meetingId}.webm`);
  }
});

const upload = multer({ storage: storage });

// GET all meetings for the currently authenticated user
router.get('/', protect, async (req, res) => {
  try {
    const meetings = await Meeting.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching meetings' });
  }
});

// This route remains the same, but the 'upload' middleware now has the new config
router.post(
  '/upload-recording/:meetingId', 
  upload.single('recording'),
  async (req, res) => {
    const { meetingId } = req.params;
    const { userId } = req.body;
    const file = req.file;

    if (!file || !userId) {
      return res.status(400).json({ error: 'Missing recording file or userId.' });
    }

    console.log(`[UPLOAD] Saved recording for meeting ${meetingId} to ${file.path}.`);
    
    // The file object now contains the final public path
    processRecordingFile(file, meetingId, userId);

    res.status(202).json({ message: 'Upload received and saved. Processing has started.' });
  }
);

export default router;
