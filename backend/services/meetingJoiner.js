// services/meetingJoiner.js
import axios from 'axios';
import { callToMeetingMap } from '../routes/twilio.js';
import { getUserAccessToken } from './tokenMnager.js'; // Import the token manager
import 'dotenv/config';

const BOT_SIP_ADDRESS = process.env.BOT_SIP_ADDRESS;
const BOT_NAME = "AI Assistant";

/**
 * Joins a meeting using a SPECIFIC USER's access token.
 * @param {object} user - The user object from our database who is hosting the meeting.
 * @param {string} meetingId - The ID of the meeting to join.
 * @param {string} topic - The topic of the meeting.
 */
export async function joinMeetingAsUser(user, meetingId, topic) {
  if (!user) {
    console.error('[JOINER] Error: A user object is required to join the meeting.');
    return;
  }

  console.log(`[JOINER] Attempting to join meeting "${topic}" on behalf of user ${user.email}`);

  // Get a fresh, valid access token for this specific user
  const accessToken = await getUserAccessToken(user._id);
  if (!accessToken) {
    console.error(`[JOINER] Could not get a valid access token for user ${user.email}. Aborting join.`);
    return;
  }
  
  try {
    // This API call is now authenticated with the user's personal token
    const response = await axios.post(`https://api.zoom.us/v2/meetings/${meetingId}/invitees`, {
      attendees: [{
        name: BOT_NAME,
        protocol: 'sip',
        address: BOT_SIP_ADDRESS,
      }]
    }, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    const callId = response.data?.attendees[0]?.call_id;
    if (callId) {
      callToMeetingMap[callId] = meetingId;
      console.log(`[JOINER] Stored mapping: Twilio CallSid (${callId}) -> Zoom Meeting ID (${meetingId})`);
    }

    console.log(`[JOINER] Dial-out request sent successfully.`);
  } catch (error) {
    console.error(`[JOINER] Failed to send SIP invite for meeting ${meetingId}:`, error.response?.data);
  }
}
