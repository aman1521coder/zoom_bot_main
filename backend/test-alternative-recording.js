import axios from 'axios';

// Test configuration
const BASE_URL = 'https://blackkbingo.com';
const TEST_MEETING_ID = '87243734757'; // Use the meeting ID from your error

// Test the alternative recording endpoints
async function testAlternativeRecording() {
  console.log('🎯 Testing Alternative Zoom Recording API...\n');

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

    // Test 2: Check recording capabilities (requires auth)
    console.log('2️⃣ Testing recording capabilities...');
    try {
      const capabilitiesResponse = await axios.get(`${BASE_URL}/api/alternative-recorder/capabilities`);
      console.log('✅ Capabilities response:', capabilitiesResponse.data);
    } catch (error) {
      console.log('⚠️ Capabilities check failed (expected without auth):', error.response && error.response.data ? error.response.data : error.message);
    }
    console.log('');

    // Test 3: Get meeting info
    console.log('3️⃣ Testing meeting info...');
    try {
      const meetingResponse = await axios.get(`${BASE_URL}/api/alternative-recorder/meeting/${TEST_MEETING_ID}`);
      console.log('✅ Meeting info response:', meetingResponse.data);
    } catch (error) {
      console.log('⚠️ Meeting info failed (expected without auth):', error.response && error.response.data ? error.response.data : error.message);
    }
    console.log('');

    // Test 4: Start recording with alternative recorder
    console.log('4️⃣ Testing alternative recording start...');
    try {
      const startResponse = await axios.post(`${BASE_URL}/api/alternative-recorder/start/${TEST_MEETING_ID}`);
      console.log('✅ Alternative recording start response:', startResponse.data);
    } catch (error) {
      console.log('⚠️ Alternative recording start failed (expected without auth):', error.response && error.response.data ? error.response.data : error.message);
    }
    console.log('');

    console.log('🎉 Alternative Recording API test completed!');
    console.log('\n📝 Solutions for the recording issue:');
    console.log('1. Upgrade Zoom account to Pro or higher for cloud recording');
    console.log('2. Enable local recording in Zoom account settings');
    console.log('3. Use the alternative recorder which tries multiple methods');
    console.log('4. The alternative recorder will track meetings even without recording');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAlternativeRecording(); 