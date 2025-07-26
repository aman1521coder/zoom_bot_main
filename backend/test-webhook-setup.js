import axios from 'axios';

console.log('🔍 Zoom Webhook Diagnostic Tool\n');

const WEBHOOK_URL = 'https://blackkbingo.com/api/webhook/zoom';

async function testWebhookSetup() {
  console.log('1️⃣ Testing webhook endpoint availability...');
  
  try {
    // Test health endpoint
    const healthResponse = await axios.get(`${WEBHOOK_URL}/health`);
    console.log('✅ Webhook endpoint is reachable');
    console.log('   Response:', healthResponse.data);
  } catch (error) {
    console.error('❌ Cannot reach webhook endpoint');
    console.error('   Error:', error.message);
    console.log('\n⚠️  Make sure your backend is deployed and running');
    return;
  }

  console.log('\n2️⃣ Testing webhook with sample data...');
  
  try {
    // Send a test meeting.started event
    const testPayload = {
      event: 'meeting.started',
      payload: {
        object: {
          id: `test-${Date.now()}`,
          topic: 'Test Meeting from Diagnostic',
          host_id: 'test-host-id',
          password: ''
        }
      }
    };

    const response = await axios.post(`${WEBHOOK_URL}/test`, testPayload);
    console.log('✅ Test webhook sent successfully');
    console.log('   Response:', response.data);
  } catch (error) {
    console.error('❌ Test webhook failed');
    console.error('   Error:', error.message);
  }

  console.log('\n3️⃣ Zoom Webhook Configuration Checklist:');
  console.log('   [ ] Is your webhook URL in Zoom set to: https://blackkbingo.com/api/webhook/zoom');
  console.log('   [ ] Is the webhook subscription active in Zoom App Marketplace?');
  console.log('   [ ] Have you subscribed to these events?');
  console.log('       - meeting.started');
  console.log('       - meeting.ended');
  console.log('       - recording.completed');
  console.log('   [ ] Is your Zoom app published or in development mode?');
  
  console.log('\n4️⃣ To verify in Zoom:');
  console.log('   1. Go to: https://marketplace.zoom.us/');
  console.log('   2. Click "Manage" → Your App');
  console.log('   3. Go to "Feature" → "Event Subscriptions"');
  console.log('   4. Check the Event notification endpoint URL');
  console.log('   5. Click "Validate" to test the URL');
  
  console.log('\n5️⃣ Common Issues:');
  console.log('   - Webhook URL mismatch (http vs https)');
  console.log('   - Webhook verification failing (we temporarily disabled it)');
  console.log('   - App not authorized for your account');
  console.log('   - Meeting started by different account than authorized');
}

testWebhookSetup(); 