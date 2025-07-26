// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  zoomId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  accessToken: { type: String, required: true }, // Should be encrypted in production
  refreshToken: { type: String, required: true }, // Should be encrypted in production
  recordingSettings: {
    behavior: { 
      type: String, 
      enum: ['recording-only', 'bot-only', 'both'],
      default: 'recording-only'
    },
    recordingMethod: {
      type: String,
      enum: ['browser', 'cloud', 'local', 'api'],
      default: 'browser'
    },
    autoRecord: { type: Boolean, default: true },
    enableTranscription: { type: Boolean, default: true },
    enableBot: { type: Boolean, default: false },
    botSettings: {
      audioEnabled: { type: Boolean, default: false },
      videoEnabled: { type: Boolean, default: false },
      chatEnabled: { type: Boolean, default: true }
    }
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
