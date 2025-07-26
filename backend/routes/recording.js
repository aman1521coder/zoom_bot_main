import express from 'express';
import { protect } from '../middleware/auth.js';
import recordingService from '../services/recordingService.js';
import vpsWorkerService from '../services/vpsWorkerService.js';

const router = express.Router();

/**
 * Start recording for a meeting (separate from bot joining)
 */
router.post('/start', protect, async (req, res) => {
  try {
    const { meetingId, method = 'auto' } = req.body;
    const userId = req.user._id;

    console.log(`[RECORDING API] Starting recording for meeting ${meetingId}`);

    const result = await recordingService.startRecording(meetingId, userId, method);

    res.json(result);
  } catch (error) {
    console.error('[RECORDING API] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Stop recording for a meeting
 */
router.post('/stop', protect, async (req, res) => {
  try {
    const { meetingId } = req.body;

    console.log(`[RECORDING API] Stopping recording for meeting ${meetingId}`);

    const result = await recordingService.stopRecording(meetingId);

    res.json(result);
  } catch (error) {
    console.error('[RECORDING API] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Join meeting without recording (VPS bot only)
 */
router.post('/join-only', protect, async (req, res) => {
  try {
    const { meetingId, password } = req.body;
    const userId = req.user._id;

    console.log(`[RECORDING API] Join-only request for meeting ${meetingId}`);

    // Launch bot with joinOnly flag
    const result = await vpsWorkerService.launchBotForMeeting(
      meetingId,
      password,
      userId
    );

    res.json({
      success: true,
      message: 'Bot joining meeting (no recording)',
      ...result
    });
  } catch (error) {
    console.error('[RECORDING API] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Join meeting AND record (combined)
 */
router.post('/join-and-record', protect, async (req, res) => {
  try {
    const { meetingId, password, recordingMethod = 'browser' } = req.body;
    const userId = req.user._id;

    console.log(`[RECORDING API] Join and record request for meeting ${meetingId}`);

    // Launch bot first
    const joinResult = await vpsWorkerService.launchBotForMeeting(
      meetingId,
      password,
      userId
    );

    // Then start recording
    const recordResult = await recordingService.startRecording(
      meetingId,
      userId,
      recordingMethod
    );

    res.json({
      success: true,
      join: joinResult,
      recording: recordResult
    });
  } catch (error) {
    console.error('[RECORDING API] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get recording status
 */
router.get('/status/:meetingId', protect, async (req, res) => {
  try {
    const { meetingId } = req.params;

    const Meeting = await import('../models/meeting.js');
    const meeting = await Meeting.default.findOne({ meetingId });

    if (!meeting) {
      return res.status(404).json({ 
        success: false, 
        error: 'Meeting not found' 
      });
    }

    res.json({
      success: true,
      meetingId,
      status: meeting.status,
      recordingMethod: meeting.recordingMethod,
      hasTranscription: !!meeting.transcription,
      hasSummary: !!meeting.summary
    });
  } catch (error) {
    console.error('[RECORDING API] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router; 