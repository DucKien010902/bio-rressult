const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

async function testCombo() {
  const comboTypes = [
    'combo_hpv20_cell',
    'combo_hpv40_cell',
    'combo_hpv23_cell',
    'combo_hpv20_thinprep',
    'combo_hpv40_thinprep',
    'combo_hpv23_thinprep',
  ];

  console.log('Testing 6 combo types...');

  for (const cat of comboTypes) {
    const hpvCat = cat.includes('hpv40')
      ? 'hpv40'
      : cat.includes('hpv23')
      ? 'hpv23'
      : 'hpv20';

    const isThinprep = cat.includes('thinprep');

    const hpvTemplate = hpvCat === 'hpv40'
      ? 'sample_hpv40.pdf'
      : hpvCat === 'hpv23'
      ? 'sample_hpv23.pdf'
      : 'sample_hpv20.pdf';

    const cellTemplate = isThinprep ? 'sample_thinprep.pdf' : 'sample_cell.pdf';

    const hpvPath = path.join(__dirname, '../templates', hpvTemplate);
    const cellPath = path.join(__dirname, '../templates', cellTemplate);

    const docHpv = await PDFDocument.load(fs.readFileSync(hpvPath));
    const docCell = await PDFDocument.load(fs.readFileSync(cellPath));

    const [cellPage] = await docHpv.copyPages(docCell, [0]);
    docHpv.addPage(cellPage);

    console.log(`Success merging ${cat}: ${hpvTemplate} + ${cellTemplate} -> ${docHpv.getPageCount()} pages`);
  }
}

testCombo().catch(console.error);
