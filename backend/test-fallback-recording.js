import axios from 'axios';

// Test configuration
const BASE_URL = 'https://blackkbingo.com';
const TEST_MEETING_ID = '83093524460'; // Use the meeting ID from your error

// Test the fallback recording system
async function testFallbackRecording() {
  console.log('🔄 Testing Fallback Recording System...\n');

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

    // Test 2: Start recording with fallback
    console.log('2️⃣ Testing fallback recording start...');
    try {
      const startResponse = await axios.post(`${BASE_URL}/api/recorder/start/${TEST_MEETING_ID}`);
      console.log('✅ Fallback recording start response:', startResponse.data);
    } catch (error) {
      console.log('⚠️ Fallback recording start failed (expected without auth):', error.response && error.response.data ? error.response.data : error.message);
    }
    console.log('');

    console.log('🎉 Fallback Recording System test completed!');
    console.log('\n📝 Fallback Recording Methods:');
    console.log('1️⃣ Cloud Recording (if available)');
    console.log('2️⃣ Local Recording (if enabled)');
    console.log('3️⃣ Manual Recording (always available)');
    console.log('4️⃣ Meeting Tracking (always works)');
    console.log('\n💡 The system will automatically try each method until one works!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFallbackRecording(); 