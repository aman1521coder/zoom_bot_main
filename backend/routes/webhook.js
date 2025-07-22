// routes/webhook.js
import express from 'express';
import crypto from 'crypto';
import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import { verifyZoomWebhook } from '../middleware/verifyZoom.js';
import { processMeeting } from '../services/meetingProcessor.js';

const router = express.Router();

router.post('/', verifyZoomWebhook, async (req, res) => {
  // Immediately acknowledge receipt to Zoom
  res.status(200).send();

  const { event, payload } = req.body;

  if (event === 'endpoint.url_validation') {
    console.log("Successfully validated webhook URL with Zoom.");
    return;
  }
  
  if (event === 'recording.completed') {
    const { id: meeting_id, topic, host_id } = payload.object;
    const { recording_files } = payload.object;

    const user = await User.findOne({ zoomId: host_id });
    if (!user) {
      console.warn(`Webhook received for unknown user (Zoom ID: ${host_id})`);
      return;
    }

    const audio = recording_files.find(f => f.file_type === 'M4A');
    if (audio) {
      try {
        const newMeeting = await Meeting.create({
          userId: user._id,
          meetingId: meeting_id,
          topic: topic,
          downloadUrl: `${audio.download_url}?access_token=${user.accessToken}`,
          status: 'recording_available',
        });

        console.log(`Meeting ${newMeeting._id} for user ${user.email} saved. Triggering processing.`);
        
        // Call the processor to run in the background
        processMeeting(newMeeting._id);

      } catch (dbError) {
        console.error("Error creating meeting record:", dbError);
      }
    }
  }
});

export default router;
