import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/user.js';

const router = express.Router();

/**
 * Get user settings
 */
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('recordingSettings');
    
    res.json({
      success: true,
      settings: user.recordingSettings || {
        behavior: 'recording-only',
        recordingMethod: 'browser',
        autoRecord: true,
        enableTranscription: true,
        enableBot: false,
        botSettings: {
          audioEnabled: false,
          videoEnabled: false,
          chatEnabled: true
        }
      }
    });
  } catch (error) {
    console.error('[USER] Error fetching settings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch settings' 
    });
  }
});

/**
 * Update user settings
 */
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { recordingSettings } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { recordingSettings },
      { new: true, runValidators: true }
    );
    
    console.log(`[USER] Updated settings for user ${user.email}:`, recordingSettings);
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: user.recordingSettings
    });
  } catch (error) {
    console.error('[USER] Error updating settings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update settings' 
    });
  }
});

/**
 * Get user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-accessToken -refreshToken');
    
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        zoomId: user.zoomId,
        recordingSettings: user.recordingSettings
      }
    });
  } catch (error) {
    console.error('[USER] Error fetching profile:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch profile' 
    });
  }
});

export default router; 