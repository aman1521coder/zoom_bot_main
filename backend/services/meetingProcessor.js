// services/meetingProcessor.js
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';
import Meeting from '../models/meeting.js';
import { analyzeTranscript } from './aiAnalyzer.js';

export async function processTwilioRecording(recordingUrl, zoomMeetingId) {
  const twilioRecordingId = path.basename(recordingUrl);
  console.log(`[PROCESSOR] Processing Twilio recording ${twilioRecordingId}`);

  try {
    const meeting = await Meeting.findOne({ meetingId: zoomMeetingId });
    if (!meeting) {
      // If no meeting record exists, create one now.
      // We may need more info like topic, which we could store in the callToMeetingMap.
      console.log(`[PROCESSOR] No meeting found for ${zoomMeetingId}, creating a new one.`);
      const newMeeting = new Meeting({ meetingId: zoomMeetingId, status: 'processing', userId: 'placeholder' /* You might need to add userId to the map */ });
      await newMeeting.save();
    } else {
        await meeting.updateOne({ status: 'processing' });
    }

    const response = await axios({ url: recordingUrl, method: 'GET', responseType: 'stream' });
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    const filePath = path.join(tempDir, `${twilioRecordingId}.mp3`);
    await fs.writeFile(filePath, response.data);
    console.log(`[PROCESSOR] Downloaded audio.`);

    const transcript = "Placeholder transcript from the Twilio recording.";
    console.log(`[PROCESSOR] Transcribed audio.`);

    const analysis = await analyzeTranscript(transcript);
    console.log(`[PROCESSOR] Analysis complete.`);

    await Meeting.updateOne({ meetingId: zoomMeetingId }, {
      transcript,
      summary: analysis.summary,
      actionItems: analysis.actionItems,
      status: 'completed'
    });
    console.log(`[PROCESSOR] Saved analysis to meeting ${zoomMeetingId}.`);

    await fs.unlink(filePath);
  } catch (error) {
    console.error(`[PROCESSOR] Failed to process Twilio recording ${twilioRecordingId}:`, error.message);
    await Meeting.updateOne({ meetingId: zoomMeetingId }, { status: 'failed', processingError: error.message });
  }
}
