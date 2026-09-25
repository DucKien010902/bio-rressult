const fs = require('fs');
const path = require('path');

const imgPath = path.join(__dirname, '../templates/sample_histology.jpg');
const buf = fs.readFileSync(imgPath);
const b64 = `data:image/jpeg;base64,${buf.toString('base64')}`;

console.log('Image data URI created, length:', b64.length);
