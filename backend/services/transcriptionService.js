import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

class TranscriptionService {
  constructor() {
    // You can use OpenAI Whisper, Google Speech-to-Text, or any other service
    this.apiKey = process.env.OPENAI_API_KEY || '';
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

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
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