# Simple bot.html for VPS (No React Dependencies)

Replace the current `bot.html` in `/puppeteer-worker/public/` with this simple version:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Zoom SDK Bot</title>
    <meta charset="utf-8" />
    <!-- Official Zoom Meeting Web SDK -->
    <script src="https://source.zoom.us/2.18.0/zoom-meeting-2.18.0.min.js"></script>
</head>
<body>
    <h1>Zoom Bot Initializing...</h1>
    <p id="status">Waiting for meeting details...</p>

    <script>
        console.log('[BOT] Script started');
        
        // UI element for status updates
        const statusEl = document.getElementById('status');

        // Get meeting credentials from URL
        const urlParams = new URLSearchParams(window.location.search);
        const meetingId = urlParams.get('meetingId');
        const password = urlParams.get('password');
        const signature = urlParams.get('signature');
        const userId = urlParams.get('userId');
        const sdkKey = urlParams.get('sdkKey');

        console.log('[BOT] Parameters:', { meetingId, userId, sdkKey: sdkKey ? '***found***' : 'missing' });

        // Configure bot identity
        const botName = 'AI Assistant';
        const userEmail = `bot+${userId}@zoom-assistant.app`;

        // Variables for recording logic
        let mediaRecorder;
        let audioChunks = [];

        // Start recording function
        const startRecording = () => {
            try {
                console.log('[BOT] Starting recording...');
                statusEl.textContent = "Successfully joined. Recording audio...";
                
                // For now, just log that we're recording
                // We'll implement actual recording later
                console.log('[BOT] Recording started (simulated)');
                
            } catch (error) {
                console.error('[BOT] Error starting recording:', error);
                statusEl.textContent = "Error: Could not start recording.";
            }
        };

        // Stop and upload recording
        const stopAndUploadRecording = async () => {
            console.log('[BOT] Meeting ended, stopping recording...');
            statusEl.textContent = "Meeting ended. Bot shutting down.";
            
            // Signal completion to Puppeteer
            setTimeout(() => {
                console.log('[BOT] Signaling completion to Puppeteer');
                if (typeof window.onBotFinished === 'function') {
                    window.onBotFinished();
                } else {
                    console.error('[BOT] onBotFinished function not found');
                }
            }, 3000);
        };

        // Initialize and join meeting
        function initAndJoin() {
            console.log('[BOT] Initializing Zoom SDK...');
            statusEl.textContent = "Initializing Zoom SDK...";
            
            try {
                // Load Zoom SDK assets
                ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
                ZoomMtg.preLoadWasm();
                ZoomMtg.prepareWebSDK();
                
                console.log('[BOT] SDK assets loaded');
                
                ZoomMtg.init({
                    leaveUrl: "about:blank",
                    isSupportAV: true,
                    success: () => {
                        console.log('[BOT] SDK initialized successfully');
                        statusEl.textContent = "SDK Initialized. Joining meeting...";
                        
                        ZoomMtg.join({
                            meetingNumber: meetingId,
                            signature: signature,
                            sdkKey: sdkKey,
                            userName: botName,
                            passWord: password,
                            userEmail: userEmail,
                            success: () => {
                                console.log('[BOT] Successfully joined meeting');
                                startRecording();
                            },
                            error: (err) => {
                                console.error('[BOT] Error joining meeting:', err);
                                statusEl.textContent = `Error joining meeting: ${err.errorCode}`;
                            }
                        });
                    },
                    error: (error) => {
                        console.error('[BOT] SDK Initialization Error:', error);
                        statusEl.textContent = "Error initializing SDK.";
                    }
                });

                // Listen for meeting status changes
                ZoomMtg.getMeetingStatus().addEventListener('meeting-status', (payload) => {
                    console.log('[BOT] Meeting status changed:', payload.meetingStatus);
                    if (payload.meetingStatus === 2) {
                        stopAndUploadRecording();
                    }
                });
                
            } catch (error) {
                console.error('[BOT] Error in initAndJoin:', error);
                statusEl.textContent = "Error initializing bot.";
            }
        }
        
        // Start the bot if we have all required parameters
        if (meetingId && signature && userId && sdkKey) {
            console.log('[BOT] All parameters present, starting bot...');
            initAndJoin();
        } else {
            console.error('[BOT] Missing required parameters:', { meetingId, signature, userId, sdkKey });
            statusEl.textContent = "Error: Missing required meeting details in URL.";
        }
    </script>
</body>
</html>
```

## 🔧 Key Changes

### 1. **Removed React Dependencies**
- No React, Redux, or other complex dependencies
- Pure JavaScript implementation
- Simpler, more reliable

### 2. **Better Error Handling**
- Detailed console logging
- Graceful error handling
- Status updates for debugging

### 3. **Simplified Recording**
- For now, just logs recording (simulated)
- Can be extended later for actual recording
- Focuses on joining meeting successfully

### 4. **Improved Logging**
- Clear console messages with `[BOT]` prefix
- Parameter validation logging
- Step-by-step progress tracking

## 🚀 How to Apply

1. **SSH to VPS**:
   ```bash
   ssh root@147.93.119.85
   ```

2. **Update bot.html**:
   ```bash
   cd puppeteer-worker/public
   # Replace bot.html with the simple version above
   ```

3. **Restart the worker**:
   ```bash
   cd puppeteer-worker
   pm2 restart worker
   ```

4. **Test again**:
   ```bash
   # From your backend
   node test-vps-worker.js
   ```

This simplified version should eliminate the "React is not defined" and "ZoomMtg is not defined" errors! 🎉 