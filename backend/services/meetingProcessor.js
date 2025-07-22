// services/meetingProcessor.js
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

import Meeting from '../models/Meeting.js';
import { analyzeTranscript } from './aiAnalyzer.js';

export async function processMeeting(meetingId) {
  console.log(`[PROCESSOR] Starting to process meeting ${meetingId}`);

  try {
    await Meeting.findByIdAndUpdate(meetingId, { status: 'processing' });
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new Error('Meeting not found in database.');

    // STEP 1: Download Audio File
    const response = await axios({
      url: meeting.downloadUrl,
      method: 'GET',
      responseType: 'stream',
    });
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    const filePath = path.join(tempDir, `${meeting.meetingId}.m4a`);
    await fs.writeFile(filePath, response.data);
    console.log(`[PROCESSOR] Downloaded audio for ${meetingId}`);

    // STEP 2: Transcribe Audio (Placeholder)
    // IMPORTANT: Replace this with a real transcription service for a real app.
    const transcript = "Speaker A: Welcome everyone. Let's discuss the Q3 project launch. Speaker B: The deadline is tight. We need to finalize the marketing plan. Action item: Sarah to send the final marketing plan by Friday. Speaker A: Agreed. Let's move on.";
    await Meeting.findByIdAndUpdate(meetingId, { transcript });
    console.log(`[PROCESSOR] Transcribed audio for ${meetingId}`);

    // STEP 3: Analyze with AI
    const analysis = await analyzeTranscript(transcript);
    await Meeting.findByIdAndUpdate(meetingId, {
      summary: analysis.summary,
      actionItems: analysis.actionItems,
      status: 'completed'
    });
    console.log(`[PROCESSOR] Completed analysis for ${meetingId}`);

    // STEP 4: Cleanup
    await fs.unlink(filePath);
    console.log(`[PROCESSOR] Cleaned up temporary file for ${meetingId}`);

  } catch (error) {
    console.error(`[PROCESSOR] Failed to process meeting ${meetingId}:`, error.message);
    await Meeting.findByIdAndUpdate(meetingId, {
      status: 'failed',
      processingError: error.message
    });
  }
}
