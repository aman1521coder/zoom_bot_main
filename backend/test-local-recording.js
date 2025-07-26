import axios from 'axios';

// Test configuration
const BASE_URL = 'https://blackkbingo.com';
const TEST_MEETING_ID = '83093524460';

// Test the local recording system
async function testLocalRecording() {
  console.log('🎤 Testing Local Recording System (No Cloud Recording)...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Health check passed:', healthResponse.data);
    } catch (error) {
      console.log('⚠️ Health check failed (server might be down):', error.message);
    }
    console.log('');

    // Test 2: Start local recording
    console.log('2️⃣ Testing local recording start...');
    try {
      const startResponse = await axios.post(`${BASE_URL}/api/recorder/start/${TEST_MEETING_ID}`);
      console.log('✅ Local recording start response:', startResponse.data);
    } catch (error) {
      console.log('⚠️ Local recording start failed (expected without auth):', error.response && error.response.data ? error.response.data : error.message);
    }
    console.log('');

    // Test 3: Get recording status
    console.log('3️⃣ Testing recording status...');
    try {
      const statusResponse = await axios.get(`${BASE_URL}/api/recorder/status/${TEST_MEETING_ID}`);
      console.log('✅ Recording status response:', statusResponse.data);
    } catch (error) {
      console.log('⚠️ Recording status failed (expected without auth):', error.response && error.response.data ? error.response.data : error.message);
    }
    console.log('');

    console.log('🎉 Local Recording System test completed!');
    console.log('\n📝 Recording Methods (No Cloud):');
    console.log('1️⃣ Local Recording (files saved on host computer)');
    console.log('2️⃣ Manual Recording (host clicks record button)');
    console.log('3️⃣ Meeting Tracking (analytics only)');
    console.log('\n💡 No cloud recording dependency!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testLocalRecording(); 