# Zoom AI Bot Frontend

A clean, modern React frontend for managing Zoom AI bots that can join meetings, record audio/video, and transcribe conversations.

## Features

- 🔐 **User Authentication** - Secure login system
- 🤖 **Bot Management** - Start/stop bot with customizable settings
- 📹 **Recording Controls** - Toggle audio/video recording
- 📝 **Transcription** - Automatic meeting transcription
- 📊 **Meeting Dashboard** - View all recorded meetings and transcripts
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/
│   ├── LoginForm.jsx      # User authentication form
│   ├── BotDashboard.jsx   # Main dashboard with bot controls
│   └── Header.jsx         # Simple header component
├── services/
│   └── api.js            # API service for backend communication
├── App.jsx               # Main app component with auth logic
└── main.jsx             # App entry point
```

## API Endpoints

The frontend expects these backend endpoints:

- `POST /api/auth/login` - User authentication
- `GET /api/auth/verify` - Token verification
- `POST /api/bot/start` - Start the bot
- `POST /api/bot/stop` - Stop the bot
- `GET /api/bot/status` - Get bot status
- `GET /api/meetings` - Get user's meetings
- `POST /api/meetings/upload-recording/:id` - Upload meeting recording

## Bot Features

- **Auto Join**: Automatically join meetings when they start
- **Audio Recording**: Record meeting audio
- **Video Recording**: Record meeting video (optional)
- **Transcription**: Generate text transcripts from audio
- **Meeting Management**: View and manage all recorded meetings

## Technologies Used

- **React 19** - Modern React with hooks
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Fetch API** - Modern HTTP client
