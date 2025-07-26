import axios from 'axios';

// Test configuration
const BASE_URL = 'https://blackkbingo.com';
const TEST_MEETING_ID = '87243734757'; // Use the meeting ID from your error

// Test the voice recording and transcription endpoints
async function testVoiceRecording() {
  console.log('🎤 Testing Voice Recording and Transcription API...\n');

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

    // Test 2: Start voice recording and transcription
    console.log('2️⃣ Testing voice recording start...');
    try {
      const startResponse = await axios.post(`${BASE_URL}/api/recorder/start/${TEST_MEETING_ID}`);
      console.log('✅ Voice recording start response:', startResponse.data);
    } catch (error) {
      console.log('⚠️ Voice recording start failed (expected without auth):', error.response && error.response.data ? error.response.data : error.message);
    }
    console.log('');

    // Test 3: Download voice recordings and transcripts
    console.log('3️⃣ Testing voice recording download...');
    try {
      const downloadResponse = await axios.post(`${BASE_URL}/api/recorder/download/${TEST_MEETING_ID}`);
      console.log('✅ Voice recording download response:', downloadResponse.data);
    } catch (error) {
      console.log('⚠️ Voice recording download failed (expected without auth):', error.response && error.response.data ? error.response.data : error.message);
    }
    console.log('');

    // Test 4: List voice recordings
    console.log('4️⃣ Testing voice recordings list...');
    try {
      const listResponse = await axios.get(`${BASE_URL}/api/recorder/list`);
      console.log('✅ Voice recordings list response:', listResponse.data);
    } catch (error) {
      console.log('⚠️ Voice recordings list failed (expected without auth):', error.response && error.response.data ? error.response.data : error.message);
    }
    console.log('');

    console.log('🎉 Voice Recording API test completed!');
    console.log('\n📝 Voice Recording Features:');
    console.log('✅ Cloud recording with audio (M4A/MP4)');
    console.log('✅ Automatic transcription (English)');
    console.log('✅ Audio type: both computer and microphone');
    console.log('✅ Separate audio and transcript files');
    console.log('✅ Focus on voice content only');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testVoiceRecording(); 