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
import RecordingWidget from './RecordingWidget.jsx';
import AutoRecorder from './AutoRecorder.jsx';
import RecordingSettings from './RecordingSettings.jsx';
import MeetingsList from './MeetingsList.jsx';

export default function BotDashboard({ user, onLogout }) {
  const [botStatus, setBotStatus] = useState('idle'); // idle, active, error
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [activeMeetings, setActiveMeetings] = useState([]);
  const [botSettings, setBotSettings] = useState({
    autoJoin: true,
    audioEnabled: true,
    videoEnabled: false,
    chatEnabled: true
  });

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
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
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
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-8">
            <RecordingSettings 
              user={user}
              onSettingsUpdate={(settings) => {
                setUserSettings(settings);
                console.log('Settings updated:', settings);
              }}
            />
          </div>
        )}

        {/* Auto Recording for Active Meetings */}
        {!showSettings && activeMeetings.length > 0 && (
          <div className="mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Active Meeting Recording</h3>
              <p className="text-sm text-yellow-700 mb-3">
                You have {activeMeetings.length} active meeting{activeMeetings.length > 1 ? 's' : ''}. 
                Recording will start automatically.
              </p>
              {activeMeetings.map(meeting => (
                <AutoRecorder 
                  key={meeting.meetingId}
                  meetingId={meeting.meetingId}
                  onRecordingComplete={(result) => {
                    console.log('Auto recording complete:', result);
                    // Refresh meetings list to show transcription
                    setTimeout(() => {
                      // This will trigger a refresh through MeetingsList
                      setActiveMeetings(prev => prev.filter(m => m.meetingId !== meeting.meetingId));
                    }, 2000);
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Manual Recording Widget */}
        {!showSettings && activeMeetings.length === 0 && (
          <div className="mb-8">
            <RecordingWidget 
              meetingId={selectedMeeting?.meetingId}
              onRecordingComplete={(result) => {
                console.log('Recording complete:', result);
                // Refresh will happen automatically via MeetingsList
              }}
            />
          </div>
        )}

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

        {/* Meetings List with Tabs */}
        <MeetingsList 
          onMeetingSelect={(meeting) => {
            setSelectedMeeting(meeting);
            console.log('Selected meeting:', meeting);
          }}
          onActiveMeetingsChange={(meetings) => {
            setActiveMeetings(meetings);
            console.log('Active meetings:', meetings);
          }}
        />
      </div>
    </div>
  );
} 