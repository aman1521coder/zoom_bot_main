// services/sdkBotManager.js
import puppeteer from 'puppeteer';
import { generateSdkSignature } from './zoomSignature.js';
// REMOVED - We no longer process the transcript here.
// import { processTranscript } from './meetingProcessor.js';

// This map holds active bot instances.
const activeBots = new Map();

/**
 * Launches a headless browser instance to join a Zoom meeting as a bot.
 * @param {string} meetingId - The ID of the Zoom meeting.
 * @param {string} meetingPassword - The password for the meeting.
 * @param {string} userId - The internal DB ID of the user who owns the meeting.
 */
export async function launchBot(meetingId, meetingPassword, userId) {
  if (activeBots.has(meetingId)) {
    console.log(`[BOT_MANAGER] Bot already active for meeting ${meetingId}.`);
    return;
  }

  console.log(`[BOT_MANAGER] Generating SDK signature for meeting ${meetingId}...`);
  const signature = generateSdkSignature(meetingId, 0); // Role 0 for participant

  try {
    console.log('[BOT_MANAGER] Launching Puppeteer browser...');
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
        ],
    });
    const page = await browser.newPage();
    activeBots.set(meetingId, { browser, page });

    // --- MODIFIED ---
    // Expose a simple function that the bot calls when its job is completely done.
    // This function's only responsibility is to trigger the cleanup.
    await page.exposeFunction('onBotFinished', async () => {
      console.log(`[BOT_MANAGER] Received 'finished' signal from bot for meeting ${meetingId}.`);
      // We no longer process anything here. We just clean up the bot.
      await stopBot(meetingId);
    });

    const botUrl = `http://blackkbingo.com/bot.html?meetingId=${meetingId}&password=${encodeURIComponent(meetingPassword)}&signature=${encodeURIComponent(signature)}&userId=${userId}`;
    
    console.log(`[BOT_MANAGER] Navigating bot to: ${botUrl}`);
    await page.goto(botUrl, { waitUntil: 'networkidle0' });

    console.log(`[BOT_MANAGER] Bot page loaded for meeting ${meetingId}. Awaiting meeting end...`);

  } catch (error) {
    console.error(`[BOT_MANAGER] Error launching bot for meeting ${meetingId}:`, error);
    activeBots.delete(meetingId);
  }
}

/**
 * Stops and cleans up the bot for a given meeting.
 * @param {string} meetingId - The ID of the meeting whose bot should be stopped.
 */
export async function stopBot(meetingId) {
  const bot = activeBots.get(meetingId);
  if (bot) {
    console.log(`[BOT_MANAGER] Stopping bot for meeting ${meetingId}.`);
    await bot.browser.close();
    activeBots.delete(meetingId);
    console.log(`[BOT_MANAGER] Bot for meeting ${meetingId} has been stopped and cleaned up.`);
  }
}
