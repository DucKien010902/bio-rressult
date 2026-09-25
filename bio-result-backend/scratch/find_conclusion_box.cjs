const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'stream_0.txt'), 'utf8');

const reMatches = content.match(/([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+re/g) || [];
const rects = [];
for (const rm of reMatches) {
  const parts = rm.split(/\s+/);
  rects.push({
    x: parseFloat(parts[0]),
    y: parseFloat(parts[1]),
    w: parseFloat(parts[2]),
    h: parseFloat(parts[3])
  });
}

console.log('Rectangles around conclusion (y=210..270):');
rects.filter(r => r.y >= 200 && r.y <= 270).forEach(r => {
  console.log(`x=${r.x}, y=${r.y}, w=${r.w}, h=${r.h}`);
});
