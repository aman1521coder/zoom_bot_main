import axios from 'axios';
import User from '../models/user.js';
import Meeting from '../models/meeting.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SimpleRecorder {
  constructor() {
    this.activeMeetings = new Map();
    
    // Create recordings directory
    this.recordingsDir = path.join(__dirname, '../recordings');
    if (!fs.existsSync(this.recordingsDir)) {
      fs.mkdirSync(this.recordingsDir, { recursive: true });
    }
  }

  /**
   * Start voice recording and transcription for a meeting with fallback options
   */
  async startRecording(meetingId, userId) {
    try {
      console.log(`[RECORDER] Starting voice recording and transcription for meeting ${meetingId}`);
      
      // Get user's access token
      const user = await User.findById(userId);
      if (!user || !user.accessToken) {
        throw new Error('User not found or no access token');
      }

      // Method 1: Try local recording first
      try {
        const localResponse = await axios.patch(
          `https://api.zoom.us/v2/meetings/${meetingId}`,
          {
            settings: {
              auto_recording: "local",
              audio_type: "both"
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`[RECORDER] ✅ Local recording enabled for meeting ${meetingId}`);
        return await this.saveMeetingRecord(meetingId, userId, 'local', localResponse.data);
        
      } catch (localError) {
        console.log(`[RECORDER] Local recording failed: ${localError.response && localError.response.data ? localError.response.data.message : localError.message}`);
        
        // Method 2: Try manual recording (host can start manually)
        try {
          const manualResponse = await axios.patch(
            `https://api.zoom.us/v2/meetings/${meetingId}`,
            {
              settings: {
                auto_recording: "none",
                audio_type: "both",
                allow_multiple_devices: true,
                host_video: true,
                participant_video: true,
                audio: "both"
              }
            },
            {
              headers: {
                'Authorization': `Bearer ${user.accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`[RECORDER] ⚠️ Manual recording mode enabled for meeting ${meetingId}`);
          console.log(`[RECORDER] 💡 Host can start recording manually in the meeting`);
          return await this.saveMeetingRecord(meetingId, userId, 'manual', manualResponse.data);
          
        } catch (manualError) {
          console.log(`[RECORDER] Manual recording setup failed: ${manualError.response && manualError.response.data ? manualError.response.data.message : manualError.message}`);
          
          // Method 3: Just track the meeting
          console.log(`[RECORDER] ⚠️ No recording available, tracking meeting only`);
          return await this.saveMeetingRecord(meetingId, userId, 'tracking', null);
        }
      }

    } catch (error) {
      console.error(`[RECORDER] Error starting voice recording:`, error.response && error.response.data ? error.response.data : error.message);
      throw error;
    }
  }

  /**
   * Save meeting record to database
   */
  async saveMeetingRecord(meetingId, userId, recordingType, meetingData) {
    const meeting = await Meeting.findOneAndUpdate(
      { meetingId: meetingId },
      {
        userId: userId,
        meetingId: meetingId,
        status: 'recording',
        recordingType: recordingType,
        startTime: new Date(),
        meetingData: meetingData
      },
      { upsert: true, new: true }
    );

    // Track active meeting
    this.activeMeetings.set(meetingId, {
      meetingId,
      userId,
      recordingType,
      startTime: new Date(),
      meeting: meeting
    });

    return { 
      success: true, 
      meeting,
      recordingType,
      message: recordingType === 'local'
        ? 'Local recording enabled (files saved on host computer)'
        : recordingType === 'manual'
        ? 'Manual recording mode - host can start recording in meeting'
        : recordingType === 'tracking'
        ? 'Meeting tracked (no recording available)'
        : `${recordingType} recording enabled`
    };
  }

  /**
   * Stop recording a meeting
   */
  async stopRecording(meetingId, userId) {
    try {
      console.log(`[RECORDER] Stopping recording for meeting ${meetingId}`);
      
      const user = await User.findById(userId);
      if (!user || !user.accessToken) {
        throw new Error('User not found or no access token');
      }

      // Update meeting status
      await Meeting.findOneAndUpdate(
        { meetingId: meetingId },
        { 
          status: 'ended',
          endTime: new Date()
        }
      );

      // Remove from active meetings
      this.activeMeetings.delete(meetingId);

      console.log(`[RECORDER] ✅ Recording stopped for meeting ${meetingId}`);
      return { success: true };

    } catch (error) {
      console.error(`[RECORDER] Error stopping recording:`, error.message);
      throw error;
    }
  }

  /**
   * Get meeting recording status and instructions
   */
  async getRecordingStatus(meetingId, userId) {
    try {
      console.log(`[RECORDER] Getting recording status for meeting ${meetingId}`);
      
      const user = await User.findById(userId);
      if (!user || !user.accessToken) {
        throw new Error('User not found or no access token');
      }

      // Get meeting details
      const meetingResponse = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const meetingInfo = meetingResponse.data;
      const recordingType = meetingInfo.settings && meetingInfo.settings.auto_recording ? meetingInfo.settings.auto_recording : 'none';
      
      let status = {
        meetingId: meetingId,
        recordingType: recordingType,
        hasRecording: false,
        instructions: ''
      };

      if (recordingType === 'local') {
        status.hasRecording = true;
        status.instructions = 'Local recording enabled. Files will be saved on your computer.';
      } else if (recordingType === 'manual') {
        status.instructions = 'Manual recording mode. Click "Record" button in the meeting to start recording.';
      } else {
        status.instructions = 'No automatic recording. You can start recording manually in the meeting.';
      }

      return {
        success: true,
        status: status,
        meeting: meetingInfo
      };

    } catch (error) {
      console.error(`[RECORDER] Error getting recording status:`, error.response && error.response.data ? error.response.data : error.message);
      throw error;
    }
  }

  /**
   * Get file extension based on file type
   */
  getFileExtension(fileType) {
    const extensions = {
      'MP4': 'mp4',
      'M4A': 'm4a', 
      'TRANSCRIPT': 'txt',
      'CHAT': 'txt',
      'CC': 'txt'
    };
    return extensions[fileType] || 'bin';
  }

  /**
   * List all recorded meetings
   */
  async listRecordings() {
    try {
      const meetings = await Meeting.find({ status: { $in: ['completed', 'recording'] } })
        .sort({ startTime: -1 });
      return meetings;
    } catch (error) {
      console.error('[RECORDER] Error listing recordings:', error);
      throw error;
    }
  }

  /**
   * Get active recordings
   */
  getActiveRecordings() {
    return Array.from(this.activeMeetings.values());
  }
}

export default new SimpleRecorder(); 