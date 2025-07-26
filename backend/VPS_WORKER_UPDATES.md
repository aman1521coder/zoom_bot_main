# VPS Worker Updates Needed

## 🔧 Current Issues

The VPS worker's `sdkBotManager.js` needs updates to work with our backend integration.

## 📝 Required Changes

### 1. Update `sdkBotManager.js` on VPS

Replace the current `sdkBotManager.js` with this updated version:

```javascript
import puppeteer from 'puppeteer';
import { generateSdkSignature } from './zoomSignature.js';

const activeBots = new Map();
const BOT_LIFETIME_TIMEOUT = 90000; // 90 seconds total lifetime for a bot

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

    let browser;
    try {
        console.log(`[BOT_MANAGER] Launching browser for meeting ${meetingId}`);
        
        // Generate signature on VPS side
        const signature = generateSdkSignature(meetingId, 0); // Role 0 = participant

        browser = await puppeteer.launch({
            headless: 'new',
            devtools: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                '--enable-webrtc',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--use-gl=egl',
                '--window-size=1280,720'
            ],
            executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
            defaultViewport: { width: 1280, height: 720 }
        });

        const page = await browser.newPage();
        activeBots.set(meetingId, { browser, page });

        // Master timeout to prevent zombie bots
        const botTimeout = setTimeout(() => {
            console.error(`[BOT_MANAGER] Master timeout reached for meeting ${meetingId}. Stopping bot.`);
            stopBot(meetingId);
        }, BOT_LIFETIME_TIMEOUT);

        // Expose a function for the browser to call
        await page.exposeFunction('onBotFinished', async () => {
            console.log(`[BOT_MANAGER] Bot in-page script signaled completion for meeting ${meetingId}`);
            clearTimeout(botTimeout);
            await stopBot(meetingId);
        });
        
        // Setup page listeners
        page.on('console', async msg => {
            console.log(`[PUPPETEER_BROWSER_CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
        });

        page.on('pageerror', error => {
            console.error(`[PUPPETEER_PAGE_ERROR] ${error.message}`);
        });

        page.on('requestfailed', request => {
            console.error(`[NETWORK_ERROR] ${request.url()} - ${request.failure().errorText}`);
        });

        // Navigate to bot page with all required parameters
        const botUrl = `https://c5b677cd3d08.ngrok-free.app/bot.html?meetingId=${meetingId}&password=${encodeURIComponent(meetingPassword || '')}&signature=${encodeURIComponent(signature)}&userId=${userId}&sdkKey=${encodeURIComponent(sdkKey)}`;
        
        console.log(`[BOT_MANAGER] Navigating bot to URL: ${botUrl}`);
        await page.goto(botUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        console.log(`[BOT_MANAGER] Bot page loaded for meeting ${meetingId}. Waiting for SDK events.`);

    } catch (error) {
        console.error(`[BOT_MANAGER] FATAL: Error during bot launch for meeting ${meetingId}:`, error);
        await stopBot(meetingId);
    }
}

async function stopBot(meetingId) {
    const bot = activeBots.get(meetingId);
    if (bot) {
        console.log(`[BOT_MANAGER] Stopping bot for meeting ${meetingId}.`);
        activeBots.delete(meetingId);
        await bot.browser.close().catch(err => console.error(`[BOT_MANAGER] Error closing browser for meeting ${meetingId}:`, err));
        console.log(`[BOT_MANAGER] Bot for meeting ${meetingId} has been stopped and cleaned up.`);
    }
}
```

### 2. Update `bot.html` on VPS

The current `bot.html` needs to be updated to handle recording. Replace with:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Zoom SDK Bot</title>
    <meta charset="utf-8" />
    <script src="https://source.zoom.us/3.1.0/zoom-meeting-3.1.0.min.js"></script>
</head>
<body>
    <h1>Zoom Bot Initializing...</h1>
    <p id="status">Waiting for meeting details...</p>

    <script>
        // Load Zoom SDK assets
        ZoomMtg.setZoomJSLib('https://source.zoom.us/3.1.0/lib', '/av');
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        const statusEl = document.getElementById('status');
        let mediaRecorder;
        let audioChunks = [];

        // Get meeting credentials from URL
        const urlParams = new URLSearchParams(window.location.search);
        const meetingId = urlParams.get('meetingId');
        const password = urlParams.get('password');
        const signature = urlParams.get('signature');
        const userId = urlParams.get('userId');
        const sdkKey = urlParams.get('sdkKey');

        const botName = 'AI Assistant';
        const userEmail = `bot+${userId}@zoom-assistant.app`;

        // Start recording function
        const startRecording = () => {
            try {
                const audioContext = ZoomMtg.getAudioContext();
                const streamDestination = audioContext.createMediaStreamDestination();
                ZoomMtg.connectAudio(streamDestination);
                
                mediaRecorder = new MediaRecorder(streamDestination.stream);
                mediaRecorder.start();
                statusEl.textContent = "Successfully joined. Recording audio...";
                console.log("Recording started.");

                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });
            } catch (error) {
                console.error("Error starting recording:", error);
                statusEl.textContent = "Error: Could not start recording.";
            }
        };

        // Stop and upload recording
        const stopAndUploadRecording = async () => {
            if (!mediaRecorder || mediaRecorder.state !== 'recording') {
                console.log("Recorder was not active. Nothing to upload.");
                setTimeout(() => window.onBotFinished?.(), 3000);
                return;
            }

            mediaRecorder.stop();
            console.log("Recording stopped. Preparing upload.");
            statusEl.textContent = "Meeting ended. Preparing upload...";

            mediaRecorder.addEventListener("stop", async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
                const formData = new FormData();
                formData.append("recording", audioBlob, `${meetingId}.webm`);
                formData.append("userId", userId);

                statusEl.textContent = `Uploading ${Math.round(audioBlob.size / 1024)} KB recording...`;
                console.log("Uploading audio file to server...");

                try {
                    const response = await fetch(`https://blackkbingo.com/api/meetings/upload-recording/${meetingId}`, {
                        method: 'POST',
                        body: formData,
                    });
                    
                    if (response.ok) {
                        console.log("Upload successful!");
                        statusEl.textContent = "Upload complete. Bot shutting down.";
                    } else {
                        const errorText = await response.text();
                        console.error("Upload failed:", errorText);
                        statusEl.textContent = `Upload failed: ${errorText}`;
                    }
                } catch (error) {
                    console.error("Network error during upload:", error);
                    statusEl.textContent = "Error during upload.";
                } finally {
                    setTimeout(() => window.onBotFinished?.(), 3000);
                }
            });
        };

        // Initialize and join meeting
        function initAndJoin() {
            statusEl.textContent = "Initializing Zoom SDK...";
            ZoomMtg.init({
                leaveUrl: "about:blank",
                isSupportAV: true,
                success: () => {
                    statusEl.textContent = "SDK Initialized. Joining meeting...";
                    ZoomMtg.join({
                        meetingNumber: meetingId,
                        signature: signature,
                        sdkKey: sdkKey,
                        userName: botName,
                        passWord: password,
                        userEmail: userEmail,
                        success: () => {
                            console.log("Successfully joined meeting.");
                            startRecording();
                        },
                        error: (err) => {
                            console.error("Error joining meeting:", err);
                            statusEl.textContent = `Error joining meeting: ${err.errorCode}`;
                        }
                    });
                },
                error: (error) => {
                    console.error("SDK Initialization Error:", error);
                    statusEl.textContent = "Error initializing SDK.";
                }
            });

            ZoomMtg.getMeetingStatus().addEventListener('meeting-status', (payload) => {
                if (payload.meetingStatus === 2) {
                    stopAndUploadRecording();
                }
            });
        }
        
        // Start the bot
        if (meetingId && signature && userId && sdkKey) {
            initAndJoin();
        } else {
            statusEl.textContent = "Error: Missing required meeting details in URL.";
            console.error("Missing required parameters in query parameters.");
        }
    </script>
</body>
</html>
```

## 🚀 How to Apply Updates

### 1. SSH to VPS
```bash
ssh root@147.93.119.85
```

### 2. Update sdkBotManager.js
```bash
cd puppeteer-worker/services
# Replace the content with the updated version above
```

### 3. Update bot.html
```bash
cd puppeteer-worker/public
# Replace the content with the updated version above
```

### 4. Restart Worker
```bash
cd puppeteer-worker
node worker.js
```

## 🔍 Test the Integration

### 1. Test from Backend
```bash
cd backend
node test-vps-worker.js
```

### 2. Test Manual Webhook
```bash
curl -X POST http://localhost:5000/api/webhook/zoom/manual \
  -H "Content-Type: application/json" \
  -d '{
    "event": "meeting.started",
    "payload": {
      "object": {
        "id": "123456789",
        "topic": "Test Meeting",
        "host_id": "your_zoom_id",
        "password": ""
      }
    }
  }'
```

## ✅ Expected Flow

1. **Backend receives webhook** → Sends to VPS worker
2. **VPS worker launches Puppeteer** → Opens bot.html
3. **Bot joins meeting** → Records audio
4. **Meeting ends** → Uploads recording to backend
5. **Bot shuts down** → Cleanup complete 