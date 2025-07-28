import express from 'express';
import { verifyZoomWebhook } from '../middleware/verifyzoom.js';
import User from '../models/user.js';
import Meeting from '../models/meeting.js';
import autoMeetingJoiner from '../services/autoMeetingJoiner.js';

const router = express.Router();
const meetingsJoined = new Set();

// Temporarily disable verification to debug
router.post('/', /* verifyZoomWebhook, */ async (req, res) => {
  console.log('🔔 [WEBHOOK] Received webhook request');
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  
  res.status(200).send();
  const { event: eventType, payload } = req.body;
  
  console.log(`[WEBHOOK] Received event: ${eventType}`);
  
  if (eventType === 'meeting.started') {
    const { id: meetingId, topic, host_id: hostId, password } = payload.object;
    
    if (meetingsJoined.has(meetingId)) {
      console.log(`[WEBHOOK] Already processing meeting ${meetingId}`);
      return;
    }
    
    meetingsJoined.add(meetingId);

    try {
      console.log(`[WEBHOOK] 🚀 Meeting started: ${topic} (${meetingId})`);
      
      // Automatically join meeting and start cloud recording
      const result = await autoMeetingJoiner.handleMeetingStarted(
        meetingId, 
        hostId, 
        topic, 
        password
      );

      if (result.success) {
        console.log(`[WEBHOOK] ✅ Auto-join and cloud recording started for meeting ${meetingId}`);
      } else {
        console.log(`[WEBHOOK] ⚠️ Auto-join failed for meeting ${meetingId}: ${result.error}`);
        meetingsJoined.delete(meetingId);
      }

    } catch (error) {
      console.error(`[WEBHOOK] Error handling meeting start ${meetingId}:`, error.message);
      
      if (error.message.includes('Access token expired')) {
        console.log(`[WEBHOOK] 🔑 User needs to re-authorize. Visit: https://blackkbingo.com/api/auth/zoom`);
      }
      
      meetingsJoined.delete(meetingId);
    }
  }
  
  if (eventType === 'meeting.ended') {
    const { id: meetingId, host_id: hostId } = payload.object;
    console.log(`[WEBHOOK] Meeting ended: ${meetingId}`);
    
    try {
      // Handle meeting end with auto joiner
      const result = await autoMeetingJoiner.handleMeetingEnded(meetingId, hostId);
      
      if (result.success) {
        console.log(`[WEBHOOK] ✅ Meeting end handled successfully for ${meetingId}`);
      } else {
        console.log(`[WEBHOOK] ⚠️ Meeting end handling failed for ${meetingId}: ${result.error}`);
      }
      
      meetingsJoined.delete(meetingId);
    } catch (error) {
      console.error(`[WEBHOOK] Error handling meeting end for ${meetingId}:`, error);
    }
  }
});

// Test endpoint for webhook debugging
router.post('/test', async (req, res) => {
  console.log('🧪 [WEBHOOK TEST] Received test webhook');
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  
  res.status(200).json({ 
    success: true, 
    message: 'Test webhook received',
    timestamp: new Date().toISOString()
  });
});

// Manual webhook trigger for testing (bypasses signature verification)
router.post('/manual', async (req, res) => {
  console.log('🔧 [MANUAL WEBHOOK] Received manual webhook trigger');
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  
  const { event: eventType, payload } = req.body;
  
  console.log(`[WEBHOOK] Received event: ${eventType}`);
  
  if (eventType === 'meeting.started') {
    const { id: meetingId, topic, host_id: hostId, password } = payload.object;
    
    try {
      const user = await User.findOne({ zoomId: hostId });
      if (user) {
        console.log(`[WEBHOOK] 🤖 Launching VPS bot for meeting: ${topic} (${meetingId})`);
        
        // Send to VPS worker for bot joining
        const result = await vpsWorkerService.launchBotForMeeting(meetingId, password, user._id);
        
        if (result.success) {
          console.log(`[WEBHOOK] ✅ Bot launch completed for meeting ${meetingId}`);
          console.log(`[WEBHOOK] 📝 Recording type: ${result.recordingType || 'vps_bot'}`);
        } else {
          console.log(`[WEBHOOK] ⚠️ Bot launch had issues for meeting ${meetingId}`);
        }
      } else {
        console.log(`[WEBHOOK] No user found for Zoom ID: ${hostId}`);
      }
    } catch (error) {
      console.error(`[WEBHOOK] Error launching bot for meeting ${meetingId}:`, error);
    }
  }
  
  res.status(200).json({ 
    success: true, 
    message: 'Manual webhook processed',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Webhook endpoint is running',
    timestamp: new Date().toISOString(),
    webhookUrl: 'https://blackkbingo.com/api/webhook/zoom'
  });
});

export default router;
