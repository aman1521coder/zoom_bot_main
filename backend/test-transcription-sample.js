import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple test audio file using text-to-speech
async function createSampleAudio() {
  console.log('Creating sample audio file...');
  
  // We'll create a simple WAV file with silence (as a placeholder)
  // In a real scenario, you'd use a text-to-speech service or a real audio file
  
  // WAV file header for 1 second of silence
  const sampleRate = 44100;
  const duration = 3; // 3 seconds
  const channels = 1;
  const bitsPerSample = 16;
  
  const dataSize = sampleRate * duration * channels * (bitsPerSample / 8);
  const fileSize = dataSize + 36;
  
  const buffer = Buffer.alloc(fileSize + 8);
  let offset = 0;
  
  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  
  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2; // audio format (PCM)
  buffer.writeUInt16LE(channels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), offset); offset += 4;
  buffer.writeUInt16LE(channels * (bitsPerSample / 8), offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
  
  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;
  
  // Write some simple audio data (sine wave)
  for (let i = 0; i < sampleRate * duration; i++) {
    const t = i / sampleRate;
    const frequency = 440; // A4 note
    const amplitude = 0.3;
    const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude * 32767;
    buffer.writeInt16LE(Math.floor(sample), offset);
    offset += 2;
  }
  
  const audioPath = path.join(__dirname, 'test-audio.wav');
  fs.writeFileSync(audioPath, buffer);
  console.log('✅ Sample audio created:', audioPath);
  
  return audioPath;
}

// Test the transcription service directly
async function testTranscriptionDirect(audioPath) {
  console.log('\n=== Testing Direct Transcription ===');
  
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioPath));
    formData.append('model', 'whisper-1');
    
    const apiKey = 'process.env.OPENAI_API_KEY';
    
    console.log('Sending to OpenAI Whisper API...');
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Transcription successful!');
      console.log('Transcribed text:', result.text || '(empty)');
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Transcription failed:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Test via the local API endpoint
async function testTranscriptionAPI(audioPath) {
  console.log('\n=== Testing via Local API ===');
  
  try {
    // Import the transcription service
    const { default: transcriptionService } = await import('./services/transcriptionService.js');
    
    console.log('Processing with transcriptionService...');
    const result = await transcriptionService.processRecording('test-meeting-123', audioPath);
    
    if (result) {
      console.log('✅ API test successful!');
      console.log('Result:', result);
      return true;
    } else {
      console.log('❌ API test failed - no result');
      return false;
    }
  } catch (error) {
    console.error('❌ API Error:', error.message);
    return false;
  }
}

// Run the tests
async function runTests() {
  try {
    // Create sample audio
    const audioPath = await createSampleAudio();
    
    // Test direct API
    const directSuccess = await testTranscriptionDirect(audioPath);
    
    // Test via service
    const apiSuccess = await testTranscriptionAPI(audioPath);
    
    // Cleanup
    fs.unlinkSync(audioPath);
    console.log('\n✅ Test audio file cleaned up');
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log('Direct API test:', directSuccess ? '✅ PASSED' : '❌ FAILED');
    console.log('Service API test:', apiSuccess ? '✅ PASSED' : '❌ FAILED');
    
    if (!directSuccess) {
      console.log('\n⚠️  The API key might be invalid or expired.');
      console.log('Please check: https://platform.openai.com/api-keys');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
console.log('🎯 Starting Transcription Tests...\n');
runTests(); 