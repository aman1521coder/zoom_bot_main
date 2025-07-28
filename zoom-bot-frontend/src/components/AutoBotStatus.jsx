import { useState, useEffect } from 'react';
import { Bot, Circle, Video, Clock, CheckCircle } from 'lucide-react';
import api from '../services/api.js';

export default function AutoBotStatus() {
  const [activeBots, setActiveBots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveBots();
    // Refresh every 10 seconds
    const interval = setInterval(fetchActiveBots, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveBots = async () => {
    try {
      const response = await api.request('/api/zoom/active-bots');
      if (response.success) {
        setActiveBots(response.activeBots);
      }
    } catch (error) {
      console.error('Error fetching active bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffInMinutes = Math.floor((now - start) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just started';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Auto Bot Status</h3>
        </div>
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Auto Bot Status</h3>
        </div>
        <div className="flex items-center gap-2">
          <Circle className={`h-3 w-3 ${activeBots.length > 0 ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {activeBots.length} active
          </span>
        </div>
      </div>

      {activeBots.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Bot className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No bots currently active</p>
          <p className="text-xs text-gray-400 mt-1">
            Bots will auto-join when meetings start
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeBots.map((bot) => (
            <div
              key={bot.meetingId}
              className="p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">
                    Meeting {bot.meetingId}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  {bot.recordingActive && (
                    <Video className="h-3 w-3" />
                  )}
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(bot.startTime)}</span>
                </div>
              </div>
              
              <div className="mt-2 flex items-center gap-4 text-xs text-green-600">
                <span className="flex items-center gap-1">
                  <Circle className="h-2 w-2 fill-green-500" />
                  Bot Joined
                </span>
                {bot.recordingActive && (
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    Recording Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Bot className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-800">
            <div className="font-medium mb-1">Automatic Bot Features:</div>
            <div className="space-y-1">
              <div>• Auto-joins when meetings start</div>
              <div>• Starts cloud recording immediately</div>
              <div>• No browser/frontend required</div>
              <div>• Fully automated transcription</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 