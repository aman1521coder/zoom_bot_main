import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Mic, 
  FileText,
  Play,
  Circle,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import api from '../services/api.js';

export default function MeetingsList({ onMeetingSelect }) {
  const [meetings, setMeetings] = useState({
    active: [],
    scheduled: [],
    past: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchMeetings();
    // Refresh every 30 seconds for active meetings
    const interval = setInterval(fetchMeetings, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      
      // Fetch different types of meetings
      const [activeMeetings, scheduledMeetings, pastMeetings] = await Promise.all([
        api.request('/api/meetings/active'),
        api.request('/api/meetings/scheduled'),
        api.request('/api/meetings?limit=10') // Recent past meetings
      ]);

      setMeetings({
        active: activeMeetings?.data || [],
        scheduled: scheduledMeetings?.data || [],
        past: pastMeetings?.data || []
      });
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (date - now) / (1000 * 60 * 60);
    
    if (diffInHours < 24 && diffInHours > 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffInHours < 48 && diffInHours > 24) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'recording':
        return <Circle className="h-3 w-3 fill-green-500 text-green-500 animate-pulse" />;
      case 'scheduled':
        return <Clock className="h-3 w-3 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-gray-500" />;
      default:
        return <AlertCircle className="h-3 w-3 text-gray-400" />;
    }
  };

  const MeetingCard = ({ meeting, type }) => {
    const isActive = type === 'active';
    const isScheduled = type === 'scheduled';
    
    return (
      <div 
        className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
          isActive ? 'border-green-200 bg-green-50' : ''
        }`}
        onClick={() => onMeetingSelect && onMeetingSelect(meeting)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(isActive ? 'active' : isScheduled ? 'scheduled' : meeting.status)}
              <h4 className="font-medium text-gray-900">
                {meeting.topic || 'Untitled Meeting'}
              </h4>
              {isActive && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  LIVE NOW
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(meeting.startTime || meeting.createdAt)}
              </span>
              
              {meeting.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(meeting.duration)}
                </span>
              )}
              
              {meeting.participantCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {meeting.participantCount}
                </span>
              )}
            </div>

            {/* Meeting ID for scheduled meetings */}
            {isScheduled && meeting.meetingId && (
              <div className="mt-2 text-xs text-gray-500">
                Meeting ID: {meeting.meetingId}
              </div>
            )}

            {/* Recording status */}
            {meeting.recordingUrl && (
              <div className="flex items-center gap-2 mt-2">
                <Video className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-blue-600">Recording available</span>
              </div>
            )}

            {/* Transcription status */}
            {meeting.transcription && (
              <div className="flex items-center gap-2 mt-1">
                <FileText className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-purple-600">Transcription available</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 ml-4">
            {isActive && (
              <button className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 flex items-center gap-1">
                <Mic className="h-3 w-3" />
                Record
              </button>
            )}
            
            {isScheduled && (
              <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center gap-1">
                <Play className="h-3 w-3" />
                Start
              </button>
            )}
            
            {meeting.recordingUrl && (
              <a
                href={meeting.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Video className="h-3 w-3" />
                View
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'text-green-600 border-green-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Circle className="h-3 w-3 fill-green-500 text-green-500 animate-pulse" />
              Active ({meetings.active.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'scheduled'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled ({meetings.scheduled.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'past'
                ? 'text-gray-600 border-gray-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent ({meetings.past.length})
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'active' && (
          <div className="space-y-3">
            {meetings.active.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Video className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No active meetings</p>
                <p className="text-sm mt-1">Active meetings will appear here when they start</p>
              </div>
            ) : (
              meetings.active.map(meeting => (
                <MeetingCard key={meeting._id} meeting={meeting} type="active" />
              ))
            )}
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="space-y-3">
            {meetings.scheduled.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No scheduled meetings</p>
                <p className="text-sm mt-1">Your upcoming meetings will appear here</p>
              </div>
            ) : (
              meetings.scheduled.map(meeting => (
                <MeetingCard key={meeting._id} meeting={meeting} type="scheduled" />
              ))
            )}
          </div>
        )}

        {activeTab === 'past' && (
          <div className="space-y-3">
            {meetings.past.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No past meetings</p>
                <p className="text-sm mt-1">Your completed meetings will appear here</p>
              </div>
            ) : (
              meetings.past.map(meeting => (
                <MeetingCard key={meeting._id} meeting={meeting} type="past" />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 