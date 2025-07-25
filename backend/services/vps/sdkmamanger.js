import puppeteer from 'puppeteer';
import { generateSdkSignature } from './zoomSignature.js';

const activeBots = new Map();
export async function launchBot(meetingId, meetingPassword, userId) {
    if (activeBots.has(meetingId)) {
        console.log(`[BOT_MANAGER] Bot already active for meeting ${meetingId}.`);
        return;
    }

    const sdkKey = process.env.ZOOM_MEETING_SDK_KEY;
    if (!sdkKey) {
        console.error("[BOT_MANAGER] FATAL: ZOOM_MEETING_SDK_KEY environment variable is not set!");
        return;
    }

    const signature = generateSdkSignature(meetingId, 0); // Role 0 = participant

    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
        });
        const page = await browser.newPage();
        activeBots.set(meetingId, { browser, page });

        page.on('console', msg => {
            console.log(`[PUPPETEER_BROWSER_CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
        });

        page.on('response', response => {
    if (!response.ok()) {
        console.log(`[RESPONSE ERROR] ${response.status()} - ${response.url()}`);
    }
});

        await page.exposeFunction('onBotFinished', () => stopBot(meetingId));

        // CORRECTED: Use the serverUrl and remove the extra slash
        const botUrl = `http://147.93.119.85:3000/bot.html?meetingId=${meetingId}&password=${encodeURIComponent(meetingPassword)}&signature=${encodeURIComponent(signature)}&userId=${userId}&sdkKey=${encodeURIComponent(sdkKey)}`;

        console.log(`[BOT_MANAGER] Navigating bot to URL: ${botUrl}`);
        await page.goto(botUrl, { waitUntil: 'networkidle0' });
        console.log(`[BOT_MANAGER] Bot page loaded for meeting ${meetingId}. Now waiting for Zoom SDK to join.`);

    } catch (error) {
        console.error(`[BOT_MANAGER] FATAL: Error launching bot for meeting ${meetingId}:`, error);
        activeBots.delete(meetingId);
    }
}

async function stopBot(meetingId) {
    const bot = activeBots.get(meetingId);
    if (bot) {
        console.log(`[BOT_MANAGER] Stopping bot for meeting ${meetingId}.`);
        await bot.browser.close();
        activeBots.delete(meetingId);
        console.log(`[BOT_MANAGER] Bot for meeting ${meetingId} has been stopped and cleaned up.`);
    }
}
