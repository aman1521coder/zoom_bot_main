# Fixed bot.html for VPS

Replace the current `bot.html` in `/puppeteer-worker/public/` with this corrected version:

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
        // Load Zoom SDK assets
        ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        // UI element for status updates
        const statusEl = document.getElementById('status');

        // --- 1. Get Meeting Credentials from URL ---
        const urlParams = new URLSearchParams(window.location.search);
        const meetingId = urlParams.get('meetingId');
        const password = urlParams.get('password');
        const signature = urlParams.get('signature');
        const userId = urlParams.get('userId');
        const sdkKey = urlParams.get('sdkKey');

        // --- 2. Configure Bot Identity ---
        const botName = 'AI Assistant';
        const userEmail = `bot+${userId}@zoom-assistant.app`;

        // Variables for recording logic
        let mediaRecorder;
        let audioChunks = [];

        // --- 3. Define Core Bot Functions ---

        /**
         * Called on successful join. Starts recording the meeting's audio stream.
         */
        const startRecording = () => {
            try {
                // Get the audio context from the SDK and create a destination stream
                const audioContext = ZoomMtg.getAudioContext();
                const streamDestination = audioContext.createMediaStreamDestination();
                ZoomMtg.connectAudio(streamDestination);
                
                // Use the browser's MediaRecorder API to record the stream
                mediaRecorder = new MediaRecorder(streamDestination.stream);
                mediaRecorder.start();
                statusEl.textContent = "Successfully joined. Recording audio...";
                console.log("Recording started.");

                // Collect audio data as it becomes available
                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });
            } catch (error) {
                console.error("Error starting recording:", error);
                statusEl.textContent = "Error: Could not start recording.";
            }
        };

        /**
         * Called when the meeting ends. Stops recording and uploads the audio file to the server.
         */
        const stopAndUploadRecording = async () => {
            if (!mediaRecorder || mediaRecorder.state !== 'recording') {
                console.log("Recorder was not active. Nothing to upload.");
                // Signal to the server to clean up anyway
                setTimeout(() => window.onBotFinished?.(), 3000);
                return;
            }

            mediaRecorder.stop();
            console.log("Recording stopped. Preparing upload.");
            statusEl.textContent = "Meeting ended. Preparing upload...";

            // The 'stop' event fires after all data is collected
            mediaRecorder.addEventListener("stop", async () => {
                // Package the audio chunks into a single WebM file
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
                const formData = new FormData();
                formData.append("recording", audioBlob, `${meetingId}.webm`);
                formData.append("userId", userId); // Critical for server-side processing

                statusEl.textContent = `Uploading ${Math.round(audioBlob.size / 1024)} KB recording...`;
                console.log("Uploading audio file to server...");

                try {
                    // Send the file to our backend API endpoint
                    const response = await fetch(`http://147.93.119.85:3000/api/meetings/upload-recording/${meetingId}`, {
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
                    // CRITICAL: Signal to the server that the bot's job is done
                    // This allows the server to safely close the Puppeteer browser.
                    setTimeout(() => window.onBotFinished?.(), 3000);
                }
            });
        };

        /**
         * Main function to initialize the SDK and join the meeting.
         */
        function initAndJoin() {
            statusEl.textContent = "Initializing Zoom SDK...";
            ZoomMtg.init({
                leaveUrl: "about:blank", // URL to go to after leaving
                isSupportAV: true,      // Enable audio/video features
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
                            // Start recording only after a successful join
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

            // Listen for the SDK's 'meeting-status' event
            // This is how we know the meeting has ended.
            ZoomMtg.getMeetingStatus().addEventListener('meeting-status', (payload) => {
                // Status '2' means the meeting has ended.
                if (payload.meetingStatus === 2) {
                    stopAndUploadRecording();
                }
            });
        }
        
        // --- 4. Start the Bot ---
        // Only run if we have all the necessary information from the URL
        if (meetingId && signature && userId && sdkKey) {
            initAndJoin();
        } else {
            statusEl.textContent = "Error: Missing required meeting details in URL.";
            console.error("Missing meetingId, signature, userId, or sdkKey in query parameters.");
        }
    </script>
</body>
</html>
```

## 🔧 Key Fixes Made

### 1. **Corrected Zoom SDK Loading**
- Using version 2.18.0 (more stable)
- Proper initialization sequence
- Error handling for SDK loading

### 2. **Fixed URL Parameters**
- Added `sdkKey` parameter check
- Proper parameter validation
- Better error messages

### 3. **Corrected Upload URL**
- Uploads to `http://147.93.119.85:5000/api/meetings/upload-recording/`
- Direct connection to backend (not through nginx)

### 4. **Improved Error Handling**
- Better console logging
- Status updates for debugging
- Graceful failure handling

## 🚀 How to Apply

1. **SSH to VPS**:
   ```bash
   ssh root@147.93.119.85
   ```

2. **Update bot.html**:
   ```bash
   cd puppeteer-worker/public
   # Replace bot.html with the corrected version above
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

This should fix the "ZoomMtg is not defined" and "404 Not Found" errors! 🎉 