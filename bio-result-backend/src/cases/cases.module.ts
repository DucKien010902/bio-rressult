import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BioCase, BioCaseSchema } from './schemas/case.schema.js';
import { CasesService } from './cases.service.js';
import { CasesController } from './cases.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BioCase.name, schema: BioCaseSchema }]),
  ],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService],
})
export class CasesModule {}
