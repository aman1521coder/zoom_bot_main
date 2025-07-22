// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  zoomId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  accessToken: { type: String, required: true }, // Should be encrypted in production
  refreshToken: { type: String, required: true }, // Should be encrypted in production
}, { timestamps: true });

export default mongoose.model('User', userSchema);
