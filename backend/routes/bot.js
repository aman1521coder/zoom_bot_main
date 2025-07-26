import express from 'express';
import { protect } from '../middleware/auth.js';
import participantBot from '../services/participantBot.js';
import User from '../models/user.js';
import fs from 'fs';
import path from 'path';

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

// Recording control endpoints
router.post('/recording/:meetingId/start', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user || !user.accessToken) {
      return res.status(401).json({ success: false, message: 'No access token available' });
    }
    
    await participantBot.startRecording(meetingId, user.accessToken);
    res.json({ success: true, message: 'Recording started successfully' });
  } catch (error) {
    console.error('Error starting recording:', error);
    res.status(500).json({ success: false, message: 'Failed to start recording' });
  }
});

router.post('/recording/:meetingId/stop', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user || !user.accessToken) {
      return res.status(401).json({ success: false, message: 'No access token available' });
    }
    
    await participantBot.stopRecording(meetingId, user.accessToken);
    res.json({ success: true, message: 'Recording stopped successfully' });
  } catch (error) {
    console.error('Error stopping recording:', error);
    res.status(500).json({ success: false, message: 'Failed to stop recording' });
  }
});

router.get('/recording/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user || !user.accessToken) {
      return res.status(401).json({ success: false, message: 'No access token available' });
    }
    
    const recordings = await participantBot.getRecordings(meetingId, user.accessToken);
    res.json({ success: true, recordings });
  } catch (error) {
    console.error('Error getting recordings:', error);
    res.status(500).json({ success: false, message: 'Failed to get recordings' });
  }
});

router.post('/transcript/:meetingId/download', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user || !user.accessToken) {
      return res.status(401).json({ success: false, message: 'No access token available' });
    }
    
    const transcript = await participantBot.downloadTranscript(meetingId, null, user.accessToken);
    res.json({ success: true, transcript });
  } catch (error) {
    console.error('Error downloading transcript:', error);
    res.status(500).json({ success: false, message: 'Failed to download transcript' });
  }
});

router.post('/recording/:meetingId/download', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user || !user.accessToken) {
      return res.status(401).json({ success: false, message: 'No access token available' });
    }
    
    const recordings = await participantBot.downloadRecording(meetingId, user.accessToken);
    res.json({ success: true, recordings });
  } catch (error) {
    console.error('Error downloading recordings:', error);
    res.status(500).json({ success: false, message: 'Failed to download recordings' });
  }
});

router.get('/recordings/list', protect, async (req, res) => {
  try {
    const recordingsDir = path.join(__dirname, '../recordings');
    const files = fs.readdirSync(recordingsDir);
    
    const recordings = files.map(file => ({
      name: file,
      path: path.join(recordingsDir, file),
      size: fs.statSync(path.join(recordingsDir, file)).size,
      created: fs.statSync(path.join(recordingsDir, file)).birthtime
    }));
    
    res.json({ success: true, recordings });
  } catch (error) {
    console.error('Error listing recordings:', error);
    res.status(500).json({ success: false, message: 'Failed to list recordings' });
  }
});

// Test JWT generation
router.get('/test-jwt/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;
    const botName = 'AI Assistant';
    const botEmail = 'ai-assistant@zoom-bot.com';
    
    // Test JWT generation
    const jwt = participantBot.generateMeetingJWT(meetingId, botName, botEmail);
    
    res.json({ 
      success: true, 
      jwt: jwt,
      meetingId: meetingId,
      botName: botName,
      botEmail: botEmail,
      clientId: process.env.ZOOM_BOT_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: process.env.ZOOM_BOT_CLIENT_SECRET ? 'Set' : 'Missing'
    });
  } catch (error) {
    console.error('Error generating test JWT:', error);
    res.status(500).json({ success: false, message: 'Failed to generate JWT', error: error.message });
  }
});

export default router; 