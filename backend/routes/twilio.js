// routes/twilio.js
import express from 'express';
import { processTwilioRecording } from '../services/meetingProcessor.js';

// *** FIX #1: Create the router object before using it. ***
const router = express.Router();

// *** FIX #2: Define and EXPORT the map so other files can import it. ***
// In a real production app, you would use Redis or a database for this.
// For development, an in-memory object exported from here is fine.
export const callToMeetingMap = {};

/**
 * This webhook receives the final recording status from Twilio.
 */
router.post('/recording-complete', (req, res) => {
  const { CallSid, RecordingUrl } = req.body;

  if (RecordingUrl) {
    console.log(`[TWILIO WEBHOOK] Recording complete for call ${CallSid}.`);
    
    // Look up the Zoom Meeting ID associated with this Twilio Call ID.
    const zoomMeetingId = callToMeetingMap[CallSid];
    
    if (zoomMeetingId) {
      console.log(`[TWILIO WEBHOOK] Found matching Zoom Meeting ID: ${zoomMeetingId}`);
      // Pass both the recording URL and the Zoom Meeting ID to the processor.
      processTwilioRecording(`${RecordingUrl}.mp3`, zoomMeetingId);
      
      // Clean up the map to prevent memory leaks.
      delete callToMeetingMap[CallSid];
    } else {
      console.warn(`[TWILIO WEBHOOK] Could not find a matching Zoom Meeting ID for CallSid: ${CallSid}.`);
    }
  }
  
  // Twilio expects an XML response, even if it's empty.
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send('<Response/>');
});

// Don't forget to export the router so server.js can use it.
export default router;
