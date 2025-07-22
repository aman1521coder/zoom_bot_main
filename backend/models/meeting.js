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
    enum: ['recording_available', 'processing', 'completed', 'failed'],
    default: 'recording_available',
  },
  downloadUrl: String,
  transcript: { type: String, default: '' },
  summary: { type: String, default: '' },
  actionItems: [String],
  processingError: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('Meeting', meetingSchema);
