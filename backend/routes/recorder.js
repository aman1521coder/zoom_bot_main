import express from 'express';
import { protect } from '../middleware/auth.js';
import simpleRecorder from '../services/simpleRecorder.js';

const router = express.Router();

// Start recording a meeting
router.post('/start/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const result = await simpleRecorder.startRecording(meetingId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error starting recording:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Stop recording a meeting
router.post('/stop/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const result = await simpleRecorder.stopRecording(meetingId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error stopping recording:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get recording status and instructions
router.get('/status/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const status = await simpleRecorder.getRecordingStatus(meetingId, req.user.id);
    res.json(status);
  } catch (error) {
    console.error('Error getting recording status:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// List all recordings
router.get('/list', protect, async (req, res) => {
  try {
    const recordings = await simpleRecorder.listRecordings();
    res.json({ 
      success: true, 
      recordings: recordings 
    });
  } catch (error) {
    console.error('Error listing recordings:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get active recordings
router.get('/active', protect, async (req, res) => {
  try {
    const active = simpleRecorder.getActiveRecordings();
    res.json({ 
      success: true, 
      activeRecordings: active 
    });
  } catch (error) {
    console.error('Error getting active recordings:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router; 