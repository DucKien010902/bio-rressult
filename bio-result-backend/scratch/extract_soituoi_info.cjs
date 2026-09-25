const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const pdfPath = path.join(__dirname, '../templates/sample_soituoi.pdf');
const buf = fs.readFileSync(pdfPath);
const str = buf.toString('latin1');

// Extract all text stream contents
const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
let match;
let streamIdx = 0;
while ((match = streamRegex.exec(str)) !== null) {
  let streamData = Buffer.from(match[1], 'latin1');
  try {
    const decompressed = zlib.inflateSync(streamData).toString('latin1');
    console.log(`--- Decompressed Stream ${streamIdx} (${decompressed.length} bytes) ---`);
    fs.writeFileSync(path.join(__dirname, `stream_${streamIdx}.txt`), decompressed);
  } catch (e) {
    // not deflate
    // console.log(`Stream ${streamIdx} not deflate`);
  }
  streamIdx++;
}
console.log('Done decompressing streams');
