import { useState } from 'react';
import { Play, Zap, Mic, FileText, Shield } from 'lucide-react';

export default function LandingPage({ onStartWithAI }) {
  const [loading, setLoading] = useState(false);

  const handleStartWithAI = async () => {
    setLoading(true);
    try {
      // Redirect to Zoom OAuth on backend
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      window.location.href = `${backendUrl}/api/auth/zoom`;
    } catch (error) {
      console.error('Error starting AI:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Zoom AI Bot</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your AI Meeting
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}Assistant
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Automatically join your Zoom meetings as a participant, send chat messages, and control audio/video. 
            Just like Read AI, but with full participant capabilities.
          </p>

          <button
            onClick={handleStartWithAI}
            disabled={loading}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
            ) : (
              <Play className="h-6 w-6 mr-3" />
            )}
            Start with our AI
          </button>

          <p className="text-sm text-gray-500 mt-4">
            Secure • Private • Automatic
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6 max-w-2xl mx-auto">
            <p className="text-red-800 text-sm">
              🚨 <strong>Backend Issue:</strong> The backend at <code>blackkbingo.com</code> is currently down (returning 404). 
              Please check your server logs and restart the backend service.
            </p>
            <div className="mt-2 text-red-700 text-xs">
              <strong>Debug steps:</strong><br/>
              1. Check if backend process is running: <code>ps aux | grep node</code><br/>
              2. Check logs: <code>pm2 logs</code> or <code>journalctl -u your-service</code><br/>
              3. Try manual start: <code>cd backend && node server.js</code>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mic className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Join as Participant</h3>
            <p className="text-gray-600">
              Your AI bot joins meetings as an actual participant with audio/video controls.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Chat</h3>
            <p className="text-gray-600">
              Send chat messages during meetings and interact with other participants.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Full Control</h3>
            <p className="text-gray-600">
              Toggle audio/video, control bot behavior, and monitor meeting status in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600">Simple setup, powerful automation</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
            <h4 className="font-semibold text-gray-900 mb-2">Authorize</h4>
            <p className="text-sm text-gray-600">Connect your Zoom account with OAuth</p>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
            <h4 className="font-semibold text-gray-900 mb-2">Start Meeting</h4>
            <p className="text-sm text-gray-600">Create or join any Zoom meeting</p>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
            <h4 className="font-semibold text-gray-900 mb-2">Bot Joins</h4>
            <p className="text-sm text-gray-600">AI Assistant automatically joins as participant</p>
          </div>
          
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold">4</div>
            <h4 className="font-semibold text-gray-900 mb-2">Control & Monitor</h4>
            <p className="text-sm text-gray-600">Manage bot behavior from your dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
} 