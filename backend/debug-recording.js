import axios from 'axios';

// Test the deployed recording system
async function debugRecording() {
  console.log('🔍 Debugging Recording System...\n');

  const BASE_URL = 'https://blackkbingo.com';
  const TEST_MEETING_ID = '83093524460';

  try {
    // Test 1: Check if server is responding
    console.log('1️⃣ Testing server response...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is running:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server error:', error.message);
      return;
    }
    console.log('');

    // Test 2: Check if webhook endpoint exists
    console.log('2️⃣ Testing webhook endpoint...');
    try {
      const webhookResponse = await axios.post(`${BASE_URL}/api/webhook/zoom/test`, {
        test: 'webhook'
      });
      console.log('✅ Webhook endpoint works:', webhookResponse.data);
    } catch (error) {
      console.log('❌ Webhook error:', error.response ? error.response.data : error.message);
    }
    console.log('');

    // Test 3: Test manual webhook trigger
    console.log('3️⃣ Testing manual webhook trigger...');
    try {
      const manualResponse = await axios.post(`${BASE_URL}/api/webhook/zoom/manual`, {
        event: 'meeting.started',
        payload: {
          object: {
            id: TEST_MEETING_ID,
            topic: 'Debug Test Meeting',
            host_id: 'RyiKrhmbTruCfyFZogKkJg'
          }
        }
      });
      console.log('✅ Manual webhook response:', manualResponse.data);
    } catch (error) {
      console.log('❌ Manual webhook error:', error.response ? error.response.data : error.message);
    }
    console.log('');

    // Test 4: Check recording endpoint
    console.log('4️⃣ Testing recording endpoint...');
    try {
      const recordingResponse = await axios.post(`${BASE_URL}/api/recorder/start/${TEST_MEETING_ID}`);
      console.log('✅ Recording endpoint response:', recordingResponse.data);
    } catch (error) {
      console.log('⚠️ Recording endpoint (expected auth error):', error.response ? error.response.data : error.message);
    }
    console.log('');

    console.log('🎉 Debug completed!');
    console.log('\n📝 What to check:');
    console.log('1. Are you starting real Zoom meetings?');
    console.log('2. Is your Zoom account authenticated?');
    console.log('3. Are webhooks configured in Zoom?');
    console.log('4. Check server logs for webhook events');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugRecording(); 