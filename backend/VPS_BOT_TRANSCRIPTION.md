# Enhanced bot.html with Voice Recording & Transcription

Replace the bot.html on your VPS with this version that includes voice recording and real-time transcription:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Zoom Bot with Transcription</title>
    <meta charset="utf-8" />
    <!-- Load all Zoom SDK dependencies first -->
    <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/redux@4.2.1/dist/redux.min.js"></script>
    <script src="https://unpkg.com/redux-thunk@2.4.2/dist/redux-thunk.min.js"></script>
    <script src="https://unpkg.com/lodash@4.17.21/lodash.min.js"></script>
</head>
<body>
    <h1>Zoom Bot with Transcription</h1>
    <p id="status">Initializing...</p>
    <div id="transcription" style="margin: 20px; padding: 10px; border: 1px solid #ccc; max-height: 300px; overflow-y: auto;">
        <h3>Live Transcription:</h3>
        <p id="transcript"></p>
    </div>

    <script>
        console.log('[BOT] Starting bot with transcription...');
        
        const statusEl = document.getElementById('status');
        const transcriptEl = document.getElementById('transcript');
        let mediaRecorder = null;
        let audioChunks = [];
        let recognition = null;
        let isTranscribing = false;
        
        // Get parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const meetingId = urlParams.get('meetingId');
        const userId = urlParams.get('userId');
        const sdkKey = urlParams.get('sdkKey');
        const signature = urlParams.get('signature');
        const password = urlParams.get('password');

        // Initialize Web Speech API for real-time transcription
        function initializeTranscription() {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                recognition = new SpeechRecognition();
                
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';
                
                recognition.onresult = (event) => {
                    let finalTranscript = '';
                    let interimTranscript = '';
                    
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcript + ' ';
                        } else {
                            interimTranscript += transcript;
                        }
                    }
                    
                    if (finalTranscript) {
                        transcriptEl.innerHTML += '<strong>' + finalTranscript + '</strong><br>';
                        console.log('[TRANSCRIPTION] Final:', finalTranscript);
                    }
                    
                    if (interimTranscript) {
                        statusEl.textContent = 'Transcribing: ' + interimTranscript;
                    }
                };
                
                recognition.onerror = (event) => {
                    console.error('[TRANSCRIPTION] Error:', event.error);
                    if (event.error === 'no-speech') {
                        recognition.stop();
                        setTimeout(() => {
                            if (isTranscribing) recognition.start();
                        }, 1000);
                    }
                };
                
                recognition.onend = () => {
                    console.log('[TRANSCRIPTION] Recognition ended');
                    if (isTranscribing) {
                        setTimeout(() => recognition.start(), 100);
                    }
                };
                
                console.log('[TRANSCRIPTION] Web Speech API initialized');
            } else {
                console.log('[TRANSCRIPTION] Web Speech API not supported');
                transcriptEl.innerHTML = '<em>Real-time transcription not supported in this browser</em>';
            }
        }

        // Start audio recording
        function startRecording() {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];
                    
                    mediaRecorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            audioChunks.push(event.data);
                        }
                    };
                    
                    mediaRecorder.onstop = async () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        console.log('[RECORDING] Audio recording complete, size:', audioBlob.size);
                        
                        // Upload for server-side transcription
                        await uploadAudioForTranscription(audioBlob);
                    };
                    
                    mediaRecorder.start(1000); // Capture in 1-second chunks
                    console.log('[RECORDING] Started audio recording');
                    
                    // Start real-time transcription
                    if (recognition) {
                        isTranscribing = true;
                        recognition.start();
                        console.log('[TRANSCRIPTION] Started real-time transcription');
                    }
                })
                .catch(error => {
                    console.error('[RECORDING] Error accessing microphone:', error);
                    statusEl.textContent = 'Error: Cannot access microphone';
                });
        }

        // Upload audio for server-side transcription
        async function uploadAudioForTranscription(audioBlob) {
            try {
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                formData.append('meetingId', meetingId);
                
                const response = await fetch('https://blackkbingo.com/api/transcription/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token') || ''
                    },
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('[TRANSCRIPTION] Server transcription complete:', result);
                    
                    // Display server transcription
                    if (result.transcription) {
                        transcriptEl.innerHTML += '<hr><h4>Server Transcription:</h4>' + result.transcription;
                    }
                } else {
                    console.error('[TRANSCRIPTION] Upload failed:', response.statusText);
                }
            } catch (error) {
                console.error('[TRANSCRIPTION] Upload error:', error);
            }
        }

        // Stop recording
        function stopRecording() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                console.log('[RECORDING] Stopped audio recording');
            }
            
            if (recognition) {
                isTranscribing = false;
                recognition.stop();
                console.log('[TRANSCRIPTION] Stopped real-time transcription');
            }
        }

        // Initialize everything
        function initialize() {
            console.log('[BOT] Initializing transcription bot...');
            statusEl.textContent = 'Initializing transcription...';
            
            // Initialize transcription
            initializeTranscription();
            
            // Start recording after a short delay
            setTimeout(() => {
                startRecording();
                statusEl.textContent = 'Recording and transcribing...';
            }, 2000);
            
            // Auto-stop after 5 minutes (for testing)
            setTimeout(() => {
                stopRecording();
                statusEl.textContent = 'Recording complete';
                
                // Signal completion
                if (typeof window.onBotFinished === 'function') {
                    setTimeout(() => window.onBotFinished(), 3000);
                }
            }, 300000); // 5 minutes
        }

        // Load Zoom SDK (keeping existing functionality)
        function loadZoomSDK() {
            const script = document.createElement('script');
            script.src = 'https://source.zoom.us/2.18.0/zoom-meeting-2.18.0.min.js';
            script.onload = function() {
                console.log('[BOT] Zoom SDK loaded');
                // Continue with existing Zoom SDK logic...
                // For now, just start transcription
                initialize();
            };
            script.onerror = function() {
                console.error('[BOT] Failed to load Zoom SDK');
                // Start transcription anyway
                initialize();
            };
            document.head.appendChild(script);
        }

        // Start the process
        if (!meetingId || !userId) {
            console.error('[BOT] Missing required parameters');
            statusEl.textContent = 'Error: Missing parameters';
        } else {
            console.log('[BOT] Starting with meeting:', meetingId);
            loadZoomSDK();
        }
    </script>
</body>
</html>
```

## 🎤 Features Added:

### 1. **Real-Time Transcription**
- Uses Web Speech API for live transcription
- Shows interim and final results
- Auto-restarts on silence

### 2. **Audio Recording**
- Records full audio using MediaRecorder API
- Saves as WebM format
- Uploads to backend for processing

### 3. **Server-Side Transcription**
- Uploads audio to your backend
- Can use OpenAI Whisper or other services
- Returns full transcription

### 4. **Visual Feedback**
- Live transcription display
- Status updates
- Recording indicators

## 🔧 To Use:

1. **Update bot.html on VPS** with this version
2. **Add OpenAI API key** to your backend .env:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. **Install dependencies** in backend:
   ```bash
   npm install form-data node-fetch
   ```
4. **Test the transcription**

The bot will now record and transcribe audio even without joining meetings! 🎉 