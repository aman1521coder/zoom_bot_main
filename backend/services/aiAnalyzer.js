// services/aiAnalyzer.js
import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Transcribes an audio file using OpenAI's Whisper model.
 * @param {string} audioFilePath - The path to the local audio file.
 * @returns {Promise<string>} The transcribed text.
 */

export async function transcribeAudioFile(audioFilePath) {
  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file not found at: ${audioFilePath}`);
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1', // Powerful and accurate model
    });
    return transcription.text;
  } catch (error) {
    console.error("Error transcribing audio with OpenAI Whisper:", error);
    throw new Error("AI transcription failed.");
  }
}

/**
 * Analyzes a transcript to produce a summary and action items.
 * @param {string} transcript - The meeting transcript text.
 * @returns {Promise<object>} An object with summary and actionItems.
 */
export async function analyzeTranscript(transcript) {
  if (!transcript) {
    return { summary: "No transcript available.", actionItems: [] };
  }
  const prompt = `
    Analyze the following meeting transcript and provide the output in a JSON object with two keys: "summary" and "actionItems".
    - "summary": A concise, neutral summary of the key topics, discussions, and decisions.
    - "actionItems": An array of strings, where each string is a clear, actionable task assigned during the meeting. Start each item with a verb. If no action items are found, return an empty array.

    Transcript:
    ---
    ${transcript.substring(0, 15000)}
    ---
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing transcript with OpenAI:", error);
    throw new Error("AI analysis failed.");
  }
}
