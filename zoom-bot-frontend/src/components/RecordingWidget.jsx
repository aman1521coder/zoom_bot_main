import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Download, Loader } from 'lucide-react';
import api from '../services/api.js';

export default function RecordingWidget({ meetingId, onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      console.log('Recording stopped');
    }
  };

  const uploadRecording = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('meetingId', meetingId || `manual-${Date.now()}`);

      const response = await fetch('https://blackkbingo.com/api/transcription/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setTranscription(result.transcription || 'No transcription available');
        
        if (onRecordingComplete) {
          onRecordingComplete(result);
        }
      } else {
        console.error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading recording:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Meeting Recording</h3>
      
      <div className="text-center mb-6">
        {isRecording ? (
          <div className="animate-pulse">
            <div className="w-20 h-20 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <MicOff className="h-10 w-10 text-white" />
            </div>
            <p className="text-2xl font-mono">{formatTime(recordingTime)}</p>
            <p className="text-sm text-gray-600 mt-2">Recording in progress...</p>
          </div>
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Mic className="h-10 w-10 text-gray-600" />
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-4 mb-6">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
          >
            <Mic className="h-5 w-5" />
            <span>Start Recording</span>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <MicOff className="h-5 w-5" />
            <span>Stop Recording</span>
          </button>
        )}
      </div>

      {isProcessing && (
        <div className="text-center py-4">
          <Loader className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="text-sm text-gray-600 mt-2">Processing recording...</p>
        </div>
      )}

      {transcription && !isProcessing && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Transcription:</h4>
          <p className="text-sm text-gray-700 max-h-40 overflow-y-auto">
            {transcription}
          </p>
        </div>
      )}
    </div>
  );
} 