
import jwt from 'jsonwebtoken';
import 'dotenv/config'; // To load variables from a .env file

// IMPORTANT: These must be from your MEETING SDK app in the Zoom Marketplace
const SDK_KEY = process.env.ZOOM_MEETING_SDK_KEY;
const SDK_SECRET = process.env.ZOOM_MEETING_SDK_SECRET;

/**
 * Generates a JWT signature for the Zoom Meeting SDK.
 * @param {string} meetingNumber - The ID of the meeting to join.
 * @param {number} role - The user's role (0 for participant, 1 for host).
 * @returns {string} The generated JWT signature.
 */
export function generateSdkSignature(meetingNumber, role) {
  // Check if credentials are loaded
  if (!SDK_KEY || !SDK_SECRET) {
    throw new Error('Zoom SDK Key and Secret are not defined in your environment variables.');
  }

  // Set the token expiration time (max 2 days)
  const iat = Math.round(new Date().getTime() / 1000) - 30; // Issued at time, 30s in the past for clock skew
  const exp = iat + 60 * 60 * 2; // Expires in 2 hours

  const payload = {
    sdkKey: SDK_KEY,
    appKey: SDK_KEY, // appKey is an alias for sdkKey in this context
    mn: meetingNumber,
    role: role,
    iat: iat,
    exp: exp,
    tokenExp: exp // Token expiration time
  };

  // The library handles the header, base64url encoding, and signing
  const token = jwt.sign(payload, SDK_SECRET, { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } });
  
  console.log('[SIGNATURE_GENERATOR] Successfully generated signature.');
  return token;
}