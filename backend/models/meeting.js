// models/Meeting.js
import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  meetingId: { type: String, required: true, index: true },
  topic: String,
  status: {
    type: String,
    enum: ['recording_available', 'processing', 'completed', 'failed', 'joined', 'ended', 'active'],
    default: 'recording_available',
  },
  downloadUrl: String,
  transcript: { type: String, default: '' },
  transcription: { type: String, default: '' }, // Full transcription text
  transcriptUrl: String, // URL to transcript file
  recordingUrl: String, // URL to recording file
  summary: { type: String, default: '' },
  actionItems: [String],
  processingError: { type: String, default: null },
  recordingMethod: { 
    type: String, 
    enum: ['cloud', 'local', 'browser', 'api', 'vps_bot', 'cloud_fallback', 'tracking_only', 'none'],
    default: 'none'
  },
  recordingStartTime: Date,
  recordingEndTime: Date,
  wordCount: Number,
  
  // Participant bot specific fields
  meetingDetails: { type: mongoose.Schema.Types.Mixed, default: null },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  participantCount: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // in seconds
}, { timestamps: true });

export default mongoose.model('Meeting', meetingSchema);
