import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader, AlertCircle } from 'lucide-react';
import api from '../services/api.js';

export default function AutoRecorder({ meetingId, onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    // Automatically start recording when component mounts
    startRecording();
    
    // Cleanup on unmount (when meeting ends)
    return () => {
      console.log('[AUTO-RECORDER] Component unmounting - meeting ended');
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        console.log('[AUTO-RECORDER] Stopping and uploading recording...');
        mediaRecorderRef.current.stop(); // This triggers uploadRecording via onstop
      }
    };
  }, [meetingId]);

  async function startRecording() {
    try {
      setStatus('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      setStatus('Starting recording...');
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setStatus('Processing recording...');
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await uploadRecording(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setStatus('Recording in progress...');
      setError(null);
      
      console.log('[AUTO-RECORDER] Recording started automatically');
    } catch (err) {
      console.error('[AUTO-RECORDER] Error starting recording:', err);
      setError('Failed to start recording. Please check microphone permissions.');
      setStatus('Error');
    }
  }

  async function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setStatus('Stopping recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  async function uploadRecording(audioBlob) {
    try {
      setStatus('Uploading recording...');
      
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording-${meetingId}-${Date.now()}.webm`);
      formData.append('meetingId', meetingId);

      const response = await fetch('https://blackkbingo.com/api/transcription/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setStatus('Recording uploaded successfully!');
      console.log('[AUTO-RECORDER] Upload complete:', result);
      
      // Show success message
      setStatus('✅ Recording saved and transcribed!');
      
      if (onRecordingComplete) {
        onRecordingComplete(result);
      }
    } catch (err) {
      console.error('[AUTO-RECORDER] Upload error:', err);
      setError('Failed to upload recording');
      setStatus('Upload failed');
    }
  }

  // Auto-stop recording after 90 minutes (Zoom meeting limit)
  useEffect(() => {
    if (isRecording) {
      const timeout = setTimeout(() => {
        console.log('[AUTO-RECORDER] Auto-stopping after 90 minutes');
        stopRecording();
      }, 90 * 60 * 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [isRecording]);

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isRecording ? (
            <div className="animate-pulse">
              <Mic className="h-5 w-5 text-red-600" />
            </div>
          ) : error ? (
            <AlertCircle className="h-5 w-5 text-red-600" />
          ) : (
            <Loader className="h-5 w-5 text-gray-600 animate-spin" />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isRecording ? 'Recording Active' : 'Recording System'}
            </p>
            <p className="text-xs text-gray-600">{status}</p>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        </div>
        
        {isRecording && (
          <button
            onClick={stopRecording}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Stop Recording
          </button>
        )}
      </div>
    </div>
  );
} 