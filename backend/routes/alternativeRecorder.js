import express from 'express';
import { protect } from '../middleware/auth.js';
import alternativeRecorder from '../services/alternativeRecorder.js';

const router = express.Router();

// Start recording a meeting (with fallback options)
router.post('/start/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const result = await alternativeRecorder.startRecording(meetingId, req.user.id);
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
    const result = await alternativeRecorder.stopRecording(meetingId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error stopping recording:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get meeting information and recording status
router.get('/meeting/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const result = await alternativeRecorder.getMeetingInfo(meetingId, req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error getting meeting info:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// List all recordings with recording types
router.get('/list', protect, async (req, res) => {
  try {
    const recordings = await alternativeRecorder.listRecordings();
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
    const active = alternativeRecorder.getActiveRecordings();
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

// Check account recording capabilities
router.get('/capabilities', protect, async (req, res) => {
  try {
    const capabilities = await alternativeRecorder.checkRecordingCapabilities(req.user.id);
    res.json(capabilities);
  } catch (error) {
    console.error('Error checking capabilities:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router; 