import axios from 'axios';

// Test with REAL meeting - YOU NEED TO START A ZOOM MEETING FIRST!
async function testRealMeeting() {
  console.log('🎯 Testing with REAL Zoom Meeting...\n');
  
  // ⚠️ IMPORTANT: Replace this with YOUR actual meeting ID
  const REAL_MEETING_ID = 'YOUR_MEETING_ID_HERE'; // Get this from a real Zoom meeting
  
  if (REAL_MEETING_ID === 'YOUR_MEETING_ID_HERE') {
    console.log('❌ ERROR: You need to replace YOUR_MEETING_ID_HERE with a real meeting ID!');
    console.log('');
    console.log('📋 Steps to get a real meeting ID:');
    console.log('1. Start a Zoom meeting from your Zoom client');
    console.log('2. Click "Participants" or "Meeting Info"');
    console.log('3. Copy the Meeting ID (11 digits)');
    console.log('4. Replace YOUR_MEETING_ID_HERE in this file');
    console.log('5. Run this script again');
    return;
  }

  const BASE_URL = 'https://blackkbingo.com';

  try {
    console.log(`🚀 Sending webhook for REAL meeting: ${REAL_MEETING_ID}`);
    
    const response = await axios.post(`${BASE_URL}/api/webhook/zoom/manual`, {
      event: 'meeting.started',
      payload: {
        object: {
          id: REAL_MEETING_ID,
          topic: 'Real Test Meeting',
          host_id: 'RyiKrhmbTruCfyFZogKkJg', // Your Zoom host ID
          password: '' // Add password if your meeting has one
        }
      }
    });
    
    console.log('✅ Webhook sent successfully:', response.data);
    console.log('');
    console.log('🤖 Bot should now try to join your REAL meeting!');
    console.log('💡 Check your Zoom meeting - you should see "AI Assistant" join');
    
  } catch (error) {
    console.error('❌ Error sending webhook:', error.response ? error.response.data : error.message);
  }
}

testRealMeeting(); 