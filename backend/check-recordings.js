import mongoose from 'mongoose';
import 'dotenv/config';
import Meeting from './models/meeting.js';

async function checkRecordings() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check different recording fields
    const recordingUrlCount = await Meeting.countDocuments({
      recordingUrl: { $exists: true, $ne: null, $ne: '' }
    });

    const downloadUrlCount = await Meeting.countDocuments({
      downloadUrl: { $exists: true, $ne: null, $ne: '' }
    });

    const transcriptCount = await Meeting.countDocuments({
      transcript: { $exists: true, $ne: null, $ne: '' }
    });

    const transcriptionCount = await Meeting.countDocuments({
      transcription: { $exists: true, $ne: null, $ne: '' }
    });

    console.log('\n📊 Recording Statistics:');
    console.log(`  - Meetings with recordingUrl: ${recordingUrlCount}`);
    console.log(`  - Meetings with downloadUrl: ${downloadUrlCount}`);
    console.log(`  - Meetings with transcript: ${transcriptCount}`);
    console.log(`  - Meetings with transcription: ${transcriptionCount}`);

    // Show sample meetings with any recording data
    const meetingsWithAnyRecording = await Meeting.find({
      $or: [
        { recordingUrl: { $exists: true, $ne: null, $ne: '' } },
        { downloadUrl: { $exists: true, $ne: null, $ne: '' } },
        { transcript: { $exists: true, $ne: null, $ne: '' } },
        { transcription: { $exists: true, $ne: null, $ne: '' } }
      ]
    }).limit(5);

    if (meetingsWithAnyRecording.length > 0) {
      console.log('\n🎥 Sample meetings with recording data:');
      meetingsWithAnyRecording.forEach(meeting => {
        console.log(`\n  Meeting: ${meeting.topic || meeting.meetingId}`);
        if (meeting.recordingUrl) console.log(`    - recordingUrl: ${meeting.recordingUrl}`);
        if (meeting.downloadUrl) console.log(`    - downloadUrl: ${meeting.downloadUrl}`);
        if (meeting.transcript) console.log(`    - transcript: ${meeting.transcript.substring(0, 50)}...`);
        if (meeting.transcription) console.log(`    - transcription: ${meeting.transcription.substring(0, 50)}...`);
      });
    } else {
      console.log('\n❌ No meetings found with any recording data');
    }

    // Check recording methods
    const recordingMethods = await Meeting.aggregate([
      {
        $group: {
          _id: '$recordingMethod',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📋 Recording Methods:');
    recordingMethods.forEach(method => {
      console.log(`  - ${method._id || 'none'}: ${method.count} meetings`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkRecordings(); 