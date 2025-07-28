import crypto from 'crypto';
import fetch from 'node-fetch';
import User from '../models/user.js';
import Meeting from '../models/meeting.js';

class AutoMeetingJoiner {
  constructor() {
    this.ZOOM_CLIENT_ID = process.env.ZOOM_SDK_CLIENT_ID || process.env.ZOOM_CLIENT_ID;
    this.ZOOM_CLIENT_SECRET = process.env.ZOOM_SDK_CLIENT_SECRET || process.env.ZOOM_CLIENT_SECRET;
    this.activeBots = new Map(); // Track active bot sessions
    
    // Validate environment variables
    console.log('[AUTO_JOINER] Initializing with credentials:');
    console.log('[AUTO_JOINER] Client ID:', this.ZOOM_CLIENT_ID ? 'SET' : 'MISSING');
    console.log('[AUTO_JOINER] Client Secret:', this.ZOOM_CLIENT_SECRET ? 'SET' : 'MISSING');
    
    if (!this.ZOOM_CLIENT_ID || !this.ZOOM_CLIENT_SECRET) {
      console.error('[AUTO_JOINER] ❌ Missing Zoom SDK credentials!');
      console.error('[AUTO_JOINER] Required environment variables:');
      console.error('[AUTO_JOINER] - ZOOM_SDK_CLIENT_ID or ZOOM_CLIENT_ID');
      console.error('[AUTO_JOINER] - ZOOM_SDK_CLIENT_SECRET or ZOOM_CLIENT_SECRET');
    }
  }

  /**
   * Generate Meeting SDK signature for server-side joining
   */
  generateMeetingSignature(meetingNumber, role = 1) {
    // Validate credentials before generating signature
    if (!this.ZOOM_CLIENT_ID || !this.ZOOM_CLIENT_SECRET) {
      throw new Error('Missing Zoom SDK credentials. Please set ZOOM_SDK_CLIENT_ID and ZOOM_SDK_CLIENT_SECRET environment variables.');
    }
    
    const timestamp = new Date().getTime() - 30000;
    const msg = Buffer.from(`${this.ZOOM_CLIENT_ID}${meetingNumber}${timestamp}${role}`).toString('base64');
    const hash = crypto.createHmac('sha256', this.ZOOM_CLIENT_SECRET).update(msg).digest('base64');
    const signature = Buffer.from(`${this.ZOOM_CLIENT_ID}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');
    return signature;
  }

  /**
   * Automatically join meeting when webhook is received
   */
  async handleMeetingStarted(meetingId, hostId, meetingTopic, password = '') {
    try {
      console.log(`[AUTO_JOINER] 🚀 Meeting started webhook received for ${meetingId}`);
      
      // Check if credentials are available
      if (!this.ZOOM_CLIENT_ID || !this.ZOOM_CLIENT_SECRET) {
        console.error(`[AUTO_JOINER] ❌ Missing Zoom SDK credentials - cannot join meeting ${meetingId}`);
        return { 
          success: false, 
          error: 'Missing Zoom SDK credentials. Please configure ZOOM_SDK_CLIENT_ID and ZOOM_SDK_CLIENT_SECRET.' 
        };
      }
      
      // Find user by Zoom ID
      const user = await User.findOne({ zoomId: hostId });
      if (!user) {
        console.log(`[AUTO_JOINER] ❌ No user found for Zoom ID: ${hostId}`);
        return { success: false, error: 'User not found' };
      }

      // Check user's recording settings
      const userSettings = user.recordingSettings || {
        behavior: 'recording-only',
        autoRecord: true
      };

      if (!userSettings.autoRecord) {
        console.log(`[AUTO_JOINER] ⏭️ Auto-record disabled for user ${user.email}`);
        return { success: false, error: 'Auto-record disabled' };
      }

      console.log(`[AUTO_JOINER] 🤖 Auto-joining meeting: ${meetingTopic} (${meetingId})`);

      // Create/update meeting record
      await Meeting.findOneAndUpdate(
        { meetingId },
        { 
          $setOnInsert: {
            meetingId,
            userId: user._id,
            topic: meetingTopic || 'Untitled Meeting',
            hostId,
            startTime: new Date(),
            status: 'joining'
          }
        },
        { upsert: true }
      );

      // Join meeting and start recording
      const joinResult = await this.joinMeetingAndRecord(meetingId, user, password);
      
      if (joinResult.success) {
        console.log(`[AUTO_JOINER] ✅ Successfully joined and started recording for ${meetingId}`);
        
        // Update meeting status
        await Meeting.findOneAndUpdate(
          { meetingId },
          { 
            status: 'recording',
            recordingStartTime: new Date()
          }
        );
      } else {
        console.log(`[AUTO_JOINER] ❌ Failed to join meeting ${meetingId}: ${joinResult.error}`);
        
        // Update meeting status
        await Meeting.findOneAndUpdate(
          { meetingId },
          { 
            status: 'failed',
            processingError: joinResult.error
          }
        );
      }

      return joinResult;

    } catch (error) {
      console.error(`[AUTO_JOINER] Error handling meeting start:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Join meeting and start cloud recording
   */
  async joinMeetingAndRecord(meetingId, user, password = '') {
    try {
      console.log(`[AUTO_JOINER] 🔗 Joining meeting ${meetingId} for user ${user.email}`);

      // Generate join signature
      const signature = this.generateMeetingSignature(meetingId, 1); // Role 1 = host/co-host

      // Start cloud recording immediately (as host)
      const recordingResult = await this.startCloudRecording(meetingId, user.zoomAccessToken);
      
      if (recordingResult.success) {
        console.log(`[AUTO_JOINER] ✅ Cloud recording started for meeting ${meetingId}`);
        
        // Track this active bot session
        this.activeBots.set(meetingId, {
          userId: user._id,
          startTime: new Date(),
          recordingActive: true
        });

        return {
          success: true,
          recordingStarted: true,
          method: 'cloud_recording',
          signature // Return signature in case frontend needs it
        };
      } else {
        console.error(`[AUTO_JOINER] ❌ Failed to start recording: ${recordingResult.error}`);
        return {
          success: false,
          error: `Recording failed: ${recordingResult.error}`
        };
      }

    } catch (error) {
      console.error(`[AUTO_JOINER] Error joining meeting:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start cloud recording via Zoom API
   */
  async startCloudRecording(meetingId, accessToken) {
    try {
      if (!accessToken) {
        return { success: false, error: 'No access token available' };
      }

      console.log(`[AUTO_JOINER] 📹 Starting cloud recording for meeting ${meetingId}`);

      // Start cloud recording via Zoom API
      const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'start',
          auto_recording: 'cloud',
          auto_delete_cmr: false
        })
      });

      if (response.ok) {
        console.log(`[AUTO_JOINER] ✅ Cloud recording started successfully`);
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error(`[AUTO_JOINER] Recording API error: ${response.status} - ${errorText}`);
        
        // Try alternative approach - join as participant first, then start recording
        if (response.status === 404) {
          console.log(`[AUTO_JOINER] 🔄 Meeting not found, will try when meeting is active`);
          return { success: false, error: 'Meeting not yet active' };
        }
        
        return { success: false, error: `API error: ${response.status}` };
      }

    } catch (error) {
      console.error(`[AUTO_JOINER] Error starting recording:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle meeting ended webhook
   */
  async handleMeetingEnded(meetingId, hostId) {
    try {
      console.log(`[AUTO_JOINER] 🔚 Meeting ended: ${meetingId}`);

      // Stop recording and cleanup
      const user = await User.findOne({ zoomId: hostId });
      if (user && user.zoomAccessToken) {
        await this.stopCloudRecording(meetingId, user.zoomAccessToken);
      }

      // Remove from active bots
      this.activeBots.delete(meetingId);

      // Update meeting record
      await Meeting.findOneAndUpdate(
        { meetingId },
        { 
          status: 'completed',
          recordingEndTime: new Date()
        }
      );

      console.log(`[AUTO_JOINER] ✅ Meeting cleanup completed for ${meetingId}`);
      return { success: true };

    } catch (error) {
      console.error(`[AUTO_JOINER] Error handling meeting end:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop cloud recording
   */
  async stopCloudRecording(meetingId, accessToken) {
    try {
      console.log(`[AUTO_JOINER] ⏹️ Stopping cloud recording for meeting ${meetingId}`);

      const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'stop'
        })
      });

      if (response.ok) {
        console.log(`[AUTO_JOINER] ✅ Recording stopped successfully`);
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error(`[AUTO_JOINER] Stop recording error: ${response.status} - ${errorText}`);
        return { success: false, error: `API error: ${response.status}` };
      }

    } catch (error) {
      console.error(`[AUTO_JOINER] Error stopping recording:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active bot sessions
   */
  getActiveBots() {
    return Array.from(this.activeBots.entries()).map(([meetingId, data]) => ({
      meetingId,
      ...data
    }));
  }

  /**
   * Check if bot is active for a meeting
   */
  isBotActive(meetingId) {
    return this.activeBots.has(meetingId);
  }
}

export default new AutoMeetingJoiner(); 