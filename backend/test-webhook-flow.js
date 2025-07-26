import mongoose from 'mongoose';
import User from './models/user.js';
import 'dotenv/config';

// Test the webhook flow
async function testWebhookFlow() {
  console.log('🔍 Testing Webhook Flow...\n');

  try {
    // Connect to MongoDB
    console.log('1️⃣ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
    console.log('');

    // Check if there are any users
    console.log('2️⃣ Checking users in database...');
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users in database`);
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`👤 User ${index + 1}:`);
        console.log(`   - ID: ${user._id}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - Zoom ID: ${user.zoomId}`);
        console.log(`   - Has Access Token: ${user.accessToken ? 'Yes' : 'No'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No users found in database');
      console.log('💡 You need to authenticate with Zoom first');
      console.log('🔗 Visit: https://blackkbingo.com/api/auth/zoom');
    }
    console.log('');

    // Test webhook with a sample user
    console.log('3️⃣ Testing webhook flow...');
    const testHostId = 'RyiKrhmbTruCfyFZogKkJg';
    const testMeetingId = '83093524460';
    
    const user = await User.findOne({ zoomId: testHostId });
    if (user) {
      console.log(`✅ Found user for Zoom ID: ${testHostId}`);
      console.log(`📧 User email: ${user.email}`);
      console.log(`🔑 Has access token: ${user.accessToken ? 'Yes' : 'No'}`);
      
      if (!user.accessToken) {
        console.log('⚠️ User needs to re-authorize');
        console.log('🔗 Visit: https://blackkbingo.com/api/auth/zoom');
      }
    } else {
      console.log(`❌ No user found for Zoom ID: ${testHostId}`);
      console.log('💡 This means the webhook won\'t trigger recording');
      console.log('🔗 You need to authenticate with Zoom first');
    }
    console.log('');

    console.log('🎉 Webhook Flow Test Completed!');
    console.log('\n📝 Next Steps:');
    if (users.length === 0) {
      console.log('1. Visit: https://blackkbingo.com/api/auth/zoom');
      console.log('2. Authenticate with your Zoom account');
      console.log('3. Start a meeting to test recording');
    } else if (!user || !user.accessToken) {
      console.log('1. Re-authorize your Zoom account');
      console.log('2. Visit: https://blackkbingo.com/api/auth/zoom');
      console.log('3. Start a meeting to test recording');
    } else {
      console.log('1. Start a Zoom meeting');
      console.log('2. Check server logs for recording messages');
      console.log('3. The webhook should trigger automatically');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testWebhookFlow(); 