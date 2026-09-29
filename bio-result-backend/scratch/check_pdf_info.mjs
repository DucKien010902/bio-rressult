import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function check() {
  const bytes = fs.readFileSync('templates/sample_hpv24.pdf');
  const doc = await PDFDocument.load(bytes);
  console.log('Pages:', doc.getPageCount());
  const page = doc.getPage(0);
  console.log('Size:', page.getWidth(), page.getHeight());
}
check();
