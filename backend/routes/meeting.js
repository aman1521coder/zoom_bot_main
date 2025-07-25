import express from 'express';
import { protect } from '../middleware/auth.js';
import Meeting from '../models/meeting.js';

const router = express.Router();

/**
 * @route GET /api/meetings
 * @description Get all meetings for the authenticated user
 */
router.get('/', protect, async (req, res) => {
  try {
    const meetings = await Meeting.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: meetings
    });
  } catch (error) {
    console.error('[MEETING_ROUTES] Error fetching meetings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meetings'
    });
  }
});

/**
 * @route GET /api/meetings/:id
 * @description Get a specific meeting by ID
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    res.json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('[MEETING_ROUTES] Error fetching meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meeting'
    });
  }
});

/**
 * @route DELETE /api/meetings/:id
 * @description Delete a meeting
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    console.error('[MEETING_ROUTES] Error deleting meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete meeting'
    });
  }
});

export default router;
