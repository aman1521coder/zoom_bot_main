import express from 'express';
import { verifyZoomWebhook } from '../middleware/verifyzoom.js';
import User from '../models/user.js';
import Meeting from '../models/meeting.js';
import vpsWorkerService from '../services/vpsWorkerService.js';

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
      console.log(`[WEBHOOK] Already joined meeting ${meetingId}`);
      return;
    }
    
    meetingsJoined.add(meetingId);

    try {
      const user = await User.findOne({ zoomId: hostId });
      if (user) {
        // Get user's recording settings
        const userSettings = user.recordingSettings || {
          behavior: 'recording-only',
          recordingMethod: 'auto_browser',
          autoRecord: true
        };
        
        console.log(`[WEBHOOK] 📋 User settings: ${userSettings.behavior}, autoRecord: ${userSettings.autoRecord}`);
        
                  // For automatic recording, we need to prepare the recording
          if (userSettings.autoRecord) {
            console.log(`[WEBHOOK] 🎤 Auto-recording enabled for meeting: ${topic} (${meetingId})`);
            
            try {
              // Create meeting record first
              await Meeting.findOneAndUpdate(
                { meetingId },
                { 
                  $setOnInsert: {
                    userId: user._id,
                    meetingId,
                    topic: topic || 'Untitled Meeting',
                    hostId,
                    startTime: new Date(),
                    status: 'active'
                  }
                },
                { upsert: true }
              );
              
              // Start recording (browser-based auto recording)
              const recordingService = await import('../services/recordingService.js');
              await recordingService.default.startRecording(
                meetingId,
                user._id,
                'auto_browser'
              );
              
              console.log(`[WEBHOOK] ✅ Auto-recording prepared for meeting ${meetingId}`);
            } catch (error) {
              console.error(`[WEBHOOK] ❌ Failed to setup auto-recording:`, error);
            }
        } else if (userSettings.behavior === 'recording-only' || userSettings.behavior === 'both') {
          // Manual recording - just prepare but don't launch bot
          console.log(`[WEBHOOK] 📱 Manual recording - user must use frontend`);
          
          const recordingService = await import('../services/recordingService.js');
          const result = await recordingService.default.startRecording(
            meetingId,
            user._id,
            userSettings.recordingMethod || 'browser'
          );
          
          if (result.success) {
            console.log(`[WEBHOOK] ✅ Recording prepared using ${result.method}`);
          } else {
            console.log(`[WEBHOOK] ⚠️ Recording failed: ${result.error}`);
          }
        }
      } else {
        console.log(`[WEBHOOK] No user found for Zoom ID: ${hostId}`);
        meetingsJoined.delete(meetingId);
      }
    } catch (error) {
      console.error(`[WEBHOOK] Error launching bot for meeting ${meetingId}:`, error.message);
      
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
      const user = await User.findOne({ zoomId: hostId });
      if (user) {
        console.log(`[WEBHOOK] 📥 Handling meeting end for ${meetingId}`);
        
        // Stop recording
        const recordingService = await import('../services/recordingService.js');
        await recordingService.default.stopRecording(meetingId);
        console.log(`[WEBHOOK] ✅ Recording stopped for ${meetingId}`);
        
        // Also handle VPS bot cleanup if it was running
        if (process.env.ENABLE_VPS_BOT === 'true') {
          await vpsWorkerService.handleMeetingEnd(meetingId, user._id);
          console.log(`[WEBHOOK] ✅ VPS bot cleanup completed for ${meetingId}`);
        }
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
