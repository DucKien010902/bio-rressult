import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BioCase, BioCaseSchema } from './schemas/case.schema.js';
import { CasesService } from './cases.service.js';
import { CasesController } from './cases.controller.js';
import { PdfService } from './pdf.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BioCase.name, schema: BioCaseSchema }]),
  ],
  controllers: [CasesController],
  providers: [CasesService, PdfService],
  exports: [CasesService, PdfService],
})
export class CasesModule {}

