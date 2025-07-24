// test-webhook.js
import crypto from 'crypto';
import 'dotenv/config';

// The zoomId of the user you have already authenticated via the browser.
// This ensures the webhook simulates an event for a "known user".
const YOUR_AUTHENTICATED_ZOOM_ID = "RyiKrhmbTruCfyFZogKkJg";

// This is the fake webhook data we will send to our server.
const payload = {
  event: 'meeting.started',
  payload: {
    account_id: 'vrwopGt1SleEq3lY1SVphg', // This value isn't used by our user-based bot.
    object: {
      id: `81271298645`, // A unique fake meeting ID for our test.
      topic: 'Local Test Meeting via Curl',
      start_time: new Date().toISOString(),
      
      // *** THIS IS THE FIX ***
      // Use the variable containing your real zoomId.
      host_id: YOUR_AUTHENTICATED_ZOOM_ID 
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
const message = `v0:${timestamp}:${payloadString}`;

// Create the secure HMAC SHA256 signature.
const hash = crypto.createHmac('sha256', secret).update(message).digest('hex');
const signature = `v0=${hash}`;

// Assemble the final, complete curl command.
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
