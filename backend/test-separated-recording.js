import axios from 'axios';

const BASE_URL = 'https://blackkbingo.com';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODgwMGNjZjE3ZjU2ZDRhMmZhMTZiNzYiLCJpYXQiOjE3NTM1MTI5MTcsImV4cCI6MTc1NDExNzcxN30.ydvf6-GFBWguBCyN4KV7pqmJPF0fiYKmYWc7rOvs9Eo';

async function testSeparatedApproach() {
  console.log('🧪 Testing Separated Join and Recording Approach\n');

  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Join Only (no recording)
    console.log('📍 Test 1: Join meeting without recording');
    const joinOnlyResponse = await axios.post(
      `${BASE_URL}/api/recording/join-only`,
      {
        meetingId: 'test-join-only-123',
        password: ''
      },
      { headers }
    );
    console.log('✅ Join only result:', joinOnlyResponse.data);
    console.log('');

    // Test 2: Start recording separately
    console.log('📍 Test 2: Start recording separately');
    const recordResponse = await axios.post(
      `${BASE_URL}/api/recording/start`,
      {
        meetingId: 'test-record-456',
        method: 'browser'
      },
      { headers }
    );
    console.log('✅ Recording started:', recordResponse.data);
    console.log('');

    // Test 3: Join AND Record (combined)
    console.log('📍 Test 3: Join and record together');
    const combinedResponse = await axios.post(
      `${BASE_URL}/api/recording/join-and-record`,
      {
        meetingId: 'test-combined-789',
        password: '',
        recordingMethod: 'browser'
      },
      { headers }
    );
    console.log('✅ Combined result:', JSON.stringify(combinedResponse.data, null, 2));
    console.log('');

    // Test 4: Check recording status
    console.log('📍 Test 4: Check recording status');
    const statusResponse = await axios.get(
      `${BASE_URL}/api/recording/status/test-combined-789`,
      { headers }
    );
    console.log('✅ Recording status:', statusResponse.data);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Show the different options
console.log('🎯 SEPARATED RECORDING ARCHITECTURE');
console.log('=====================================\n');
console.log('Now you can:');
console.log('1. Join meetings WITHOUT recording (VPS bot only)');
console.log('2. Record WITHOUT joining (browser/cloud recording)');
console.log('3. Join AND record (combined approach)');
console.log('4. Choose recording method: cloud, browser, local, api\n');

testSeparatedApproach(); 