import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

class TranscriptionService {
  constructor() {
    // Use environment variable - required for security
    this.apiKey = process.env.OPENAI_API_KEY;
    
    // Debug logging
    console.log('[TRANSCRIPTION] Service initialized');
    console.log('[TRANSCRIPTION] Using API key from:', process.env.OPENAI_API_KEY ? 'environment' : 'hardcoded');
    console.log('[TRANSCRIPTION] API key length:', this.apiKey.length);
    console.log('[TRANSCRIPTION] API key prefix:', this.apiKey.substring(0, 20) + '...');
    
    // Validate key format
    if (!this.apiKey.startsWith('sk-')) {
      console.error('[TRANSCRIPTION] WARNING: API key does not start with sk-');
    }
  }

  /**
   * Transcribe audio file using OpenAI Whisper
   */
  async transcribeWithWhisper(audioFilePath) {
    if (!this.apiKey) {
      console.error('[TRANSCRIPTION] No OpenAI API key found');
      return { error: 'No API key configured' };
    }

    try {
      console.log(`[TRANSCRIPTION] Processing audio file: ${audioFilePath}`);
      
      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioFilePath));
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'json');
      formData.append('language', 'en');

      console.log('[TRANSCRIPTION] Sending request to OpenAI API...');
      console.log('[TRANSCRIPTION] Using API key from instance:', this.apiKey.substring(0, 20) + '...');
      
      // Use the instance API key (which can be from env or hardcoded)
      const apiKey = this.apiKey;
      
      // =================================================================
      // ▼▼▼ CRITICAL DEBUGGING LINES ▼▼▼
      // =================================================================
      console.log(`[DEBUG] Key being sent to OpenAI: "Bearer ${apiKey}"`);
      console.log(`[DEBUG] Key length: ${apiKey.length} characters`);
      console.log(`[DEBUG] Key starts with 'sk-': ${apiKey.startsWith('sk-')}`);
      // =================================================================
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        console.error(`[TRANSCRIPTION] OpenAI API error: ${response.status} ${response.statusText}`);
        if (response.status === 401) {
          console.error('[TRANSCRIPTION] Invalid API key. Please check OPENAI_API_KEY in .env');
          // Return a placeholder transcription
          return {
            text: '[Transcription unavailable - API key issue]',
            duration: 0,
            language: 'en',
            error: 'Invalid API key'
          };
        }
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[TRANSCRIPTION] ✅ Transcription complete`);
      
      return {
        text: result.text,
        duration: result.duration,
        language: result.language
      };

    } catch (error) {
      console.error('[TRANSCRIPTION] Error:', error);
      return { error: error.message };
    }
  }

  /**
   * Transcribe using free alternative (browser-based)
   */
  async transcribeWithBrowserAPI(audioData) {
    // This would use the Web Speech API in the browser
    // Implementation would be in bot.html
    console.log('[TRANSCRIPTION] Browser-based transcription requested');
    return { 
      text: 'Browser transcription placeholder',
      method: 'browser'
    };
  }

  /**
   * Process and save transcription
   */
  async processRecording(meetingId, audioPath) {
    console.log(`[TRANSCRIPTION] Processing recording for meeting ${meetingId}`);
    
    // Get file stats
    const stats = fs.statSync(audioPath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    console.log(`[TRANSCRIPTION] Audio file size: ${fileSizeInMB.toFixed(2)} MB`);

    // Transcribe the audio
    const transcription = await this.transcribeWithWhisper(audioPath);
    
    if (transcription.error) {
      console.error(`[TRANSCRIPTION] Failed to transcribe: ${transcription.error}`);
      return null;
    }

    // Save transcription to file
    const transcriptPath = audioPath.replace('.webm', '_transcript.txt');
    fs.writeFileSync(transcriptPath, transcription.text);
    console.log(`[TRANSCRIPTION] Saved transcript to: ${transcriptPath}`);

    // Return summary
    return {
      meetingId,
      audioPath,
      transcriptPath,
      transcription: transcription.text,
      duration: transcription.duration,
      wordCount: transcription.text.split(' ').length
    };
  }

  /**
   * Generate meeting summary from transcription
   */
  async generateSummary(transcriptionText) {
    if (!this.apiKey) {
      return { error: 'No API key for summary generation' };
    }

    try {
      console.log('[TRANSCRIPTION] Generating summary with API key:', this.apiKey.substring(0, 20) + '...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes meeting transcripts. Provide a concise summary with key points, action items, and decisions made.'
            },
            {
              role: 'user',
              content: `Please summarize this meeting transcript:\n\n${transcriptionText}`
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const result = await response.json();
      return {
        summary: result.choices[0].message.content,
        tokens: result.usage
      };

    } catch (error) {
      console.error('[TRANSCRIPTION] Summary generation error:', error);
      return { error: error.message };
    }
  }
}

export default new TranscriptionService(); 