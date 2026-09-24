import { Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont } from 'pdf-lib';
import { BasePdfService } from './base-pdf.service.js';
import { HpvPdfService } from './hpv-pdf.service.js';
import { CellPdfService } from './cell-pdf.service.js';

@Injectable()
export class ComboPdfService extends BasePdfService {
  constructor(
    private hpvPdfService: HpvPdfService,
    private cellPdfService: CellPdfService,
  ) {
    super();
  }

  /**
   * Xử lý các gói Combo 2 trang (HPV + Cell / ThinPrep)
   * Trang 1: HPV | Trang 2: Cell / ThinPrep
   */
  async generatePdf(
    pdfDoc: PDFDocument,
    caseItem: any,
    cat: string,
    fontR: PDFFont,
    fontB: PDFFont,
  ) {
    const pages = pdfDoc.getPages();
    const hpvCat = cat.includes('hpv40')
      ? 'hpv40'
      : cat.includes('hpv23')
      ? 'hpv23'
      : 'hpv20';

    // Trang 1: Chạy dịch vụ HPV
    await this.hpvPdfService.generatePdf(pdfDoc, caseItem, hpvCat, fontR, fontB, 0);

    // Trang 2: Chạy dịch vụ Cell / ThinPrep
    if (pages.length > 1) {
      await this.cellPdfService.generatePdf(pdfDoc, caseItem, fontR, fontB, 1);
    }
  }
}
