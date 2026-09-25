import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

import { CellPdfService } from './pdf-services/cell-pdf.service.js';
import { HpvPdfService } from './pdf-services/hpv-pdf.service.js';
import { SoituoiPdfService } from './pdf-services/soituoi-pdf.service.js';
import { GiaiphaubenhPdfService } from './pdf-services/giaiphaubenh-pdf.service.js';
import { ComboPdfService } from './pdf-services/combo-pdf.service.js';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    private cellPdfService: CellPdfService,
    private hpvPdfService: HpvPdfService,
    private soituoiPdfService: SoituoiPdfService,
    private giaiphaubenhPdfService: GiaiphaubenhPdfService,
    private comboPdfService: ComboPdfService,
  ) {}

  async generateCasePdf(caseItem: any): Promise<Buffer> {
    const templateMap: Record<string, string> = {
      cell: 'sample_cell.pdf',
      thinprep: 'sample_thinprep.pdf',
      hpv40: 'sample_hpv40.pdf',
      hpv20: 'sample_hpv20.pdf',
      hpv23: 'sample_hpv23.pdf',
      soituoi: 'sample_soituoi.pdf',
      giaiphaubenh: 'sample_giaiphaubenh.pdf',
      combo_hpv20_cell: 'sample_combo_hpv20_cell.pdf',
      combo_hpv40_cell: 'sample_combo_hpv40_cell.pdf',
      combo_hpv23_cell: 'sample_combo_hpv23_cell.pdf',
      combo_hpv20_thinprep: 'sample_combo_hpv20_thinprep.pdf',
      combo_hpv23_thinprep: 'sample_combo_hpv23_thinprep.pdf',
      combo_hpv40_thinprep: 'sample_combo_hpv40_thinprep.pdf',
    };

    const cat = (caseItem?.loaiXetNghiem || '').toLowerCase();

    // Đối với 6 gói Combo 2 trang (HPV + Cell / ThinPrep):
    // Tự động ghép Trang 1 (Phôi HPV tương ứng) và Trang 2 (Phôi Cell/ThinPrep)
    if (cat.startsWith('combo_')) {
      return this.comboPdfService.generateComboPdf(caseItem, cat);
    }

    const tFileName = templateMap[cat] || 'sample_hpv20.pdf';
    let tPath = path.join(process.cwd(), 'templates', tFileName);
    if (!fs.existsSync(tPath) && cat === 'hpv20') {
      tPath = path.join(process.cwd(), 'templates', 'sample_hpv20_blank.pdf');
    }
    if (!fs.existsSync(tPath)) {
      tPath = path.join(process.cwd(), 'templates', 'sample_hpv20.pdf');
    }
    if (!fs.existsSync(tPath)) {
      tPath = path.join(process.cwd(), 'templates', 'sample_cell.pdf');
    }
    if (!fs.existsSync(tPath)) {
      throw new NotFoundException('Chưa tìm thấy biểu mẫu PDF');
    }

    const pdfDoc = await PDFDocument.load(fs.readFileSync(tPath));
    pdfDoc.registerFontkit(fontkit);

    let fontPath = path.join(process.cwd(), 'templates', 'fonts', 'arial.ttf');
    let fontBoldPath = path.join(
      process.cwd(),
      'templates',
      'fonts',
      'arialbd.ttf',
    );
    if (!fs.existsSync(fontPath)) fontPath = 'C:/Windows/Fonts/arial.ttf';
    if (!fs.existsSync(fontBoldPath)) fontBoldPath = 'C:/Windows/Fonts/arialbd.ttf';

    const fontR = await pdfDoc.embedFont(fs.readFileSync(fontPath));
    const fontB = await pdfDoc.embedFont(fs.readFileSync(fontBoldPath));

    // Điều hướng đến từng Mô-đun Service chuyên biệt
    if (cat === 'cell' || cat === 'thinprep') {
      await this.cellPdfService.generatePdf(pdfDoc, caseItem, fontR, fontB);
    } else if (cat === 'hpv40' || cat === 'hpv20' || cat === 'hpv23') {
      await this.hpvPdfService.generatePdf(pdfDoc, caseItem, cat, fontR, fontB);
    } else if (cat === 'giaiphaubenh') {
      await this.giaiphaubenhPdfService.generatePdf(pdfDoc, caseItem, fontR, fontB);
    } else if (cat === 'soituoi') {
      await this.soituoiPdfService.generatePdf(pdfDoc, caseItem, fontR, fontB);
    } else if (cat.startsWith('combo_')) {
      await this.comboPdfService.generatePdf(pdfDoc, caseItem, cat, fontR, fontB);
    } else {
      await this.cellPdfService.generatePdf(pdfDoc, caseItem, fontR, fontB);
    }

    const output = await pdfDoc.save();
    return Buffer.from(output);
  }
}
