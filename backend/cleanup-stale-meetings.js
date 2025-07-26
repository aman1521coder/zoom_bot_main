import mongoose from 'mongoose';
import 'dotenv/config';
import Meeting from './models/meeting.js';

async function cleanupStaleMeetings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find meetings that are marked as active but have no endTime
    // and are older than 1 hour (likely abandoned)
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
    
    const staleMeetings = await Meeting.find({
      status: { $in: ['active', 'recording', 'joined'] },
      endTime: null,  // No end time set
      $or: [
        { startTime: { $lt: oneHourAgo } },
        { createdAt: { $lt: oneHourAgo } }
      ]
    });

    console.log(`\n📊 Found ${staleMeetings.length} stale meetings to clean up`);

    if (staleMeetings.length > 0) {
      console.log('\n🔍 Stale meetings:');
      staleMeetings.forEach(meeting => {
        const age = Math.round((Date.now() - new Date(meeting.createdAt).getTime()) / (1000 * 60 * 60));
        console.log(`  - ${meeting.topic || 'Untitled'} (${meeting.meetingId}) - ${age} hours old`);
      });

      // Update all stale meetings to completed
      const result = await Meeting.updateMany(
        {
          status: { $in: ['active', 'recording', 'joined'] },
          endTime: null,
          $or: [
            { startTime: { $lt: oneHourAgo } },
            { createdAt: { $lt: oneHourAgo } }
          ]
        },
        {
          $set: {
            status: 'completed',
            endTime: new Date(),
            processingError: 'Meeting ended due to timeout (no end webhook received)'
          }
        }
      );

      console.log(`\n✅ Updated ${result.modifiedCount} meetings to completed status`);
    }

    // Show current meeting statistics
    const stats = await Meeting.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📈 Meeting Statistics:');
    stats.forEach(stat => {
      console.log(`  - ${stat._id || 'unknown'}: ${stat.count} meetings`);
    });

    // Show currently active meetings (should have no endTime)
    const currentlyActive = await Meeting.find({
      status: { $in: ['active', 'recording', 'joined'] },
      endTime: null
    }).sort({ createdAt: -1 });

    if (currentlyActive.length > 0) {
      console.log('\n🟢 Currently Active Meetings:');
      currentlyActive.forEach(meeting => {
        const age = Math.round((Date.now() - new Date(meeting.createdAt).getTime()) / (1000 * 60));
        console.log(`  - ${meeting.topic || 'Untitled'} (${meeting.meetingId}) - ${age} minutes old`);
      });
    } else {
      console.log('\n✅ No active meetings');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupStaleMeetings(); 