const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://aizoomai.com';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async verifyToken() {
    return this.request('/api/auth/verify');
  }

  // Bot endpoints
  async startBot(settings) {
    return this.request('/api/bot/start', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  }

  async stopBot() {
    return this.request('/api/bot/stop', {
      method: 'POST'
    });
  }

  async getBotStatus() {
    return this.request('/api/bot/status');
  }

  // Participant bot endpoints
  async sendChatMessage(meetingId, message) {
    return this.request(`/api/bot/chat/${meetingId}`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  async toggleAudio(meetingId, muted) {
    return this.request(`/api/bot/audio/${meetingId}`, {
      method: 'POST',
      body: JSON.stringify({ muted })
    });
  }

  async toggleVideo(meetingId, videoOn) {
    return this.request(`/api/bot/video/${meetingId}`, {
      method: 'POST',
      body: JSON.stringify({ videoOn })
    });
  }

  async getMeetingInfo(meetingId) {
    return this.request(`/api/bot/meeting/${meetingId}`);
  }

  // Meeting endpoints
  async getMeetings() {
    return this.request('/api/meetings');
  }

  async getMeeting(id) {
    return this.request(`/api/meetings/${id}`);
  }

  async uploadRecording(meetingId, file) {
    const formData = new FormData();
    formData.append('recording', file);
    formData.append('meetingId', meetingId);

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${this.baseURL}/api/meetings/upload-recording/${meetingId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }
}

export default new ApiService(); 