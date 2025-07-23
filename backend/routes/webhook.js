// routes/webhook.js (Debug Version)
import express from 'express';
import { verifyZoomWebhook } from '../middleware/verifyzoom.js';
import { joinMeetingAsUser } from '../services/meetingJoiner.js';
import User from '../models/user.js';

const router = express.Router();

router.post('/', verifyZoomWebhook, async (req, res) => {
  res.status(200).send();

  const { event: eventType, payload } = req.body;
  
  if (eventType === 'meeting.started') {
    console.log(`[DEBUG] 'meeting.started' event received. Payload is valid.`);
    const { id: meetingId, topic, host_id: hostId } = payload.object;

    console.log(`[DEBUG] Meeting Host ID is: ${hostId}. About to search for this user in the database.`);
    
    try {
      const user = await User.findOne({ zoomId: hostId });
      
      if (!user) {
        console.error(`[DEBUG] FATAL: User search returned null. The host of this meeting has not authenticated with our app. Host Zoom ID: ${hostId}`);
        return;
      }
      
      console.log(`[DEBUG] SUCCESS: Found user record for ${user.email}.`);
      console.log(`[DEBUG] About to call joinMeetingAsUser function...`);
      
      await joinMeetingAsUser(user, meetingId, topic);
      
      console.log(`[DEBUG] FINISHED: The joinMeetingAsUser function has completed.`);

    } catch (dbError) {
      console.error("[DEBUG] A database error occurred during the User.findOne search:", dbError);
    }
  }
});

export default router;
