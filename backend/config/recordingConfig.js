// Recording Configuration
export const recordingConfig = {
  // DEFAULT BEHAVIOR: Recording only (no bot)
  defaultBehavior: 'recording-only', // Options: 'recording-only', 'bot-only', 'both'
  
  // Default recording method when behavior includes recording
  defaultRecordingMethod: 'browser', // Options: 'browser', 'cloud', 'local', 'api'
  
  // Enable VPS bot joining (set to true to also launch bot)
  enableVpsBot: process.env.ENABLE_VPS_BOT === 'true' || false,
  
  // Recording settings
  recording: {
    // Browser recording settings
    browser: {
      mimeType: 'audio/webm',
      audioBitsPerSecond: 128000,
      maxDuration: 7200000, // 2 hours in ms
    },
    
    // Cloud recording settings (requires Pro account)
    cloud: {
      autoDelete: false,
      deleteAfterDays: 30,
    },
    
    // Transcription settings
    transcription: {
      enabled: true,
      provider: 'openai', // 'openai', 'google', 'browser'
      language: 'en-US',
    }
  },
  
  // Get behavior for a specific meeting
  getBehaviorForMeeting: (meetingId) => {
    // You can customize behavior based on meeting ID patterns
    // For example: certain meetings might need bot joining
    
    // Default: recording only
    return recordingConfig.defaultBehavior;
  },
  
  // Check if bot should join
  shouldBotJoin: (meetingId) => {
    const behavior = recordingConfig.getBehaviorForMeeting(meetingId);
    return behavior === 'bot-only' || behavior === 'both' || recordingConfig.enableVpsBot;
  },
  
  // Check if should record
  shouldRecord: (meetingId) => {
    const behavior = recordingConfig.getBehaviorForMeeting(meetingId);
    return behavior === 'recording-only' || behavior === 'both';
  }
};

export default recordingConfig; 