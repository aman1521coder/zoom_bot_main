import axios from 'axios';

// Test configuration
const BASE_URL = 'https://blackkbingo.com';
const TEST_MEETING_ID = '123456789'; // Replace with a real meeting ID for testing

// Test the recording endpoints
async function testRecording() {
  console.log('🎯 Testing Zoom Recording API...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: List recordings
    console.log('2️⃣ Testing list recordings...');
    try {
      const listResponse = await axios.get(`${BASE_URL}/api/recorder/list`);
      console.log('✅ List recordings response:', listResponse.data);
    } catch (error) {
      console.log('⚠️ List recordings failed (expected if no auth):', error.response && error.response.data ? error.response.data : error.message);
    }
    console.log('');

    // Test 3: Get active recordings
    console.log('3️⃣ Testing active recordings...');
    try {
      const activeResponse = await axios.get(`${BASE_URL}/api/recorder/active`);
      console.log('✅ Active recordings response:', activeResponse.data);
    } catch (error) {
      console.log('⚠️ Active recordings failed (expected if no auth):', error.response && error.response.data ? error.response.data : error.message);
    }
    console.log('');

    // Test 4: Start recording (will fail without auth, but tests the endpoint)
    console.log('4️⃣ Testing start recording...');
    try {
      const startResponse = await axios.post(`${BASE_URL}/api/recorder/start/${TEST_MEETING_ID}`);
      console.log('✅ Start recording response:', startResponse.data);
    } catch (error) {
      console.log('⚠️ Start recording failed (expected without auth):', error.response && error.response.data ? error.response.data : error.message);
    }
    console.log('');

    console.log('🎉 Recording API test completed!');
    console.log('\n📝 To test with real data:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Authenticate with Zoom OAuth');
    console.log('3. Use a real meeting ID');
    console.log('4. Test the endpoints with proper authentication');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running on port 5000');
  }
}

// Run the test
testRecording(); 