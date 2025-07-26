# Minimal bot.html for VPS (No Dependencies)

Replace the current `bot.html` in `/puppeteer-worker/public/` with this minimal version:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Zoom Bot</title>
    <meta charset="utf-8" />
</head>
<body>
    <h1>Zoom Bot</h1>
    <p id="status">Initializing...</p>

    <script>
        console.log('[BOT] Starting minimal bot...');
        
        const statusEl = document.getElementById('status');
        
        // Get parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const meetingId = urlParams.get('meetingId');
        const userId = urlParams.get('userId');
        const sdkKey = urlParams.get('sdkKey');
        const signature = urlParams.get('signature');
        const password = urlParams.get('password');

        console.log('[BOT] Parameters received:', { 
            meetingId, 
            userId, 
            sdkKey: sdkKey ? 'found' : 'missing',
            signature: signature ? 'found' : 'missing'
        });

        // Update status
        statusEl.textContent = "Parameters received. Checking Zoom SDK...";

        // Try to load Zoom SDK
        const script = document.createElement('script');
        script.src = 'https://source.zoom.us/2.18.0/zoom-meeting-2.18.0.min.js';
        script.onload = function() {
            console.log('[BOT] Zoom SDK loaded successfully');
            statusEl.textContent = "Zoom SDK loaded. Initializing...";
            initializeBot();
        };
        script.onerror = function() {
            console.error('[BOT] Failed to load Zoom SDK');
            statusEl.textContent = "Failed to load Zoom SDK";
        };
        document.head.appendChild(script);

        function initializeBot() {
            try {
                console.log('[BOT] Initializing Zoom SDK...');
                
                // Check if ZoomMtg is available
                if (typeof ZoomMtg === 'undefined') {
                    throw new Error('ZoomMtg not available');
                }

                // Set up Zoom SDK
                ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
                ZoomMtg.preLoadWasm();
                ZoomMtg.prepareWebSDK();

                console.log('[BOT] SDK assets loaded');

                // Initialize SDK
                ZoomMtg.init({
                    leaveUrl: "about:blank",
                    isSupportAV: true,
                    success: function() {
                        console.log('[BOT] SDK initialized successfully');
                        statusEl.textContent = "SDK initialized. Joining meeting...";
                        joinMeeting();
                    },
                    error: function(error) {
                        console.error('[BOT] SDK initialization failed:', error);
                        statusEl.textContent = "SDK initialization failed";
                    }
                });

            } catch (error) {
                console.error('[BOT] Error in initializeBot:', error);
                statusEl.textContent = "Error initializing bot: " + error.message;
            }
        }

        function joinMeeting() {
            try {
                console.log('[BOT] Attempting to join meeting:', meetingId);
                
                ZoomMtg.join({
                    meetingNumber: meetingId,
                    signature: signature,
                    sdkKey: sdkKey,
                    userName: 'AI Assistant',
                    passWord: password || '',
                    userEmail: `bot+${userId}@zoom-assistant.app`,
                    success: function() {
                        console.log('[BOT] Successfully joined meeting');
                        statusEl.textContent = "Successfully joined meeting!";
                        
                        // Set up meeting status listener
                        ZoomMtg.getMeetingStatus().addEventListener('meeting-status', function(payload) {
                            console.log('[BOT] Meeting status changed:', payload.meetingStatus);
                            if (payload.meetingStatus === 2) {
                                console.log('[BOT] Meeting ended');
                                statusEl.textContent = "Meeting ended. Bot shutting down.";
                                setTimeout(() => {
                                    if (typeof window.onBotFinished === 'function') {
                                        window.onBotFinished();
                                    }
                                }, 3000);
                            }
                        });
                    },
                    error: function(err) {
                        console.error('[BOT] Failed to join meeting:', err);
                        statusEl.textContent = "Failed to join meeting: " + err.errorCode;
                    }
                });

            } catch (error) {
                console.error('[BOT] Error in joinMeeting:', error);
                statusEl.textContent = "Error joining meeting: " + error.message;
            }
        }

        // Check if we have all required parameters
        if (!meetingId || !userId || !sdkKey || !signature) {
            console.error('[BOT] Missing required parameters');
            statusEl.textContent = "Error: Missing required parameters";
        } else {
            console.log('[BOT] All parameters present, starting bot...');
        }
    </script>
</body>
</html>
```

## 🔧 Key Features

### 1. **Dynamic SDK Loading**
- Loads Zoom SDK dynamically
- Handles loading errors gracefully
- No hard dependencies

### 2. **Step-by-Step Initialization**
- Clear status updates
- Detailed console logging
- Error handling at each step

### 3. **Minimal Dependencies**
- No React, Redux, or other libraries
- Pure JavaScript implementation
- Focuses on core functionality

### 4. **Better Error Messages**
- Clear status updates
- Detailed console logging
- Easy to debug

## 🚀 How to Apply

1. **SSH to VPS**:
   ```bash
   ssh root@147.93.119.85
   ```

2. **Update bot.html**:
   ```bash
   cd puppeteer-worker/public
   # Replace bot.html with the minimal version above
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

This minimal version should eliminate all dependency issues and focus on the core functionality! 🎉 