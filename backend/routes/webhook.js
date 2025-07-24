// routes/webhook.js
import express from 'express';
import { verifyZoomWebhook } from '../middleware/verifyzoom.js';
// --- MODIFICATION: We only need launchBot now ---
import { launchBot } from '../services/sdkBotManager.js';
import User from '../models/user.js';

const router = express.Router();
const meetingsJoined = new Set();

router.post('/', verifyZoomWebhook, async (req, res) => {
  res.status(200).send(); // Acknowledge receipt immediately

  const { event: eventType, payload } = req.body;
  console.log(`[WEBHOOK] Received Zoom event: ${eventType}`);

  if (eventType === 'meeting.started') {
    const { id: meetingId, topic, host_id: hostId, password } = payload.object;

    if (meetingsJoined.has(meetingId)) {
      console.log(`[WEBHOOK] Bot join already initiated for meeting ${meetingId}. Ignoring.`);
      return;
    }
    meetingsJoined.add(meetingId);
    setTimeout(() => meetingsJoined.delete(meetingId), 1000 * 60 * 5);

    try {
      const meetingHost = await User.findOne({ zoomId: hostId });
      if (!meetingHost) {
        console.error(`[WEBHOOK] User not found for Zoom Host ID: ${hostId}. Cannot start bot.`);
        return;
      }

      console.log(`[WEBHOOK] Starting bot for meeting "${topic}" (${meetingId}).`);
      await launchBot(meetingId, password || '', meetingHost._id);

    } catch (error) {
      console.error(`[WEBHOOK] Error in 'meeting.started' handler:`, error);
      meetingsJoined.delete(meetingId);
    }
  }

  // --- REMOVED THIS ENTIRE BLOCK ---
  /*
  else if (eventType === 'meeting.ended') {
    const { id: meetingId } = payload.object;
    console.log(`[WEBHOOK] Meeting ${meetingId} has ended. Triggering bot shutdown.`);
    // This was causing the race condition by killing the browser prematurely.
    await stopBot(meetingId); 
  }
  */
  
  else {
    console.log(`[WEBHOOK] Ignoring unhandled event type: '${eventType}'.`);
  }
});

export default router;
