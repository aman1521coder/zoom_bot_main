# VPS Worker Setup Guide

## 🔧 Environment Variables Required

Add these to your `.env` file:

```env
# VPS Worker Configuration
VPS_WORKER_URL=http://147.93.119.85:5000
VPS_WORKER_SECRET=1234

# Zoom Meeting SDK (for VPS worker)
ZOOM_MEETING_SDK_KEY=your_meeting_sdk_key
ZOOM_MEETING_SDK_SECRET=your_meeting_sdk_secret
```

## 🔄 New Architecture Flow

### 1. Meeting Starts
- Zoom webhook sends `meeting.started` event
- Backend receives webhook and finds user
- Backend sends request to VPS worker

### 2. VPS Worker Launches Bot
- VPS worker receives launch request
- Generates JWT signature for meeting
- Opens Puppeteer browser with Zoom SDK
- Bot joins meeting as participant

### 3. Bot Records Meeting
- Bot records audio using MediaRecorder API
- Audio is captured in real-time
- Recording continues until meeting ends

### 4. Meeting Ends
- Bot detects meeting end
- Stops recording and uploads file
- Sends completion signal to main backend

## 🚀 How to Test

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Check VPS Worker Health
```bash
curl http://147.93.119.85:5000/health
```

### 3. Test Manual Webhook
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

## 🔍 Monitoring

### Backend Logs
```bash
tail -f backend/output.log
```

### VPS Worker Logs
```bash
ssh root@147.93.119.85
cd puppeteer-worker
tail -f worker.log
```

## 🛠️ Troubleshooting

### VPS Worker Not Responding
1. Check if worker is running: `ps aux | grep node`
2. Restart worker: `cd puppeteer-worker && node worker.js`
3. Check firewall: `ufw status`

### Bot Not Joining Meetings
1. Verify SDK credentials in VPS `.env`
2. Check JWT signature generation
3. Verify meeting ID and password

### Recording Issues
1. Check browser permissions on VPS
2. Verify audio capture settings
3. Check file upload permissions

## 📊 Status Endpoints

### Backend Health
```bash
curl http://localhost:5000/health
```

### VPS Worker Health
```bash
curl http://147.93.119.85:5000/health
```

### Active Meetings
```bash
curl http://localhost:5000/api/meetings
``` 