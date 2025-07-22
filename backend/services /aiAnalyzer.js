// services/aiAnalyzer.js
import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
