// API Configuration
export const apiConfig = {
  // Production API URL
  baseURL: 'https://blackkbingo.com',
  
  // API endpoints
  endpoints: {
    // Auth
    login: '/api/auth/login',
    verify: '/api/auth/verify',
    zoomAuth: '/api/auth/zoom',
    
    // Meetings
    meetings: '/api/meetings',
    
    // Recording
    recordingStart: '/api/recording/start',
    recordingStop: '/api/recording/stop',
    recordingJoinOnly: '/api/recording/join-only',
    recordingJoinAndRecord: '/api/recording/join-and-record',
    recordingStatus: '/api/recording/status',
    
    // Transcription
    transcriptionUpload: '/api/transcription/upload',
    transcriptionSummarize: '/api/transcription/summarize',
    
    // Bot
    botStart: '/api/bot/start',
    botStop: '/api/bot/stop',
    botStatus: '/api/bot/status',
  }
};

export default apiConfig; 