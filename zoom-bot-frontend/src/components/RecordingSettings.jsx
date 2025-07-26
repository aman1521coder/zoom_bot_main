import { useState, useEffect } from 'react';
import { Settings, Save, Mic, Video, Bot, Cloud, Monitor } from 'lucide-react';
import api from '../services/api.js';

export default function RecordingSettings({ user, onSettingsUpdate }) {
  const [settings, setSettings] = useState({
    behavior: 'recording-only', // 'recording-only', 'bot-only', 'both'
    recordingMethod: 'browser', // 'browser', 'cloud', 'local', 'api'
    autoRecord: true,
    enableTranscription: true,
    enableBot: false,
    botSettings: {
      audioEnabled: false,
      videoEnabled: false,
      chatEnabled: true
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load user's saved settings
      const savedSettings = localStorage.getItem('recordingSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setMessage('');
    
    try {
      // Save to localStorage
      localStorage.setItem('recordingSettings', JSON.stringify(settings));
      
      // Save to backend
      const response = await api.request('/api/user/settings', {
        method: 'PUT',
        body: JSON.stringify({ recordingSettings: settings })
      });

      setMessage('Settings saved successfully!');
      
      if (onSettingsUpdate) {
        onSettingsUpdate(settings);
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBehaviorChange = (behavior) => {
    setSettings(prev => ({
      ...prev,
      behavior,
      enableBot: behavior === 'bot-only' || behavior === 'both'
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Recording Settings
        </h2>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Recording Behavior */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Recording Behavior</h3>
        <div className="space-y-2">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="behavior"
              value="recording-only"
              checked={settings.behavior === 'recording-only'}
              onChange={(e) => handleBehaviorChange(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Recording Only</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Recommended</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Record meetings without bot joining. Works immediately, no setup required.
              </p>
            </div>
          </label>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="behavior"
              value="bot-only"
              checked={settings.behavior === 'bot-only'}
              onChange={(e) => handleBehaviorChange(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Bot Only</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Bot joins meetings without recording. Requires published SDK app.
              </p>
            </div>
          </label>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="behavior"
              value="both"
              checked={settings.behavior === 'both'}
              onChange={(e) => handleBehaviorChange(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-indigo-600" />
                <span className="font-medium">Bot + Recording</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Bot joins AND records meetings. Full features but requires setup.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Recording Method */}
      {(settings.behavior === 'recording-only' || settings.behavior === 'both') && (
        <div className="mb-6">
          <h3 className="font-medium mb-3">Recording Method</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="method"
                value="browser"
                checked={settings.recordingMethod === 'browser'}
                onChange={(e) => setSettings(prev => ({ ...prev, recordingMethod: e.target.value }))}
                className="mr-3"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="font-medium">Browser</span>
                </div>
                <p className="text-xs text-gray-600">Works for all users</p>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="method"
                value="cloud"
                checked={settings.recordingMethod === 'cloud'}
                onChange={(e) => setSettings(prev => ({ ...prev, recordingMethod: e.target.value }))}
                className="mr-3"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  <span className="font-medium">Cloud</span>
                </div>
                <p className="text-xs text-gray-600">Pro accounts only</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Additional Options */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Additional Options</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm">Auto-start recording when meeting begins</span>
            <input
              type="checkbox"
              checked={settings.autoRecord}
              onChange={(e) => setSettings(prev => ({ ...prev, autoRecord: e.target.checked }))}
              className="h-4 w-4 text-blue-600"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm">Enable automatic transcription</span>
            <input
              type="checkbox"
              checked={settings.enableTranscription}
              onChange={(e) => setSettings(prev => ({ ...prev, enableTranscription: e.target.checked }))}
              className="h-4 w-4 text-blue-600"
            />
          </label>
        </div>
      </div>

      {/* Bot Settings */}
      {settings.enableBot && (
        <div className="mb-6">
          <h3 className="font-medium mb-3">Bot Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Bot audio enabled</span>
              <input
                type="checkbox"
                checked={settings.botSettings.audioEnabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  botSettings: { ...prev.botSettings, audioEnabled: e.target.checked }
                }))}
                className="h-4 w-4 text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Bot video enabled</span>
              <input
                type="checkbox"
                checked={settings.botSettings.videoEnabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  botSettings: { ...prev.botSettings, videoEnabled: e.target.checked }
                }))}
                className="h-4 w-4 text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Bot can send chat messages</span>
              <input
                type="checkbox"
                checked={settings.botSettings.chatEnabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  botSettings: { ...prev.botSettings, chatEnabled: e.target.checked }
                }))}
                className="h-4 w-4 text-blue-600"
              />
            </label>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Current Configuration:</strong> {
            settings.behavior === 'recording-only' ? 'Recording only (no bot)' :
            settings.behavior === 'bot-only' ? 'Bot only (no recording)' :
            'Bot joins and records'
          }
          {settings.behavior !== 'bot-only' && ` using ${settings.recordingMethod} recording`}
        </p>
      </div>
    </div>
  );
} 