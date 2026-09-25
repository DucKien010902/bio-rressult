const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

async function testFullComboRender() {
  const hpvPath = path.join(__dirname, '../templates/sample_hpv40.pdf');
  const cellPath = path.join(__dirname, '../templates/sample_cell.pdf');

  const pdfDoc = await PDFDocument.load(fs.readFileSync(hpvPath));
  pdfDoc.registerFontkit(fontkit);

  const cellDoc = await PDFDocument.load(fs.readFileSync(cellPath));
  const [cellPage] = await pdfDoc.copyPages(cellDoc, [0]);
  pdfDoc.addPage(cellPage);

  const fontRegularBytes = fs.readFileSync(path.join(__dirname, '../templates/fonts/arial.ttf'));
  const fontBoldBytes = fs.readFileSync(path.join(__dirname, '../templates/fonts/arialbd.ttf'));
  const fontR = await pdfDoc.embedFont(fontRegularBytes);
  const fontB = await pdfDoc.embedFont(fontBoldBytes);

  console.log(`Document has ${pdfDoc.getPageCount()} pages.`);
  console.log('Page 0 size:', pdfDoc.getPages()[0].getSize());
  console.log('Page 1 size:', pdfDoc.getPages()[1].getSize());

  // Test save
  const outBytes = await pdfDoc.save();
  const outPath = path.join(__dirname, 'test_combo_out.pdf');
  fs.writeFileSync(outPath, outBytes);
  console.log('Saved test combo PDF to:', outPath);
}

testFullComboRender().catch(console.error);
