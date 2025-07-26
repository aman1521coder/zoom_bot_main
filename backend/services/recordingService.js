import fetch from 'node-fetch';
import Meeting from '../models/meeting.js';
import User from '../models/user.js';
import transcriptionService from './transcriptionService.js';

class RecordingService {
  constructor() {
    this.recordingMethods = {
      'cloud': this.useZoomCloudRecording.bind(this),
      'local': this.useLocalRecording.bind(this),
      'browser': this.useBrowserRecording.bind(this),
      'api': this.useZoomRecordingAPI.bind(this),
      'vps_bot': this.useVPSBotRecording.bind(this),
      'auto_browser': this.useAutoBrowserRecording.bind(this)
    };
  }

  /**
   * Start recording using the best available method
   */
  async startRecording(meetingId, userId, method = 'auto') {
    console.log(`[RECORDING] Starting recording for meeting ${meetingId} using method: ${method}`);
    
    try {
      // Create meeting record if it doesn't exist
      await Meeting.findOneAndUpdate(
        { meetingId },
        { 
          $setOnInsert: {
            userId,
            meetingId,
            status: 'recording',
            startTime: new Date(),
            topic: 'Recording Started'
          }
        },
        { upsert: true }
      );

      // Auto-select method based on availability
      if (method === 'auto') {
        method = await this.selectBestMethod(meetingId);
      }

      // Use the selected recording method
      const recordingMethod = this.recordingMethods[method];
      if (!recordingMethod) {
        throw new Error(`Unknown recording method: ${method}`);
      }

      const result = await recordingMethod(meetingId, userId);
      
      // Update meeting record
      await Meeting.findOneAndUpdate(
        { meetingId },
        { 
          status: 'recording',
          recordingMethod: method,
          recordingStartTime: new Date()
        }
      );

      return {
        success: true,
        method,
        ...result
      };

    } catch (error) {
      console.error(`[RECORDING] Error starting recording:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Method 1: Use Zoom Cloud Recording (requires Pro account)
   */
  async useZoomCloudRecording(meetingId, userId) {
    console.log('[RECORDING] Using Zoom Cloud Recording');
    
    const accessToken = await this.getZoomAccessToken(userId);
    
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'start'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cloud recording failed: ${error}`);
    }

    return {
      recordingType: 'cloud',
      message: 'Cloud recording started'
    };
  }

  /**
   * Method 2: Use Local Recording via Bot
   */
  async useLocalRecording(meetingId, userId) {
    console.log('[RECORDING] Using Local Recording via Bot');
    
    // This would trigger the bot to start local recording
    // The bot.html would handle the actual recording
    return {
      recordingType: 'local',
      message: 'Local recording initiated'
    };
  }

  /**
   * Method 3: Use Browser-based Recording
   */
  async useBrowserRecording(meetingId, userId) {
    console.log('[RECORDING] Using Browser-based Recording');
    
    // Update meeting to indicate browser recording is active
    await Meeting.findOneAndUpdate(
      { meetingId },
      { 
        recordingMethod: 'browser',
        status: 'recording',
        recordingStartTime: new Date()
      }
    );
    
    // This returns instructions for the frontend to start recording
    return {
      recordingType: 'browser',
      message: 'Browser recording ready - user must click record in frontend',
      instructions: {
        method: 'MediaRecorder',
        mimeType: 'audio/webm',
        uploadEndpoint: 'https://blackkbingo.com/api/transcription/upload'
      }
    };
  }

  /**
   * Method 4: Use Zoom Recording API to download existing recordings
   */
  async useZoomRecordingAPI(meetingId, userId) {
    console.log('[RECORDING] Using Zoom Recording API');
    
    const accessToken = await this.getZoomAccessToken(userId);
    
    // Get recording list
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recordings');
    }

    const data = await response.json();
    
    if (data.recording_files && data.recording_files.length > 0) {
      // Download and process recordings
      const recordings = await this.downloadRecordings(data.recording_files, meetingId);
      return {
        recordingType: 'api',
        recordings
      };
    }

    throw new Error('No recordings available');
  }

  /**
   * Method 5: Use VPS Bot Recording (automatic recording via bot)
   */
  async useVPSBotRecording(meetingId, userId) {
    console.log('[RECORDING] Using VPS Bot for automatic recording');
    
    // The VPS bot will automatically record when it joins
    // This method just tracks the recording status
    return {
      recordingType: 'vps_bot',
      message: 'VPS bot will automatically record when it joins the meeting',
      autoRecord: true
    };
  }

  /**
   * Method 6: Automatic Browser Recording (starts recording immediately)
   */
  async useAutoBrowserRecording(meetingId, userId) {
    console.log('[RECORDING] Using Automatic Browser Recording');
    
    // Create a meeting record with recording status
    await Meeting.findOneAndUpdate(
      { meetingId },
      { 
        recordingMethod: 'auto_browser',
        status: 'recording',
        recordingStartTime: new Date(),
        autoRecording: true
      },
      { upsert: true }
    );
    
    // This tells the system that recording should start automatically
    // The actual recording happens in the user's browser when they join
    return {
      recordingType: 'auto_browser',
      message: 'Recording will start automatically when you join the meeting',
      instructions: {
        method: 'AutoMediaRecorder',
        autoStart: true,
        uploadEndpoint: 'https://blackkbingo.com/api/transcription/upload'
      }
    };
  }

  /**
   * Stop recording
   */
  async stopRecording(meetingId, method) {
    console.log(`[RECORDING] Stopping recording for meeting ${meetingId}`);
    
    try {
      const meeting = await Meeting.findOne({ meetingId });
      if (!meeting) {
        console.log(`[RECORDING] Meeting ${meetingId} not found, creating placeholder`);
        // Create a placeholder meeting record
        await Meeting.create({
          meetingId,
          status: 'ended',
          endTime: new Date(),
          recordingMethod: 'none'
        });
        return { success: true, message: 'Meeting ended (no recording)' };
      }

      // Handle different recording methods
      switch (method || meeting.recordingMethod) {
        case 'cloud':
          await this.stopCloudRecording(meetingId, meeting.userId);
          break;
        case 'local':
        case 'browser':
          // These are handled by the client
          break;
      }

      // Update meeting status
      const updatedMeeting = await Meeting.findOneAndUpdate(
        { meetingId },
        { 
          status: 'completed',
          endTime: new Date(),
          recordingEndTime: new Date()
        },
        { new: true }
      );

      // Calculate duration if we have start time
      if (updatedMeeting && updatedMeeting.startTime) {
        const duration = Math.floor((updatedMeeting.endTime - updatedMeeting.startTime) / 1000);
        await Meeting.updateOne({ meetingId }, { duration });
      }

      console.log(`[RECORDING] Meeting ${meetingId} marked as completed`);
      return { success: true };

    } catch (error) {
      console.error(`[RECORDING] Error stopping recording:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process recording after meeting ends
   */
  async processRecording(meetingId, recordingData) {
    console.log(`[RECORDING] Processing recording for meeting ${meetingId}`);
    
    try {
      const meeting = await Meeting.findOne({ meetingId });
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // If we have audio data, transcribe it
      if (recordingData.audioPath) {
        const transcriptionResult = await transcriptionService.processRecording(
          meetingId, 
          recordingData.audioPath
        );

        if (transcriptionResult) {
          // Generate summary
          const summaryResult = await transcriptionService.generateSummary(
            transcriptionResult.transcription
          );

          // Update meeting with results
          await Meeting.findOneAndUpdate(
            { meetingId },
            {
              status: 'completed',
              recordingUrl: recordingData.audioPath,
              transcriptUrl: transcriptionResult.transcriptPath,
              transcription: transcriptionResult.transcription,
              summary: summaryResult.summary || '',
              duration: transcriptionResult.duration || 0,
              wordCount: transcriptionResult.wordCount
            }
          );

          return {
            success: true,
            transcription: transcriptionResult.transcription,
            summary: summaryResult.summary
          };
        }
      }

      return { success: false, error: 'No audio data to process' };

    } catch (error) {
      console.error(`[RECORDING] Error processing recording:`, error);
      
      await Meeting.findOneAndUpdate(
        { meetingId },
        {
          status: 'failed',
          processingError: error.message
        }
      );

      return { success: false, error: error.message };
    }
  }

  /**
   * Helper: Select best recording method
   */
  async selectBestMethod(meetingId) {
    // Check if cloud recording is available
    try {
      const meeting = await Meeting.findOne({ meetingId });
      if (meeting && meeting.userId) {
        const user = await User.findById(meeting.userId);
        if (user && user.zoomAccountType === 'pro') {
          return 'cloud';
        }
      }
    } catch (error) {
      console.log('[RECORDING] Could not check account type');
    }

    // Default to browser recording
    return 'browser';
  }

  /**
   * Helper: Get Zoom access token
   */
  async getZoomAccessToken(userId) {
    // This would get the user's stored Zoom access token
    // For now, return a placeholder
    return process.env.ZOOM_ACCESS_TOKEN || '';
  }

  /**
   * Helper: Stop cloud recording
   */
  async stopCloudRecording(meetingId, userId) {
    const accessToken = await this.getZoomAccessToken(userId);
    
    await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'stop'
      })
    });
  }

  /**
   * Helper: Download recordings from Zoom
   */
  async downloadRecordings(recordingFiles, meetingId) {
    const downloads = [];
    
    for (const file of recordingFiles) {
      if (file.file_type === 'MP4' || file.file_type === 'M4A') {
        downloads.push({
          type: file.file_type,
          url: file.download_url,
          size: file.file_size
        });
      }
    }

    return downloads;
  }
}

export default new RecordingService(); 