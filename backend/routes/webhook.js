import express from 'express';
import axios from 'axios';
import { verifyZoomWebhook } from '../middleware/verifyzoom.js';
import User from '../models/user.js';

const router = express.Router();
const meetingsJoined = new Set();
const WORKER_URL = process.env.PUPPETEER_WORKER_URL;
const WORKER_SECRET = process.env.WORKER_API_SECRET ||  "1234";

router.post('/', verifyZoomWebhook, async (req, res) => {
  res.status(200).send();
  const { event: eventType, payload } = req.body;
  
  if (eventType === 'meeting.started') {
    const { id: meetingId, topic, host_id: hostId, password } = payload.object;
    if (meetingsJoined.has(meetingId)) return;
    meetingsJoined.add(meetingId);

    try {
      const user = await User.findOne({ zoomId: hostId });
      if (user) {
        console.log(`[WEBHOOK] Signaling Worker on VPS for meeting: ${topic}`);
        // Make the API call to the Puppeteer worker on the VPS
        await axios.post(`${WORKER_URL}/launch-bot`, 
          { meetingId, password: password || '', userId: user._id },
          { headers: { 'x-api-secret': WORKER_SECRET } }
        );
        console.log(`[WEBHOOK] Signal sent to VPS successfully.`);
      }
    } catch (error) {
      console.error(`[WEBHOOK] Error signaling worker:`, error.response?.data || error.message);
      meetingsJoined.delete(meetingId);
    }
  }
});

export default router;
