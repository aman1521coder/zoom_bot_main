import { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Settings, 
  LogOut,
  Clock,
  Calendar,
  Users,
  FileText,
  Zap,
  Shield
} from 'lucide-react';
import api from '../services/api.js';

export default function BotDashboard({ user, onLogout }) {
  const [botStatus, setBotStatus] = useState('idle'); // idle, active, error
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [botSettings, setBotSettings] = useState({
    autoJoin: true,
    audioEnabled: true,
    videoEnabled: false,
    chatEnabled: true
  });

  useEffect(() => {
    fetchMeetings();
    const interval = setInterval(fetchMeetings, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMeetings = async () => {
    try {
      const data = await api.getMeetings();
      // Ensure data is an array
      setMeetings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
      setMeetings([]); // Set empty array on error
    }
  };

  const startBot = async () => {
    setLoading(true);
    try {
      await api.startBot(botSettings);
      setBotStatus('active');
    } catch (error) {
      setBotStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const stopBot = async () => {
    setLoading(true);
    try {
      await api.stopBot();
      setBotStatus('idle');
    } catch (error) {
      console.error('Failed to stop bot:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Zoom AI Bot</h1>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(botStatus)}`}>
                {getStatusIcon(botStatus)} {botStatus.charAt(0).toUpperCase() + botStatus.slice(1)}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name || user?.email}</span>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bot Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">AI Bot Status</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(botStatus)}`}>
              {getStatusIcon(botStatus)} {botStatus.charAt(0).toUpperCase() + botStatus.slice(1)}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Your AI Bot is Ready!</h3>
                <p className="text-blue-700 text-sm">
                  Your AI bot will automatically join meetings as a participant when you start them. 
                  The bot can send chat messages, toggle audio/video, and more!
                </p>
              </div>
            </div>
          </div>

          {/* Bot Controls */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Bot Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mic className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Audio</span>
                </div>
                <button
                  onClick={() => setBotSettings(prev => ({ ...prev, audioEnabled: !prev.audioEnabled }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    botSettings.audioEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {botSettings.audioEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Video className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Video</span>
                </div>
                <button
                  onClick={() => setBotSettings(prev => ({ ...prev, videoEnabled: !prev.videoEnabled }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    botSettings.videoEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {botSettings.videoEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Chat</span>
                </div>
                <button
                  onClick={() => setBotSettings(prev => ({ ...prev, chatEnabled: !prev.chatEnabled }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    botSettings.chatEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {botSettings.chatEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Mic className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Auto Join</h4>
              <p className="text-sm text-gray-600">Joins meetings automatically</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Cloud Recording</h4>
              <p className="text-sm text-gray-600">Records using Zoom cloud</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900">Secure</h4>
              <p className="text-sm text-gray-600">Your data stays private</p>
            </div>
          </div>
        </div>

        {/* Meetings List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Meetings</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {meetings.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No meetings recorded yet</p>
                <p className="text-sm">Start the bot to begin recording meetings</p>
              </div>
            ) : (
              meetings.map((meeting) => (
                <div key={meeting._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{meeting.topic || 'Untitled Meeting'}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(meeting.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {meeting.participantCount || 0} participants
                        </span>
                        {meeting.duration && (
                          <span>{Math.round(meeting.duration / 60)} minutes</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {meeting.recordingUrl && (
                        <a
                          href={meeting.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Recording
                        </a>
                      )}
                      {meeting.transcriptUrl && (
                        <a
                          href={meeting.transcriptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          View Transcript
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 