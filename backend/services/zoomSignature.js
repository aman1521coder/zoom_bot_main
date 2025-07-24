// services/zoomSignature.js
import crypto from 'crypto';
import 'dotenv/config';

// We will use the credentials from our dedicated Meeting SDK App
const SDK_KEY = process.env.ZOOM_MEETING_SDK_KEY;
const SDK_SECRET = process.env.ZOOM_MEETING_SDK_SECRET;

if (!SDK_KEY || !SDK_SECRET) {
  console.error("FATAL ERROR: ZOOM_MEETING_SDK_KEY and ZOOM_MEETING_SDK_SECRET must be set in .env");
  process.exit(1);
}

/**
 * Generates a signature required for the Zoom Meeting SDK to join a meeting,
 * following the latest JWT format.
 * @param {string} meetingNumber - The ID of the meeting to join.
 * @param {number} role - The role of the user (0 for participant, 1 for host).
 * @returns {string} The generated JWT signature.
 */
export function generateSdkSignature(meetingNumber, role) {
  // Timestamps in seconds
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2; // Expires in 2 hours, as recommended

  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });

  // Create the payload, aligning with the official documentation
  const payload = JSON.stringify({
    
    appKey: SDK_KEY,      // Use the SDK Key as the appKey, as per docs
    sdkKey: SDK_KEY,      // Include sdkKey for full compatibility across versions
    mn: meetingNumber,
    role: role,
    iat: iat,
    exp: exp,
    tokenExp: exp         // tokenExp is required and should be the same as exp
  });

  // Create the signature
  const base64Header = Buffer.from(header).toString('base64url');
  const base64Payload = Buffer.from(payload).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', SDK_SECRET) // Sign with the SDK SECRET
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');
    
  // Combine the parts into the final JWT
  return `${base64Header}.${base64Payload}.${signature}`;
}
