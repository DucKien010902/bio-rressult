const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter(f => f.startsWith('stream_') && f.endsWith('.txt'));

for (const file of files) {
  const content = fs.readFileSync(path.join(__dirname, file), 'latin1');
  // Check for Tj or TJ
  const tjMatches = (content.match(/(\([^\)]+\)|<[^>]+>)\s*(Tj|TJ)/g) || []).length;
  // Check for lines/rectangles
  const reMatches = (content.match(/[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+re/g) || []).length;
  const mMatches = (content.match(/[\d\.\-]+\s+[\d\.\-]+\s+m/g) || []).length;
  console.log(`${file}: length=${content.length}, Tj/TJ count=${tjMatches}, re count=${reMatches}, m count=${mMatches}`);
}
