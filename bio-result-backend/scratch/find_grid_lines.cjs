const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'stream_0.txt'), 'utf8');

// Find all 're' commands
const reMatches = content.match(/([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+re/g) || [];
console.log(`Found ${reMatches.length} re commands`);

const rects = [];
for (const rm of reMatches) {
  const parts = rm.split(/\s+/);
  const x = parseFloat(parts[0]);
  const y = parseFloat(parts[1]);
  const w = parseFloat(parts[2]);
  const h = parseFloat(parts[3]);
  rects.push({ x, y, w, h });
}

// Find rects with y between 550 and 750 (patient info table)
console.log('--- Rectangles in Patient Info area (550 - 730) ---');
rects.filter(r => r.y >= 550 && r.y <= 730).forEach(r => {
  console.log(`x=${r.x}, y=${r.y}, w=${r.w}, h=${r.h}`);
});

// Find rects in Table area (250 - 520)
console.log('--- Rectangles in Table area (250 - 520) ---');
rects.filter(r => r.y >= 250 && r.y <= 520 && (r.w > 10 || r.h > 10)).forEach(r => {
  console.log(`x=${r.x}, y=${r.y}, w=${r.w}, h=${r.h}`);
});

// Also check lines drawn with m and l
const mlRegex = /([\d\.\-]+)\s+([\d\.\-]+)\s+m\s+([\d\.\-]+)\s+([\d\.\-]+)\s+l/g;
let mlMatch;
console.log('--- Lines (m ... l) ---');
while ((mlMatch = mlRegex.exec(content)) !== null) {
  console.log(`Line from (${mlMatch[1]}, ${mlMatch[2]}) to (${mlMatch[3]}, ${mlMatch[4]})`);
}
