// services/meetingMonitor.js
import cron from 'node-cron';
import axios from 'axios';
import User from '../models/user.js';
import { joinMeetingAndRecord } from './meetingJoiner.js';

// A simple in-memory store to track meetings we're already processing
const processingMeetings = new Set();

/**
 * Fetches upcoming meetings for a single user.
 * @param {object} user - The user object from the database.
 */
async function checkMeetingsForUser(user) {
  try {
    const response = await axios.get('https://api.zoom.us/v2/users/me/meetings', {
      headers: { 'Authorization': `Bearer ${user.accessToken}` },
      params: { type: 'upcoming', page_size: 10 }
    });

    const { meetings } = response.data;

    for (const meeting of meetings) {
      const startTime = new Date(meeting.start_time);
      const now = new Date();
      const timeUntilStart = startTime.getTime() - now.getTime();

      // If the meeting starts in the next 5 minutes and we haven't processed it yet
      if (timeUntilStart > 0 && timeUntilStart <= 5 * 60 * 1000) {
        if (!processingMeetings.has(meeting.id)) {
          console.log(`[MONITOR] Meeting "${meeting.topic}" is scheduled to start soon. Preparing to join.`);
          processingMeetings.add(meeting.id);
          
          // Join the meeting right at the start time
          setTimeout(() => {
            joinMeetingAndRecord(user, meeting.id, meeting.topic);
          }, timeUntilStart);
        }
      }
    }
  } catch (error) {
    // This can happen if the user's token is expired. We'll need to handle token refresh later.
    console.error(`[MONITOR] Error checking meetings for ${user.email}:`, error.response?.data || error.message);
  }
}

/**
 * The main monitoring task that runs periodically.
 */
async function monitorUpcomingMeetings() {
  console.log('[MONITOR] Checking for upcoming meetings...');
  const users = await User.find();
  for (const user of users) {
    await checkMeetingsForUser(user);
  }
}

/**
 * Starts the cron job to run the monitor every minute.
 */
export function startMeetingMonitor() {
  // Run the job every minute
  cron.schedule('* * * * *', monitorUpcomingMeetings);
  console.log('[MONITOR] Meeting monitor has been started. Will check every minute.');
}
