import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { BioCase, BioCaseSchema } from './schemas/case.schema.js';
import { CasesService } from './cases.service.js';
import { CasesController } from './cases.controller.js';
import { PdfService } from './pdf.service.js';
import { AuthModule } from '../auth/auth.module.js';

import { BasePdfService } from './pdf-services/base-pdf.service.js';
import { CellPdfService } from './pdf-services/cell-pdf.service.js';
import { HpvPdfService } from './pdf-services/hpv-pdf.service.js';
import { SoituoiPdfService } from './pdf-services/soituoi-pdf.service.js';
import { GiaiphaubenhPdfService } from './pdf-services/giaiphaubenh-pdf.service.js';
import { ComboPdfService } from './pdf-services/combo-pdf.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BioCase.name, schema: BioCaseSchema }]),
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'bioresult_secret_key_2026',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CasesController],
  providers: [
    CasesService,
    PdfService,
    BasePdfService,
    CellPdfService,
    HpvPdfService,
    SoituoiPdfService,
    GiaiphaubenhPdfService,
    ComboPdfService,
  ],
  exports: [
    CasesService,
    PdfService,
    BasePdfService,
    CellPdfService,
    HpvPdfService,
    SoituoiPdfService,
    GiaiphaubenhPdfService,
    ComboPdfService,
  ],
})
export class CasesModule {}
