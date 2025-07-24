import axios from 'axios';
import { getUserAccessToken } from './tokenMnager.js'; // Corrected import path assuming it's in the same directory
import 'dotenv/config';

const BOT_SIP_ADDRESS = process.env.BOT_SIP_ADDRESS;
const BOT_NAME = "AI Assistant";

/**
 * Calls the Zoom API to have a SIP bot dial into a live meeting.
 * @param {object} user - The user object from the database, must contain _id.
 * @param {string} meetingId - The ID of the Zoom meeting to join.
 * @param {string} topic - The topic of the meeting (for logging purposes).
 */
export async function joinMeetingAsUser(user, meetingId, topic) {
  if (!user) {
    console.error('[JOINER] Error: A valid user object is required.');
    // Throw an error to be caught by the webhook handler
    throw new Error('User object was not provided to joinMeetingAsUser.');
  }
  
  if (!BOT_SIP_ADDRESS) {
      console.error('[JOINER] Error: BOT_SIP_ADDRESS environment variable is not set.');
      throw new Error('Bot SIP address is not configured.');
  }

  console.log(`[JOINER] Attempting to join meeting "${topic}" (${meetingId}) on behalf of ${user.email}`);

  // First, get a fresh, valid access token for the user making the request.
  const accessToken = await getUserAccessToken(user._id);
  if (!accessToken) {
    console.error(`[JOINER] Could not get a valid access token for ${user.email}. Aborting.`);
    throw new Error(`Failed to get access token for user ${user._id}`);
  }
  
  console.log('[JOINER] Successfully obtained access token. Sending SIP dial-out request to Zoom.');

  try {
    // CORRECTED: Use POST on the dedicated 'sip_dial_out' endpoint.
    const response = await axios.post(
      `https://api.zoom.us/v2/meetings/${meetingId}/sip_dial_out`, 
      {
        // CORRECTED: The request body only needs the 'params' object.
        params: {
          sip_address: BOT_SIP_ADDRESS,
          display_name: BOT_NAME
        }
      }, 
      {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // On success, Zoom returns a 201 Created status. The 'call_id' which links this
    // call to the Twilio CallSid will be sent in a separate 'meeting.sip_dialout_status' webhook.
    console.log(`[JOINER] SIP dial-out request sent successfully for meeting ${meetingId}. Status: ${response.status}`);

  } catch (error) {
    const errorStatus = error.response?.status;
    const errorData = error.response?.data;
    console.error(`[JOINER] FATAL: Failed to send SIP invite for meeting ${meetingId}. Status: ${errorStatus}`, errorData || error.message);
    
    // Re-throw the error so the calling function (the webhook handler) knows something went wrong
    // and can perform cleanup, like removing the meeting from the cache.
    throw error;
  }
}