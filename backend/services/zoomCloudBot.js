import axios from 'axios';
import User from '../models/user.js';
import Meeting from '../models/meeting.js';

class ZoomCloudBot {
  constructor() {
    this.activeMeetings = new Map();
  }

  /**
   * Join a meeting using Zoom API (cloud recording approach)
   * This is much simpler than Puppeteer - we just enable cloud recording
   */
  async joinMeeting(meetingId, userId) {
    try {
      console.log(`[CLOUD_BOT] Attempting to join meeting ${meetingId} for user ${userId}`);
      
      // Get user's access token
      const user = await User.findById(userId);
      if (!user || !user.accessToken) {
        throw new Error('User not found or no access token');
      }

      // Create meeting record in database
      const meeting = await Meeting.create({
        userId: user._id,
        meetingId: meetingId,
        status: 'recording_available'
      });

      // Store active meeting
      this.activeMeetings.set(meetingId, {
        meetingId,
        userId,
        startTime: new Date(),
        meeting: meeting
      });

      console.log(`[CLOUD_BOT] Successfully joined meeting ${meetingId}`);
      return meeting;

    } catch (error) {
      console.error(`[CLOUD_BOT] Error joining meeting ${meetingId}:`, error);
      throw error;
    }
  }

  /**
   * Handle meeting ended event - download recording and transcript
   */
  async handleMeetingEnded(meetingId) {
    try {
      console.log(`[CLOUD_BOT] Meeting ${meetingId} ended, processing recording...`);
      
      const activeMeeting = this.activeMeetings.get(meetingId);
      if (!activeMeeting) {
        console.log(`[CLOUD_BOT] No active meeting found for ${meetingId}`);
        return;
      }

      const { userId, meeting } = activeMeeting;
      const user = await User.findById(userId);
      
      if (!user || !user.accessToken) {
        throw new Error('User not found or no access token');
      }

      // Get meeting recordings from Zoom API
      const recordings = await this.getMeetingRecordings(meetingId, user.accessToken);
      
      if (recordings && recordings.length > 0) {
        // Update meeting with recording info
        await Meeting.findByIdAndUpdate(meeting._id, {
          status: 'processing',
          downloadUrl: recordings[0].download_url
        });

        // Download and process transcript
        await this.processTranscript(meeting._id, recordings[0], user.accessToken);
      }

      // Clean up active meeting
      this.activeMeetings.delete(meetingId);
      console.log(`[CLOUD_BOT] Meeting ${meetingId} processing completed`);

    } catch (error) {
      console.error(`[CLOUD_BOT] Error processing meeting end for ${meetingId}:`, error);
      
      // Update meeting status to failed
      const activeMeeting = this.activeMeetings.get(meetingId);
      if (activeMeeting) {
        await Meeting.findByIdAndUpdate(activeMeeting.meeting._id, {
          status: 'failed',
          processingError: error.message
        });
        this.activeMeetings.delete(meetingId);
      }
    }
  }

  /**
   * Get meeting recordings from Zoom API
   */
  async getMeetingRecordings(meetingId, accessToken) {
    try {
      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.recording_files || [];
    } catch (error) {
      console.error(`[CLOUD_BOT] Error getting recordings for meeting ${meetingId}:`, error);
      return [];
    }
  }

  /**
   * Process transcript from recording
   */
  async processTranscript(meetingId, recording, accessToken) {
    try {
      console.log(`[CLOUD_BOT] Processing transcript for meeting ${meetingId}`);
      
      // Get transcript file if available
      if (recording.recording_type === 'audio_only' || recording.recording_type === 'audio_transcript') {
        const transcriptUrl = await this.getTranscriptUrl(meetingId, recording.id, accessToken);
        
        if (transcriptUrl) {
          // Download transcript
          const transcriptResponse = await axios.get(transcriptUrl);
          const transcript = transcriptResponse.data;
          
          // Update meeting with transcript
          await Meeting.findByIdAndUpdate(meetingId, {
            transcript: transcript,
            status: 'completed'
          });
          
          console.log(`[CLOUD_BOT] Transcript saved for meeting ${meetingId}`);
        }
      }

    } catch (error) {
      console.error(`[CLOUD_BOT] Error processing transcript for meeting ${meetingId}:`, error);
      throw error;
    }
  }

  /**
   * Get transcript download URL
   */
  async getTranscriptUrl(meetingId, recordingId, accessToken) {
    try {
      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}/recordings/${recordingId}/transcript`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.download_url;
    } catch (error) {
      console.error(`[CLOUD_BOT] Error getting transcript URL:`, error);
      return null;
    }
  }

  /**
   * Get bot status
   */
  getStatus() {
    return {
      activeMeetings: this.activeMeetings.size,
      meetings: Array.from(this.activeMeetings.values()).map(m => ({
        meetingId: m.meetingId,
        startTime: m.startTime
      }))
    };
  }
}

export default new ZoomCloudBot(); 