// routes/meetings.js
import express from 'express';
import Meeting from '../models/Meeting.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET all meetings for the currently authenticated user
router.get('/', protect, async (req, res) => {
  try {
    const meetings = await Meeting.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching meetings' });
  }
});

export default router;
