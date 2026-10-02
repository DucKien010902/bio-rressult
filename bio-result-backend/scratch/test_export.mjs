import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

import { Test } from '@nestjs/testing';
import { AppModule } from '../dist/app.module.js';
import { PdfService } from '../dist/cases/pdf.service.js';

async function testPdf() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const caseItem = await db.collection('biocases').findOne({ maSo: /924/ });

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const pdfService = moduleRef.get(PdfService);
  const buf = await pdfService.generateCasePdf(caseItem);
  fs.writeFileSync('scratch/case924_test.pdf', buf);
  console.log('Written scratch/case924_test.pdf, length:', buf.length);

  await moduleRef.close();
  await mongoose.disconnect();
}

testPdf().catch(console.error);
