const fs = require('fs');
const path = require('path');

const streamFiles = fs.readdirSync(path.join(__dirname)).filter(f => f.startsWith('stream_') && f.endsWith('.txt'));

for (const f of streamFiles) {
  const content = fs.readFileSync(path.join(__dirname, f), 'latin1');
  if (content.includes('TƯƠI') || content.includes('Bạch cầu') || content.includes('PHIẾU') || content.includes('bệnh nhân')) {
    console.log(`Found text in ${f}! Length: ${content.length}`);
  }
}
