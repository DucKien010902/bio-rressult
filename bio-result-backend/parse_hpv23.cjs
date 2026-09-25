const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('templates/sample_hpv23.pdf');
const str = buf.toString('latin1');
const streamMatches = [...str.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)];

const items = [];
streamMatches.forEach((m) => {
  try {
    const raw = Buffer.from(m[1], 'latin1');
    const dec = zlib.inflateSync(raw).toString('utf-8');
    const lines = dec.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.endsWith('Tm')) {
        const parts = l.trim().split(/\s+/);
        const x = parseFloat(parts[4]);
        const y = parseFloat(parts[5]);
        let text = '';
        for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
          if (lines[j].endsWith('Tj') || lines[j].endsWith('TJ')) {
            text += lines[j] + ' ';
            break;
          }
        }
        items.push({ x, y, text: text.trim() });
      }
    }
  } catch(e) {}
});

// Group by Y (within 2 points)
const groups = [];
items.sort((a,b) => b.y - a.y);

items.forEach(it => {
  let g = groups.find(group => Math.abs(group.y - it.y) <= 2.5);
  if (!g) {
    g = { y: it.y, items: [] };
    groups.push(g);
  }
  g.items.push(it);
});

groups.forEach(g => {
  g.items.sort((a,b) => a.x - b.x);
  const desc = g.items.map(r => `[x=${r.x.toFixed(1)}: ${r.text}]`).join(' ');
  console.log(`Y=${g.y.toFixed(1)}: ${desc}`);
});
