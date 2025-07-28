import { useState, useEffect } from 'react';
import { Play, Square, Mic, MicOff, Video, VideoOff, Users, Clock } from 'lucide-react';
import api from '../services/api.js';

export default function ZoomBotJoiner({ meeting, onJoinSuccess, onJoinError }) {
  const [botStatus, setBotStatus] = useState('idle'); // idle, joining, joined, recording, error
  const [joinSignature, setJoinSignature] = useState(null);
  const [zoomMtg, setZoomMtg] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(false);

  useEffect(() => {
    // Load Zoom Meeting SDK
    loadZoomSDK();
  }, []);

  const loadZoomSDK = () => {
    const script = document.createElement('script');
    script.src = 'https://source.zoom.us/2.0.1/lib/vendor/react.min.js';
    script.onload = () => {
      const zoomScript = document.createElement('script');
      zoomScript.src = 'https://source.zoom.us/2.0.1/lib/vendor/react-dom.min.js';
      zoomScript.onload = () => {
        const mainScript = document.createElement('script');
        mainScript.src = 'https://source.zoom.us/zoom-meeting-2.0.1.min.js';
        mainScript.onload = () => {
          window.ZoomMtg.setZoomJSLib('https://source.zoom.us/2.0.1/lib', '/av');
          window.ZoomMtg.preLoadWasm();
          window.ZoomMtg.prepareJssdk();
          setZoomMtg(window.ZoomMtg);
        };
        document.head.appendChild(mainScript);
      };
      document.head.appendChild(zoomScript);
    };
    document.head.appendChild(script);
  };

  const getJoinSignature = async () => {
    try {
      setBotStatus('joining');
      
      // Get signature from your backend
      const response = await api.request('/api/zoom/get-signature', {
        method: 'POST',
        body: {
          meetingNumber: meeting.meetingId,
          role: 1 // 1 = host/co-host, 0 = participant
        }
      });

      if (response.success) {
        setJoinSignature(response.signature);
        setIsHost(response.isHost);
        return response.signature;
      } else {
        throw new Error(response.error || 'Failed to get join signature');
      }
    } catch (error) {
      console.error('[BOT_JOINER] Error getting signature:', error);
      setBotStatus('error');
      if (onJoinError) onJoinError(error);
      return null;
    }
  };

  const joinMeeting = async () => {
    if (!zoomMtg) {
      console.error('[BOT_JOINER] Zoom SDK not loaded');
      return;
    }

    const signature = await getJoinSignature();
    if (!signature) return;

    try {
      setBotStatus('joining');

      // Initialize Zoom Meeting SDK
      zoomMtg.init({
        leaveUrl: window.location.origin + '/bot-left',
        success: () => {
          console.log('[BOT_JOINER] SDK initialized successfully');
          
          // Join the meeting
          zoomMtg.join({
            signature: signature,
            meetingNumber: meeting.meetingId,
            userName: `AI Bot - ${meeting.topic || 'Meeting'}`,
            userEmail: 'bot@yourdomain.com',
            passWord: meeting.password || '',
            success: (result) => {
              console.log('[BOT_JOINER] ✅ Bot joined meeting successfully:', result);
              setBotStatus('joined');
              
              // Start recording if bot is host/co-host
              if (isHost) {
                setTimeout(() => startRecording(), 2000);
              }
              
              if (onJoinSuccess) onJoinSuccess(result);
            },
            error: (error) => {
              console.error('[BOT_JOINER] ❌ Failed to join meeting:', error);
              setBotStatus('error');
              if (onJoinError) onJoinError(error);
            }
          });
        },
        error: (error) => {
          console.error('[BOT_JOINER] SDK initialization failed:', error);
          setBotStatus('error');
          if (onJoinError) onJoinError(error);
        }
      });

    } catch (error) {
      console.error('[BOT_JOINER] Error joining meeting:', error);
      setBotStatus('error');
      if (onJoinError) onJoinError(error);
    }
  };

  const startRecording = async () => {
    try {
      console.log('[BOT_JOINER] Starting recording...');
      
      // Start cloud recording via API
      const response = await api.request('/api/zoom/start-recording', {
        method: 'POST',
        body: {
          meetingId: meeting.meetingId
        }
      });

      if (response.success) {
        setRecordingEnabled(true);
        setBotStatus('recording');
        console.log('[BOT_JOINER] ✅ Recording started');
      } else {
        console.error('[BOT_JOINER] Failed to start recording:', response.error);
      }
    } catch (error) {
      console.error('[BOT_JOINER] Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      console.log('[BOT_JOINER] Stopping recording...');
      
      const response = await api.request('/api/zoom/stop-recording', {
        method: 'POST',
        body: {
          meetingId: meeting.meetingId
        }
      });

      if (response.success) {
        setRecordingEnabled(false);
        console.log('[BOT_JOINER] ✅ Recording stopped');
      }
    } catch (error) {
      console.error('[BOT_JOINER] Error stopping recording:', error);
    }
  };

  const leaveMeeting = () => {
    if (zoomMtg) {
      zoomMtg.leaveMeeting({
        success: () => {
          console.log('[BOT_JOINER] Bot left meeting');
          setBotStatus('idle');
          setRecordingEnabled(false);
        }
      });
    }
  };

  const getStatusColor = () => {
    switch (botStatus) {
      case 'joined': return 'bg-green-100 text-green-800 border-green-200';
      case 'recording': return 'bg-red-100 text-red-800 border-red-200';
      case 'joining': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (botStatus) {
      case 'joined': return isHost ? 'Joined as Host' : 'Joined as Participant';
      case 'recording': return 'Recording Active';
      case 'joining': return 'Joining Meeting...';
      case 'error': return 'Join Failed';
      default: return 'Ready to Join';
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">AI Bot Control</h3>
          <p className="text-sm text-gray-600">{meeting.topic || 'Meeting'}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          Meeting ID: {meeting.meetingId}
        </span>
        {isHost && (
          <span className="flex items-center gap-1">
            <Video className="h-4 w-4" />
            Host Privileges
          </span>
        )}
      </div>

      <div className="flex gap-3">
        {botStatus === 'idle' && (
          <button
            onClick={joinMeeting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Play className="h-4 w-4" />
            Join Meeting
          </button>
        )}

        {botStatus === 'joined' && isHost && !recordingEnabled && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Video className="h-4 w-4" />
            Start Recording
          </button>
        )}

        {recordingEnabled && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Square className="h-4 w-4" />
            Stop Recording
          </button>
        )}

        {(botStatus === 'joined' || botStatus === 'recording') && (
          <button
            onClick={leaveMeeting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Square className="h-4 w-4" />
            Leave Meeting
          </button>
        )}
      </div>

      {!isHost && botStatus === 'joined' && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Bot joined as participant. Recording requires host/co-host promotion.
          </p>
        </div>
      )}

      {/* Hidden iframe for Zoom SDK */}
      <div id="zmmtg-root" style={{ display: 'none' }}></div>
    </div>
  );
} 