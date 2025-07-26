import mongoose from 'mongoose';
import 'dotenv/config';
import Meeting from './models/meeting.js';

async function fixActiveMeetings() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all meetings with status active/recording/joined that have no endTime
    const activeMeetings = await Meeting.find({
      status: { $in: ['active', 'recording', 'joined'] },
      endTime: null
    });

    console.log(`\n📊 Found ${activeMeetings.length} meetings marked as active without endTime`);

    // Mark all of them as completed since they're test meetings
    const result = await Meeting.updateMany(
      {
        status: { $in: ['active', 'recording', 'joined'] },
        endTime: null
      },
      {
        $set: {
          status: 'completed',
          endTime: new Date(),
          duration: 3600, // Default 1 hour
          processingError: 'Meeting ended - no webhook received'
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} meetings to completed`);

    // Show final stats
    const stats = await Meeting.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📈 Final Meeting Statistics:');
    stats.forEach(stat => {
      console.log(`  - ${stat._id || 'unknown'}: ${stat.count} meetings`);
    });

    // Check for recordings
    const meetingsWithRecordings = await Meeting.countDocuments({
      recordingUrl: { $exists: true, $ne: null }
    });

    console.log(`\n🎥 Meetings with recordings: ${meetingsWithRecordings}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixActiveMeetings(); 