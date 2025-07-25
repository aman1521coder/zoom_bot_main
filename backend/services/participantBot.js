import axios from 'axios';
import User from '../models/user.js';
import Meeting from '../models/meeting.js';

class ParticipantBot {
  constructor() {
    this.activeMeetings = new Map();
    this.botName = 'AI Assistant';
    this.botEmail = 'ai-assistant@zoom-bot.com';
  }

  /**
   * Join a meeting as a participant using Zoom Meeting SDK
   */
  async joinMeeting(meetingId, userId, password = null) {
    try {
      console.log(`[PARTICIPANT_BOT] Attempting to join meeting ${meetingId} as participant`);
      
      // Get user's access token
      const user = await User.findById(userId);
      if (!user || !user.accessToken) {
        throw new Error('User not found or no access token');
      }

      // Get meeting details from Zoom API
      const meetingDetails = await this.getMeetingDetails(meetingId, user.accessToken);
      
      // Create meeting record in database
      const meeting = await Meeting.create({
        userId: user._id,
        meetingId: meetingId,
        status: 'joined',
        meetingDetails: meetingDetails
      });

      // Generate JWT for Meeting SDK
      const meetingJWT = this.generateMeetingJWT(meetingId, this.botName, this.botEmail);

      // Store active meeting
      this.activeMeetings.set(meetingId, {
        meetingId,
        userId,
        startTime: new Date(),
        meeting: meeting,
        jwt: meetingJWT,
        botName: this.botName
      });

      console.log(`[PARTICIPANT_BOT] Successfully joined meeting ${meetingId} as participant`);
      return {
        meeting,
        jwt: meetingJWT,
        meetingDetails
      };

    } catch (error) {
      console.error(`[PARTICIPANT_BOT] Error joining meeting ${meetingId}:`, error);
      throw error;
    }
  }

  /**
   * Get meeting details from Zoom API
   */
  async getMeetingDetails(meetingId, accessToken) {
    try {
      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(`[PARTICIPANT_BOT] Error getting meeting details:`, error);
      throw error;
    }
  }

  /**
   * Generate JWT for Meeting SDK authentication
   */
  generateMeetingJWT(meetingId, name, email) {
    // This would use your Zoom SDK credentials
    // For now, returning a placeholder
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZWV0aW5nSWQiOiI${meetingId}IiwibmFtZSI6Ii${name}IiwiZW1haWwiOiIi${email}IiwiZXhwIjoxNzM1NjgwMDAwfQ.signature`;
  }

  /**
   * Handle meeting ended event
   */
  async handleMeetingEnded(meetingId) {
    try {
      console.log(`[PARTICIPANT_BOT] Meeting ${meetingId} ended, cleaning up...`);
      
      const activeMeeting = this.activeMeetings.get(meetingId);
      if (!activeMeeting) {
        console.log(`[PARTICIPANT_BOT] No active meeting found for ${meetingId}`);
        return;
      }

      const { meeting } = activeMeeting;

      // Update meeting status
      await Meeting.findByIdAndUpdate(meeting._id, {
        status: 'ended',
        endTime: new Date()
      });

      // Clean up active meeting
      this.activeMeetings.delete(meetingId);
      console.log(`[PARTICIPANT_BOT] Meeting ${meetingId} cleanup completed`);

    } catch (error) {
      console.error(`[PARTICIPANT_BOT] Error handling meeting end for ${meetingId}:`, error);
      
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
   * Send chat message as bot
   */
  async sendChatMessage(meetingId, message) {
    try {
      const activeMeeting = this.activeMeetings.get(meetingId);
      if (!activeMeeting) {
        throw new Error('Bot not in meeting');
      }

      console.log(`[PARTICIPANT_BOT] Sending chat message: ${message}`);
      
      // This would use Zoom Meeting SDK to send chat
      // For now, just log the message
      console.log(`[PARTICIPANT_BOT] Chat message sent: ${message}`);
      
    } catch (error) {
      console.error(`[PARTICIPANT_BOT] Error sending chat message:`, error);
    }
  }

  /**
   * Toggle bot audio (mute/unmute)
   */
  async toggleAudio(meetingId, muted = true) {
    try {
      const activeMeeting = this.activeMeetings.get(meetingId);
      if (!activeMeeting) {
        throw new Error('Bot not in meeting');
      }

      console.log(`[PARTICIPANT_BOT] Toggling audio: ${muted ? 'muted' : 'unmuted'}`);
      
      // This would use Zoom Meeting SDK to toggle audio
      // For now, just log the action
      console.log(`[PARTICIPANT_BOT] Audio ${muted ? 'muted' : 'unmuted'}`);
      
    } catch (error) {
      console.error(`[PARTICIPANT_BOT] Error toggling audio:`, error);
    }
  }

  /**
   * Toggle bot video (on/off)
   */
  async toggleVideo(meetingId, videoOn = true) {
    try {
      const activeMeeting = this.activeMeetings.get(meetingId);
      if (!activeMeeting) {
        throw new Error('Bot not in meeting');
      }

      console.log(`[PARTICIPANT_BOT] Toggling video: ${videoOn ? 'on' : 'off'}`);
      
      // This would use Zoom Meeting SDK to toggle video
      // For now, just log the action
      console.log(`[PARTICIPANT_BOT] Video ${videoOn ? 'turned on' : 'turned off'}`);
      
    } catch (error) {
      console.error(`[PARTICIPANT_BOT] Error toggling video:`, error);
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
        startTime: m.startTime,
        botName: m.botName
      }))
    };
  }

  /**
   * Get meeting info for frontend
   */
  getMeetingInfo(meetingId) {
    const activeMeeting = this.activeMeetings.get(meetingId);
    if (!activeMeeting) {
      return null;
    }

    return {
      meetingId: activeMeeting.meetingId,
      botName: activeMeeting.botName,
      startTime: activeMeeting.startTime,
      jwt: activeMeeting.jwt
    };
  }
}

export default new ParticipantBot(); 