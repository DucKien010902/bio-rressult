import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { PDF_TEMPLATES_CATALOG, PdfService } from '../dist/cases/pdf.service.js';

async function testCase924() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const c = await db.collection('biocases').findOne({ maSo: /924/ });
  console.log('Case from DB:');
  console.log('loaiXetNghiem:', c.loaiXetNghiem);
  console.log('pdfTemplate:', c.pdfTemplate);
  console.log('testType:', c.testType);

  const cat = (c.loaiXetNghiem || '').toLowerCase();
  console.log('cat:', cat);

  const list = PDF_TEMPLATES_CATALOG.filter((t) => t.category === cat);
  console.log('Matching templates in catalog for cat:', list);

  await mongoose.disconnect();
}

testCase924();
