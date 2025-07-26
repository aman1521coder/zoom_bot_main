import mongoose from 'mongoose';
import 'dotenv/config';
import Meeting from './models/meeting.js';
import User from './models/user.js';

async function createTestMeeting() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find a user (or create one)
    let user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('Creating test user...');
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        zoomUserId: 'test-zoom-id'
      });
    }

    // Create a test meeting with transcription
    const meeting = await Meeting.create({
      userId: user._id,
      meetingId: `test-${Date.now()}`,
      topic: 'Test Meeting with Transcription',
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(),
      duration: 3600,
      participantCount: 5,
      recordingUrl: '/recordings/test-recording.webm',
      transcriptUrl: '/recordings/test-transcript.txt',
      transcription: 'This is a test transcription. The meeting discussed important topics including project updates, team collaboration, and future planning.',
      summary: 'Meeting Summary: Discussed Q4 goals, reviewed project timeline, assigned action items to team members.',
      status: 'completed'
    });

    console.log('✅ Test meeting created:', {
      id: meeting._id,
      topic: meeting.topic,
      meetingId: meeting.meetingId
    });

    // Create another meeting
    const meeting2 = await Meeting.create({
      userId: user._id,
      meetingId: `test-${Date.now() + 1}`,
      topic: 'Weekly Team Standup',
      startTime: new Date(Date.now() - 7200000), // 2 hours ago
      endTime: new Date(Date.now() - 3600000),
      duration: 3600,
      participantCount: 8,
      recordingUrl: '/recordings/standup-recording.webm',
      transcriptUrl: '/recordings/standup-transcript.txt',
      transcription: 'Team standup meeting. John: Working on frontend features. Sarah: Completed backend API. Mike: Testing deployment process.',
      summary: 'Standup Summary: Team is on track with sprint goals. No blockers reported.',
      status: 'completed'
    });

    console.log('✅ Second test meeting created:', {
      id: meeting2._id,
      topic: meeting2.topic
    });

    // List all meetings for this user
    const allMeetings = await Meeting.find({ userId: user._id });
    console.log(`\n📋 Total meetings for user: ${allMeetings.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestMeeting(); 