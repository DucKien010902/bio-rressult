const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'stream_0.txt'), 'utf8');

const reMatches = content.match(/([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+re/g) || [];

const rects = [];
for (const rm of reMatches) {
  const parts = rm.split(/\s+/);
  const x = parseFloat(parts[0]);
  const y = parseFloat(parts[1]);
  const w = parseFloat(parts[2]);
  const h = parseFloat(parts[3]);
  rects.push({ x, y, w, h });
}

// Check vertical lines or borders in patient area (x < 600, 560 <= y <= 730)
console.log('Vertical lines or thin rects in patient area:');
rects.filter(r => r.y >= 560 && r.y <= 730 && (r.w < 2 || r.h < 2)).forEach(r => {
  console.log(`x=${r.x}, y=${r.y}, w=${r.w}, h=${r.h}`);
});

// Also check background rects or cell rects in patient area
console.log('Cell rects in patient area:');
rects.filter(r => r.y >= 560 && r.y <= 730 && r.w > 2 && r.h > 2).forEach(r => {
  console.log(`x=${r.x}, y=${r.y}, w=${r.w}, h=${r.h}`);
});
