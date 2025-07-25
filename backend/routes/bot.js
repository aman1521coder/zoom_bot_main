import express from 'express';
import { protect } from '../middleware/auth.js';
import participantBot from '../services/participantBot.js';

const router = express.Router();

// Get bot status
router.get('/status', protect, async (req, res) => {
  try {
    const status = participantBot.getStatus();
    res.json({
      success: true,
      status,
      message: 'Bot status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting bot status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting bot status'
    });
  }
});

// Start bot (for manual control)
router.post('/start', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Bot is now active and will automatically join meetings when they start'
    });
  } catch (error) {
    console.error('Error starting bot:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting bot'
    });
  }
});

// Stop bot (for manual control)
router.post('/stop', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Bot is now inactive and will not join new meetings'
    });
  } catch (error) {
    console.error('Error stopping bot:', error);
    res.status(500).json({
      success: false,
      message: 'Error stopping bot'
    });
  }
});

// Send chat message
router.post('/chat/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    await participantBot.sendChatMessage(meetingId, message);
    
    res.json({
      success: true,
      message: 'Chat message sent successfully'
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending chat message'
    });
  }
});

// Toggle audio
router.post('/audio/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { muted } = req.body;
    
    await participantBot.toggleAudio(meetingId, muted);
    
    res.json({
      success: true,
      message: `Audio ${muted ? 'muted' : 'unmuted'} successfully`
    });
  } catch (error) {
    console.error('Error toggling audio:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling audio'
    });
  }
});

// Toggle video
router.post('/video/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { videoOn } = req.body;
    
    await participantBot.toggleVideo(meetingId, videoOn);
    
    res.json({
      success: true,
      message: `Video ${videoOn ? 'turned on' : 'turned off'} successfully`
    });
  } catch (error) {
    console.error('Error toggling video:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling video'
    });
  }
});

// Get meeting info
router.get('/meeting/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meetingInfo = participantBot.getMeetingInfo(meetingId);
    
    if (!meetingInfo) {
      return res.status(404).json({
        success: false,
        message: 'Bot not in this meeting'
      });
    }
    
    res.json({
      success: true,
      meetingInfo
    });
  } catch (error) {
    console.error('Error getting meeting info:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting meeting info'
    });
  }
});

export default router; 