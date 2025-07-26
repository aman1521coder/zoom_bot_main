import express from 'express';
import { protect } from '../middleware/auth.js';
import Meeting from '../models/meeting.js';
import User from '../models/user.js';

const router = express.Router();

/**
 * @route GET /api/meetings
 * @description Get all meetings for the authenticated user
 */
router.get('/', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const meetings = await Meeting.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);
    
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
 * @route GET /api/meetings/active
 * @description Get active meetings for the authenticated user
 */
router.get('/active', protect, async (req, res) => {
  try {
    const meetings = await Meeting.find({ 
      userId: req.user._id,
      status: { $in: ['active', 'recording', 'joined'] }
    }).sort({ startTime: -1 });
    
    res.json({
      success: true,
      data: meetings
    });
  } catch (error) {
    console.error('[MEETING_ROUTES] Error fetching active meetings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active meetings'
    });
  }
});

/**
 * @route GET /api/meetings/scheduled
 * @description Get scheduled meetings from Zoom API
 */
router.get('/scheduled', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.accessToken) {
      return res.status(401).json({
        success: false,
        error: 'No access token found. Please re-authorize.'
      });
    }

    // Fetch scheduled meetings from Zoom API
    const axios = await import('axios');
    const response = await axios.default.get('https://api.zoom.us/v2/users/me/meetings', {
      headers: {
        'Authorization': `Bearer ${user.accessToken}`
      },
      params: {
        type: 'scheduled',
        page_size: 30
      }
    });

    const scheduledMeetings = response.data.meetings || [];
    
    // Format the meetings
    const formattedMeetings = scheduledMeetings.map(meeting => ({
      meetingId: meeting.id,
      topic: meeting.topic,
      startTime: meeting.start_time,
      duration: meeting.duration * 60, // Convert to seconds
      timezone: meeting.timezone,
      joinUrl: meeting.join_url,
      status: 'scheduled',
      type: 'scheduled'
    }));

    res.json({
      success: true,
      data: formattedMeetings
    });
  } catch (error) {
    console.error('[MEETING_ROUTES] Error fetching scheduled meetings:', error);
    
    // Check if token expired
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Access token expired. Please re-authorize.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled meetings'
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
