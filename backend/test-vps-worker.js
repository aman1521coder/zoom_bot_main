import axios from 'axios';
import vpsWorkerService from './services/vpsWorkerService.js';
import 'dotenv/config';

// Test VPS worker integration
async function testVPSWorker() {
  console.log('🤖 Testing VPS Worker Integration...\n');

  try {
    // Test 1: Check VPS worker health
    console.log('1️⃣ Testing VPS worker health...');
    const isHealthy = await vpsWorkerService.checkWorkerHealth();
    if (isHealthy) {
      console.log('✅ VPS worker is healthy and responding');
    } else {
      console.log('❌ VPS worker is not responding');
      console.log('💡 Make sure the worker is running on the VPS');
      console.log('🔗 SSH to VPS: ssh root@147.93.119.85');
      console.log('📁 Check worker: cd puppeteer-worker && node worker.js');
    }
    console.log('');

    // Test 2: Test direct VPS worker API
    console.log('2️⃣ Testing direct VPS worker API...');
    try {
      const response = await axios.post('http://147.93.119.85:3000/launch-bot', {
        meetingId: '123456789',
        password: '',
        userId: 'test-user-id'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-secret': '1234'
        },
        timeout: 5000
      });
      
      if (response.status === 202) {
        console.log('✅ VPS worker API is working correctly');
        console.log('📝 Response:', response.data);
      } else {
        console.log('⚠️ Unexpected response status:', response.status);
      }
    } catch (error) {
      console.log('❌ VPS worker API error:', error.response ? error.response.data : error.message);
    }
    console.log('');

    // Test 3: Test webhook flow
    console.log('3️⃣ Testing webhook flow...');
    console.log('💡 To test the complete flow:');
    console.log('   1. Start a real Zoom meeting');
    console.log('   2. Check server logs for webhook events');
    console.log('   3. Verify bot joins the meeting');
    console.log('');

    console.log('🎉 VPS Worker Test Completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Ensure VPS worker is running: ssh root@147.93.119.85');
    console.log('2. Start a Zoom meeting to test the complete flow');
    console.log('3. Check logs for bot joining and recording');

  } catch (error) {
    console.error('❌ VPS worker test failed:', error.message);
  }
}

// Run the test
testVPSWorker(); 