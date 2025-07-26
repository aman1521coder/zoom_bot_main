import axios from 'axios';
import User from '../models/user.js';
import Meeting from '../models/meeting.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AlternativeRecorder {
  constructor() {
    this.activeMeetings = new Map();
    
    // Create recordings directory
    this.recordingsDir = path.join(__dirname, '../recordings');
    if (!fs.existsSync(this.recordingsDir)) {
      fs.mkdirSync(this.recordingsDir, { recursive: true });
    }
  }

  /**
   * Try different recording methods based on account capabilities
   */
  async startRecording(meetingId, userId) {
    try {
      console.log(`[ALTERNATIVE_RECORDER] Starting recording for meeting ${meetingId}`);
      
      const user = await User.findById(userId);
      if (!user || !user.accessToken) {
        throw new Error('User not found or no access token');
      }

      // Method 1: Try cloud recording first
      try {
        const cloudResponse = await axios.patch(
          `https://api.zoom.us/v2/meetings/${meetingId}`,
          {
            settings: {
              auto_recording: "cloud"
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log(`[ALTERNATIVE_RECORDER] ✅ Cloud recording enabled for meeting ${meetingId}`);
        return await this.saveMeetingRecord(meetingId, userId, 'cloud', cloudResponse.data);
        
      } catch (cloudError) {
        console.log(`[ALTERNATIVE_RECORDER] Cloud recording failed: ${cloudError.response?.data?.message || cloudError.message}`);
        
        // Method 2: Try local recording
        try {
          const localResponse = await axios.patch(
            `https://api.zoom.us/v2/meetings/${meetingId}`,
            {
              settings: {
                auto_recording: "local"
              }
            },
            {
              headers: {
                'Authorization': `Bearer ${user.accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log(`[ALTERNATIVE_RECORDER] ✅ Local recording enabled for meeting ${meetingId}`);
          return await this.saveMeetingRecord(meetingId, userId, 'local', localResponse.data);
          
        } catch (localError) {
          console.log(`[ALTERNATIVE_RECORDER] Local recording failed: ${localError.response?.data?.message || localError.message}`);
          
          // Method 3: Just track the meeting without recording
          console.log(`[ALTERNATIVE_RECORDER] ⚠️ No recording available, tracking meeting only`);
          return await this.saveMeetingRecord(meetingId, userId, 'tracking', null);
        }
      }

    } catch (error) {
      console.error(`[ALTERNATIVE_RECORDER] Error starting recording:`, error.response?.data || error.message);
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
      message: recordingType === 'tracking' 
        ? 'Meeting tracked (no recording available)' 
        : `${recordingType} recording enabled`
    };
  }

  /**
   * Stop recording a meeting
   */
  async stopRecording(meetingId, userId) {
    try {
      console.log(`[ALTERNATIVE_RECORDER] Stopping recording for meeting ${meetingId}`);
      
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

      console.log(`[ALTERNATIVE_RECORDER] ✅ Recording stopped for meeting ${meetingId}`);
      return { success: true };

    } catch (error) {
      console.error(`[ALTERNATIVE_RECORDER] Error stopping recording:`, error.message);
      throw error;
    }
  }

  /**
   * Get meeting information and available recordings
   */
  async getMeetingInfo(meetingId, userId) {
    try {
      console.log(`[ALTERNATIVE_RECORDER] Getting meeting info for ${meetingId}`);
      
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
      
      // Check if recordings are available
      let recordings = null;
      try {
        const recordingsResponse = await axios.get(
          `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
          {
            headers: {
              'Authorization': `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        recordings = recordingsResponse.data;
      } catch (recordingError) {
        console.log(`[ALTERNATIVE_RECORDER] No recordings available: ${recordingError.response?.data?.message || recordingError.message}`);
      }

      return {
        success: true,
        meeting: meetingInfo,
        recordings: recordings,
        hasRecordings: recordings && recordings.recording_files && recordings.recording_files.length > 0
      };

    } catch (error) {
      console.error(`[ALTERNATIVE_RECORDER] Error getting meeting info:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * List all recorded meetings with their recording types
   */
  async listRecordings() {
    try {
      const meetings = await Meeting.find({ status: { $in: ['completed', 'recording', 'ended'] } })
        .sort({ startTime: -1 });
      
      return meetings.map(meeting => ({
        ...meeting.toObject(),
        recordingType: meeting.recordingType || 'unknown'
      }));
    } catch (error) {
      console.error('[ALTERNATIVE_RECORDER] Error listing recordings:', error);
      throw error;
    }
  }

  /**
   * Get active recordings
   */
  getActiveRecordings() {
    return Array.from(this.activeMeetings.values());
  }

  /**
   * Check account recording capabilities
   */
  async checkRecordingCapabilities(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.accessToken) {
        throw new Error('User not found or no access token');
      }

      // Get user's account info
      const accountResponse = await axios.get(
        'https://api.zoom.us/v2/users/me',
        {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const accountInfo = accountResponse.data;
      
      return {
        success: true,
        account: accountInfo,
        hasCloudRecording: accountInfo.account_id && accountInfo.type >= 2, // Pro accounts and above
        accountType: accountInfo.type,
        accountName: accountInfo.account_name
      };

    } catch (error) {
      console.error('[ALTERNATIVE_RECORDER] Error checking capabilities:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new AlternativeRecorder(); 