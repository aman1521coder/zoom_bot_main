import express from 'express';
import { verifyZoomWebhook } from '../middleware/verifyzoom.js';
import User from '../models/user.js';
import participantBot from '../services/participantBot.js';

const router = express.Router();
const meetingsJoined = new Set();

router.post('/', verifyZoomWebhook, async (req, res) => {
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
        console.log(`[WEBHOOK] Joining meeting: ${topic} (${meetingId})`);
        await participantBot.joinMeeting(meetingId, user._id, password);
        console.log(`[WEBHOOK] Successfully joined meeting ${meetingId}`);
      } else {
        console.log(`[WEBHOOK] No user found for Zoom ID: ${hostId}`);
        meetingsJoined.delete(meetingId);
      }
    } catch (error) {
      console.error(`[WEBHOOK] Error joining meeting ${meetingId}:`, error);
      meetingsJoined.delete(meetingId);
    }
  }
  
  if (eventType === 'meeting.ended') {
    const { id: meetingId } = payload.object;
    console.log(`[WEBHOOK] Meeting ended: ${meetingId}`);
    
    try {
      await participantBot.handleMeetingEnded(meetingId);
      meetingsJoined.delete(meetingId);
    } catch (error) {
      console.error(`[WEBHOOK] Error handling meeting end for ${meetingId}:`, error);
    }
  }
});

export default router;
