import { useEffect, useState } from 'react';
import { CheckCircle, Loader, X, AlertCircle, Info } from 'lucide-react';

export default function RecordingNotification({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose,
  playSound = false 
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Play notification sound if requested
    if (playSound && visible) {
      playNotificationSound();
    }

    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, playSound]);

  const playNotificationSound = () => {
    // Create a simple notification sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure the sound
      oscillator.frequency.value = type === 'error' ? 300 : 600; // Lower frequency for errors
      oscillator.type = 'sine';
      
      // Fade in and out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      // Play the sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  if (!visible) return null;

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'processing':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'info':
        return 'bg-cyan-50 border-cyan-200 text-cyan-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <X className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'processing':
        return <Loader className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'info':
        return <Info className="h-5 w-5 text-cyan-600" />;
      default:
        return null;
    }
  };

  return (
    <div className={`fixed top-4 right-4 max-w-md p-4 rounded-lg border shadow-lg ${getStyles()} animate-slide-in z-50`}>
      <div className="flex items-center space-x-3">
        {getIcon()}
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setVisible(false);
            if (onClose) onClose();
          }}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 