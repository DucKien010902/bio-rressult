const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'stream_0.txt'), 'utf8');

// Regex to find BT ... ET blocks
const btRegex = /BT([\s\S]*?)ET/g;
let btMatch;

const textItems = [];

while ((btMatch = btRegex.exec(content)) !== null) {
  const block = btMatch[1];
  
  // Find Tm: 1 0 0 1 x y Tm or a b c d e f Tm
  const tmMatch = block.match(/([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+Tm/);
  // Find Tf: /Font size Tf
  const tfMatch = block.match(/\/(\w+)\s+([\d\.\-]+)\s+Tf/);
  
  let x = 0, y = 0;
  if (tmMatch) {
    x = parseFloat(tmMatch[5]);
    y = parseFloat(tmMatch[6]);
  }
  
  // Extract text from TJ: [(...)...] TJ or (...) Tj
  let text = '';
  const tjMatch = block.match(/\[([\s\S]*?)\]\s*TJ/);
  if (tjMatch) {
    const parts = tjMatch[1].match(/\(([^)]*)\)/g);
    if (parts) {
      text = parts.map(p => p.slice(1, -1)).join('');
    }
  } else {
    const simpleTj = block.match(/\(([^)]*)\)\s*Tj/);
    if (simpleTj) {
      text = simpleTj[1];
    }
  }
  
  if (text.trim()) {
    textItems.push({
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      font: tfMatch ? tfMatch[1] : '',
      size: tfMatch ? parseFloat(tfMatch[2]) : 0,
      text: text.trim()
    });
  }
}

// Group or sort text items by Y descending
textItems.sort((a, b) => b.y - a.y || a.x - b.x);

console.log(`Extracted ${textItems.length} text items:`);
for (const item of textItems) {
  console.log(`y=${item.y.toFixed(1)}, x=${item.x.toFixed(1)}, size=${item.size}: "${item.text}"`);
}
