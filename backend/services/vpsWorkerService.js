import axios from 'axios';
import { generateSdkSignature } from './zoomSignature.js';
import User from '../models/user.js';
import Meeting from '../models/meeting.js';

class VPSWorkerService {
  constructor() {
    this.vpsBaseUrl = process.env.VPS_WORKER_URL || 'http://147.93.119.85:3000';
    this.apiSecret = process.env.VPS_WORKER_SECRET || '1234';
    this.activeMeetings = new Map();
  }

  /**
   * Send meeting to VPS worker for bot joining
   */
  async launchBotForMeeting(meetingId, password, userId) {
    try {
      console.log(`[VPS_WORKER] 🚀 Launching bot for meeting: ${meetingId}`);
      
      // Get user for access token
      const user = await User.findById(userId);
      if (!user || !user.accessToken) {
        throw new Error('User not found or no access token');
      }

      // Generate JWT signature for the meeting
      const signature = generateSdkSignature(meetingId, 0); // 0 = participant role

      // Send request to VPS worker
      const response = await axios.post(`${this.vpsBaseUrl}/launch-bot`, {
        meetingId: meetingId,
        password: password || '',
        userId: userId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-secret': this.apiSecret
        },
        timeout: 10000 // 10 second timeout
      });

      if (response.status === 202) {
        console.log(`[VPS_WORKER] ✅ Bot launch signal sent for meeting ${meetingId}`);
        
        // Save meeting record
        await this.saveMeetingRecord(meetingId, userId, 'vps_bot');
        
        return {
          success: true,
          message: 'Bot launch signal sent to VPS worker',
          meetingId: meetingId
        };
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

    } catch (error) {
      console.error(`[VPS_WORKER] ❌ Error launching bot for meeting ${meetingId}:`, error.message);
      
      // Fallback to cloud recording if VPS worker fails
      console.log(`[VPS_WORKER] 🔄 Falling back to cloud recording for meeting ${meetingId}`);
      return await this.fallbackToCloudRecording(meetingId, userId);
    }
  }

  /**
   * Fallback to cloud recording if VPS worker fails
   */
  async fallbackToCloudRecording(meetingId, userId) {
    try {
      console.log(`[VPS_WORKER] 🔄 Attempting cloud recording fallback for meeting ${meetingId}`);
      
      const user = await User.findById(userId);
      if (!user || !user.accessToken) {
        throw new Error('User not found or no access token');
      }

      // Try to enable cloud recording
      const axios = await import('axios');
      const response = await axios.default.patch(
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

      console.log(`[VPS_WORKER] ✅ Cloud recording enabled as fallback for meeting ${meetingId}`);
      
      // Save meeting record
      await this.saveMeetingRecord(meetingId, userId, 'cloud_fallback');
      
      return {
        success: true,
        message: 'Cloud recording enabled as fallback',
        meetingId: meetingId,
        recordingType: 'cloud_fallback'
      };

    } catch (error) {
      console.error(`[VPS_WORKER] ❌ Cloud recording fallback failed for meeting ${meetingId}:`, error.message);
      
      // Last resort: just track the meeting
      await this.saveMeetingRecord(meetingId, userId, 'tracking_only');
      
      return {
        success: true,
        message: 'Meeting tracked (no recording available)',
        meetingId: meetingId,
        recordingType: 'tracking_only'
      };
    }
  }

  /**
   * Save meeting record to database
   */
  async saveMeetingRecord(meetingId, userId, recordingType) {
    const meeting = await Meeting.findOneAndUpdate(
      { meetingId: meetingId },
      {
        userId: userId,
        meetingId: meetingId,
        status: 'active',
        recordingType: recordingType,
        startTime: new Date()
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

    return meeting;
  }

  /**
   * Handle meeting end and cleanup
   */
  async handleMeetingEnd(meetingId, userId) {
    try {
      console.log(`[VPS_WORKER] 📥 Handling meeting end for ${meetingId}`);
      
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

      return {
        success: true,
        message: 'Meeting end handled successfully'
      };

    } catch (error) {
      console.error(`[VPS_WORKER] ❌ Error handling meeting end for ${meetingId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get active meetings
   */
  getActiveMeetings() {
    return Array.from(this.activeMeetings.values());
  }

  /**
   * Check VPS worker health
   */
  async checkWorkerHealth() {
    try {
      const response = await axios.get(`${this.vpsBaseUrl}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error(`[VPS_WORKER] ❌ Worker health check failed:`, error.message);
      return false;
    }
  }
}

export default new VPSWorkerService(); 