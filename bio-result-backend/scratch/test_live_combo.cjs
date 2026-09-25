const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

async function testLiveCombo() {
  const hpvPath = path.join(__dirname, '../templates/sample_hpv23.pdf');
  const cellPath = path.join(__dirname, '../templates/sample_thinprep.pdf');

  const pdfDoc = await PDFDocument.load(fs.readFileSync(hpvPath));
  pdfDoc.registerFontkit(fontkit);

  const cellDoc = await PDFDocument.load(fs.readFileSync(cellPath));
  const [cellPage] = await pdfDoc.copyPages(cellDoc, [0]);
  pdfDoc.addPage(cellPage);

  const fontRegularBytes = fs.readFileSync(path.join(__dirname, '../templates/fonts/arial.ttf'));
  const fontBoldBytes = fs.readFileSync(path.join(__dirname, '../templates/fonts/arialbd.ttf'));
  const fontR = await pdfDoc.embedFont(fontRegularBytes);
  const fontB = await pdfDoc.embedFont(fontBoldBytes);

  console.log('Testing Combo HPV 23 + ThinPrep: Total pages =', pdfDoc.getPageCount());

  const outBytes = await pdfDoc.save();
  const outPath = path.join(__dirname, 'test_live_combo_hpv23_thinprep.pdf');
  fs.writeFileSync(outPath, outBytes);
  console.log('Success! Saved to:', outPath);
}

testLiveCombo().catch(console.error);
