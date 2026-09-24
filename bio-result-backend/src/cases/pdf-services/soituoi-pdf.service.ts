import { Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import { BasePdfService } from './base-pdf.service.js';

@Injectable()
export class SoituoiPdfService extends BasePdfService {
  /**
   * Xử lý vẽ kết quả Soi tươi dịch âm đạo (5 chỉ số)
   */
  generatePdf(
    pdfDoc: PDFDocument,
    caseItem: any,
    fontR: PDFFont,
    fontB: PDFFont,
  ) {
    const pg = pdfDoc.getPages()[0];
    this.mw(pg, 150, 703, caseItem.maSo || '', fontR, fontB, {
      bold: true,
      size: 9.5,
      w: 140,
    });
    this.mw(
      pg,
      400,
      703,
      (caseItem.hoTen || '').toUpperCase(),
      fontR,
      fontB,
      { bold: true, size: 9.5, w: 170 },
    );
    this.mw(pg, 150, 685, String(caseItem.namSinh || ''), fontR, fontB, {
      size: 9,
      w: 140,
    });
    this.mw(pg, 400, 685, caseItem.gioiTinh || 'Nữ', fontR, fontB, {
      size: 9,
      w: 90,
    });
    this.mw(pg, 150, 667, caseItem.diaChi || '', fontR, fontB, {
      size: 8.5,
      w: 415,
    });
    this.mw(pg, 150, 631, caseItem.donVi || '', fontR, fontB, {
      size: 9,
      w: 415,
    });
    this.mw(
      pg,
      140,
      577,
      this.fmtDate(caseItem.ngayNhanMau || caseItem.createdAt),
      fontR,
      fontB,
      { size: 9, w: 150 },
    );
    const tKq = this.fmtDate(
      caseItem.ngayTraKetQua || caseItem.ngayDuKienTra,
    );
    this.mw(pg, 400, 577, tKq, fontR, fontB, { size: 9, w: 170 });

    const soiItems = [
      { y: 483, val: caseItem.soiTuoiBachCau || '' },
      { y: 453, val: caseItem.soiTuoiNam || '' },
      { y: 423, val: caseItem.soiTuoiTapKhuan || '' },
      { y: 393, val: caseItem.soiTuoiTeBaoBieuMo || '' },
      { y: 363, val: caseItem.soiTuoiTrichomonas || '' },
    ];
    for (const si of soiItems) {
      this.mw(pg, 222, si.y, si.val, fontR, fontB, { size: 9, w: 200 });
    }

    this.mw(
      pg,
      125,
      319,
      (caseItem.ketLuan || 'BÌNH THƯỜNG').toUpperCase(),
      fontR,
      fontB,
      { bold: true, size: 8.5, w: 460, color: rgb(0, 0.2, 0.6) },
    );
    this.drawDateAndDoctor(
      pg,
      tKq,
      caseItem.bacSiDoc,
      fontR,
      fontB,
      351,
      242,
      359,
      120,
    );
  }
}
