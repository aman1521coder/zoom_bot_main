// services/meetingProcessor.js
import fs from 'fs/promises';
import 'dotenv/config';
import Meeting from '../models/meeting.js';
import { transcribeAudioFile, analyzeTranscript } from './aiAnalyzer.js';

// Get your app's base URL from environment variables for constructing links
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5000';

/**
 * Processes a recorded audio file from a meeting.
 * @param {object} file - The file object from multer.
 * @param {string} zoomMeetingId - The ID of the Zoom meeting.
 * @param {string} userId - The ID of the user who owns the meeting.
 */
export async function processRecordingFile(file, zoomMeetingId, userId) {
  const filePath = file.path; // e.g., 'public/recordings/167...-89....webm'
  console.log(`[PROCESSOR] Starting to process file ${filePath} for meeting ${zoomMeetingId}`);

  let meeting;
  try {
    // Ensure the meeting record exists
    meeting = await Meeting.findOneAndUpdate(
      { meetingId: zoomMeetingId, userId: userId },
      { $setOnInsert: { meetingId: zoomMeetingId, userId: userId, topic: "Meeting " + zoomMeetingId }, $set: { status: 'processing' } },
      { upsert: true, new: true }
    );

    // 1. Transcribe the audio file
    const transcript = await transcribeAudioFile(filePath);
    await Meeting.updateOne({ _id: meeting._id }, { transcript });

    // 2. Analyze the transcript
    const analysis = await analyzeTranscript(transcript);

    // --- MODIFIED: Construct the local download URL ---
    // The path needs to be relative to the domain root
    // e.g., 'public/recordings/file.webm' becomes '/recordings/file.webm'
    const publicPath = path.relative('public', filePath);
    const downloadUrl = `${APP_BASE_URL}/${publicPath.replace(/\\/g, '/')}`; // Ensure forward slashes

    // 3. Update the final record in the database
    await Meeting.updateOne({ _id: meeting._id }, {
      summary: analysis.summary,
      actionItems: analysis.actionItems,
      downloadUrl: downloadUrl, // Save the direct URL to the local file
      status: 'completed',
      processingError: null
    });
    console.log(`[PROCESSOR] Successfully processed and saved meeting ${zoomMeetingId}.`);

  } catch (error) {
    console.error(`[PROCESSOR] Failed to process file for meeting ${zoomMeetingId}:`, error.message);
    if(meeting) {
        await Meeting.updateOne({ _id: meeting._id }, { status: 'failed', processingError: error.message });
    }
  } finally {
    // --- REMOVED ---
    // We are no longer deleting the file, as it is the final stored recording.
    // await fs.unlink(filePath);
  }
}
