import fs from 'fs';
import path from 'path';

const recordingsDir = path.join(process.cwd(), 'public', 'recordings');

if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
  console.log('✅ Created recordings directory:', recordingsDir);
} else {
  console.log('✅ Recordings directory already exists:', recordingsDir);
}

// Create a .gitkeep file to ensure the directory is tracked
const gitkeepPath = path.join(recordingsDir, '.gitkeep');
if (!fs.existsSync(gitkeepPath)) {
  fs.writeFileSync(gitkeepPath, '');
  console.log('✅ Created .gitkeep file');
} 