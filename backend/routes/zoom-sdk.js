import express from 'express';
import crypto from 'crypto';
import { protect } from '../middleware/auth.js';
import fetch from 'node-fetch';

const router = express.Router();

// Zoom Meeting SDK credentials - must be set in environment variables
const ZOOM_CLIENT_ID = process.env.ZOOM_SDK_CLIENT_ID || process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_SDK_CLIENT_SECRET || process.env.ZOOM_CLIENT_SECRET;

// Generate signature for Meeting SDK
function generateMeetingSignature(meetingNumber, role = 0) {
  const timestamp = new Date().getTime() - 30000;
  const msg = Buffer.from(`${ZOOM_CLIENT_ID}${meetingNumber}${timestamp}${role}`).toString('base64');
  const hash = crypto.createHmac('sha256', ZOOM_CLIENT_SECRET).update(msg).digest('base64');
  const signature = Buffer.from(`${ZOOM_CLIENT_ID}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');
  return signature;
}

// Get join signature for Meeting SDK
router.post('/get-signature', protect, async (req, res) => {
  try {
    const { meetingNumber, role = 0 } = req.body;

    if (!meetingNumber) {
      return res.status(400).json({
        success: false,
        error: 'Meeting number is required'
      });
    }

    console.log(`[ZOOM_SDK] Generating signature for meeting ${meetingNumber} with role ${role}`);

    // Generate signature
    const signature = generateMeetingSignature(meetingNumber, role);

    // Check if user can be host (if they created the meeting)
    const Meeting = await import('../models/meeting.js').then(m => m.default);
    const meeting = await Meeting.findOne({ 
      meetingId: meetingNumber,
      userId: req.user._id 
    });

    const isHost = !!meeting; // User is host if they created the meeting

    res.json({
      success: true,
      signature,
      isHost,
      clientId: ZOOM_CLIENT_ID,
      meetingNumber
    });

  } catch (error) {
    console.error('[ZOOM_SDK] Error generating signature:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start cloud recording
router.post('/start-recording', protect, async (req, res) => {
  try {
    const { meetingId } = req.body;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        error: 'Meeting ID is required'
      });
    }

    console.log(`[ZOOM_SDK] Starting recording for meeting ${meetingId}`);

    // Get user's Zoom access token
    const accessToken = req.user.zoomAccessToken;
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'No Zoom access token found. Please re-authorize.'
      });
    }

    // Start cloud recording via Zoom API
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'start'
      })
    });

    if (response.ok) {
      console.log(`[ZOOM_SDK] ✅ Recording started for meeting ${meetingId}`);
      
      // Update meeting record
      const Meeting = await import('../models/meeting.js').then(m => m.default);
      await Meeting.findOneAndUpdate(
        { meetingId, userId: req.user._id },
        { 
          status: 'recording',
          recordingStartTime: new Date()
        }
      );

      res.json({
        success: true,
        message: 'Recording started successfully'
      });
    } else {
      const error = await response.text();
      console.error(`[ZOOM_SDK] Failed to start recording:`, error);
      
      res.status(response.status).json({
        success: false,
        error: `Failed to start recording: ${error}`
      });
    }

  } catch (error) {
    console.error('[ZOOM_SDK] Error starting recording:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stop cloud recording
router.post('/stop-recording', protect, async (req, res) => {
  try {
    const { meetingId } = req.body;

    if (!meetingId) {
      return res.status(400).json({
        success: false,
        error: 'Meeting ID is required'
      });
    }

    console.log(`[ZOOM_SDK] Stopping recording for meeting ${meetingId}`);

    // Get user's Zoom access token
    const accessToken = req.user.zoomAccessToken;
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'No Zoom access token found. Please re-authorize.'
      });
    }

    // Stop cloud recording via Zoom API
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'stop'
      })
    });

    if (response.ok) {
      console.log(`[ZOOM_SDK] ✅ Recording stopped for meeting ${meetingId}`);
      
      // Update meeting record
      const Meeting = await import('../models/meeting.js').then(m => m.default);
      await Meeting.findOneAndUpdate(
        { meetingId, userId: req.user._id },
        { 
          status: 'completed',
          recordingEndTime: new Date()
        }
      );

      res.json({
        success: true,
        message: 'Recording stopped successfully'
      });
    } else {
      const error = await response.text();
      console.error(`[ZOOM_SDK] Failed to stop recording:`, error);
      
      res.status(response.status).json({
        success: false,
        error: `Failed to stop recording: ${error}`
      });
    }

  } catch (error) {
    console.error('[ZOOM_SDK] Error stopping recording:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get recording status
router.get('/recording-status/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;

    // Get meeting from database
    const Meeting = await import('../models/meeting.js').then(m => m.default);
    const meeting = await Meeting.findOne({ 
      meetingId, 
      userId: req.user._id 
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    // Check if auto-joiner is active for this meeting
    const autoMeetingJoiner = await import('../services/autoMeetingJoiner.js').then(m => m.default);
    const isBotActive = autoMeetingJoiner.isBotActive(meetingId);

    res.json({
      success: true,
      status: meeting.status,
      recordingStartTime: meeting.recordingStartTime,
      recordingEndTime: meeting.recordingEndTime,
      recordingUrl: meeting.recordingUrl,
      botActive: isBotActive
    });

  } catch (error) {
    console.error('[ZOOM_SDK] Error getting recording status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get active bots status
router.get('/active-bots', protect, async (req, res) => {
  try {
    const autoMeetingJoiner = await import('../services/autoMeetingJoiner.js').then(m => m.default);
    const activeBots = autoMeetingJoiner.getActiveBots();

    res.json({
      success: true,
      activeBots,
      count: activeBots.length
    });

  } catch (error) {
    console.error('[ZOOM_SDK] Error getting active bots:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 