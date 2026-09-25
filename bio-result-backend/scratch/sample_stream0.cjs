const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'stream_0.txt'), 'utf8');

// Look for lines or text blocks in stream_0
console.log('Sample of stream_0:', content.substring(0, 2000));
