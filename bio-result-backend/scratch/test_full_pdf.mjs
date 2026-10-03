import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
dotenv.config();

// Test embed JPG signature logic from cell-pdf.service.ts directly
async function testFullPdf() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const caseItem = await db.collection('biocases').findOne({ maSo: 'GTHD-CELL-857' });
  console.log('Testing PDF signature embed for case:', caseItem.maSo);

  const docLanh2 = await db.collection('doctors').findOne({ code: 'bacsi_lanh2' });
  const sigUrl = docLanh2.signatureUrl;

  console.log('Signature URL:', sigUrl);

  const tPath = path.join(process.cwd(), 'templates', 'sample_cell.pdf');
  const tBytes = fs.readFileSync(tPath);
  const pdfDoc = await PDFDocument.load(tBytes);
  const pg = pdfDoc.getPages()[0];

  const res = await fetch(sigUrl);
  const ab = await res.arrayBuffer();
  const sigBuffer = Buffer.from(ab);

  console.log('Downloaded sigBuffer size:', sigBuffer.length);

  const isPng = sigBuffer.length > 4 && sigBuffer[0] === 0x89 && sigBuffer[1] === 0x50 && sigBuffer[2] === 0x4e && sigBuffer[3] === 0x47;
  console.log('isPng:', isPng);

  let embeddedSig;
  if (isPng) {
    embeddedSig = await pdfDoc.embedPng(sigBuffer);
  } else {
    embeddedSig = await pdfDoc.embedJpg(sigBuffer);
  }

  const { width: origW, height: origH } = embeddedSig.size();
  console.log('Signature dimensions in PDF:', origW, 'x', origH);

  const targetH = 45;
  let targetW = (origW / origH) * targetH;
  if (targetW > 180) targetW = 180;

  const docCenterX = 445;
  const sigX = docCenterX - targetW / 2;
  const sigY = 106.0 - targetH / 2;

  pg.drawImage(embeddedSig, {
    x: sigX,
    y: sigY,
    width: targetW,
    height: targetH,
  });

  const pdfResultBytes = await pdfDoc.save();
  fs.writeFileSync('scratch/test_output.pdf', pdfResultBytes);
  console.log('=== THÀNH CÔNG: Đã xuất thử file PDF ra scratch/test_output.pdf (Kích thước:', pdfResultBytes.length, 'bytes) ===');

  await mongoose.disconnect();
}

testFullPdf().catch(console.error);
