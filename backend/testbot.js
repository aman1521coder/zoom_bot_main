// test-webhook.js
import crypto from 'crypto';
import 'dotenv/config';

// This is the fake data we want to send, pretending to be Zoom.
const payload = {
  event: 'meeting.started',
  payload: {
    account_id: process.env.ZOOM_BOT_ACCOUNT_ID,
    object: {
      id: "98765432101", // A fake meeting ID for our test
      topic: 'Live Test Meeting via Curl',
      start_time: new Date().toISOString(),
      host_id: 'someFakeHostId'
    }
  }
};
const payloadString = JSON.stringify(payload);

// Get the current timestamp (the number of seconds since 1970).
const timestamp = Math.floor(new Date().getTime() / 1000);

// Get your secret token from your .env file.
const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

// A safety check.
if (!secret) {
  console.error("ERROR: ZOOM_WEBHOOK_SECRET_TOKEN not found in .env file.");
  console.error("Please make sure you have copied it from the Zoom Marketplace.");
  process.exit(1);
}

// Create the message string that will be signed.
// It must be in the format: v0:TIMESTAMP:JSON_BODY
const message = `v0:${timestamp}:${payloadString}`;

// Create the secure HMAC SHA256 signature.
const hash = crypto.createHmac('sha256', secret).update(message).digest('hex');
const signature = `v0=${hash}`;

// Assemble the final, complete curl command with all the required parts.
const curlCommand = `
echo "--- Sending Test Webhook ---"
curl -X POST http://localhost:5000/api/webhook \\
  -H "Content-Type: application/json" \\
  -H "x-zm-request-timestamp: ${timestamp}" \\
  -H "x-zm-signature: ${signature}" \\
  -d '${payloadString}'
echo "\\n--- Test Sent ---"
`;

// Print the generated command to the console.
console.log("✅ Your test command is ready!");
console.log("Copy the command below and paste it into a new terminal to run it:\n");
console.log(curlCommand);
