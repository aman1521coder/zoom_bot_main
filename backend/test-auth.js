import axios from 'axios';

// Test authentication flow
async function testAuth() {
  console.log('🔐 Testing Authentication...\n');

  const BASE_URL = 'https://blackkbingo.com';

  try {
    // Test 1: Check OAuth endpoint
    console.log('1️⃣ Testing OAuth endpoint...');
    try {
      const authResponse = await axios.get(`${BASE_URL}/api/auth/zoom`);
      console.log('✅ OAuth endpoint accessible');
      console.log('🔗 OAuth URL:', authResponse.request.res.responseUrl || 'Redirected');
    } catch (error) {
      console.log('❌ OAuth error:', error.response ? error.response.status : error.message);
    }
    console.log('');

    // Test 2: Check if user is authenticated
    console.log('2️⃣ Testing user authentication...');
    try {
      const userResponse = await axios.get(`${BASE_URL}/api/auth/user`);
      console.log('✅ User endpoint response:', userResponse.data);
    } catch (error) {
      console.log('⚠️ User not authenticated (expected):', error.response ? error.response.data : error.message);
    }
    console.log('');

    console.log('🎉 Auth Test Completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Visit: https://blackkbingo.com/api/auth/zoom');
    console.log('2. Authenticate with your Zoom account');
    console.log('3. Start a real Zoom meeting');
    console.log('4. Check if webhooks are configured in Zoom');

  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
  }
}

// Run the test
testAuth(); 