const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function inspect() {
  const buf = fs.readFileSync(path.join(__dirname, '../templates/sample_soituoi.pdf'));
  const doc = await PDFDocument.load(buf);
  const page = doc.getPages()[0];
  const { width, height } = page.getSize();
  console.log('Page size:', width, height);
}
inspect();
