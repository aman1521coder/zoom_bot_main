import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Meeting from '../models/meeting.js';
import { protect } from '../middleware/auth.js';
import { processRecordingFile } from '../services/meetingProcessor.js';

const router = express.Router();
const recordingsDir = 'public/recordings';
fs.mkdirSync(recordingsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, recordingsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${req.params.meetingId}.webm`)
});
const upload = multer({ storage });

router.get('/', protect, async (req, res) => {
  try {
    const meetings = await Meeting.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching meetings' });
  }
});

router.post('/upload-recording/:meetingId', upload.single('recording'), async (req, res) => {
  const { meetingId } = req.params;
  const { userId } = req.body;
  const file = req.file;
  if (!file || !userId) {
    return res.status(400).json({ error: 'Missing recording file or userId.' });
  }
  processRecordingFile(file, meetingId, userId);
  res.status(202).json({ message: 'Upload received and saved. Processing has started.' });
});

export default router;
