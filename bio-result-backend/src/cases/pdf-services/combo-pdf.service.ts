import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
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
   * Sinh file PDF Combo 2 trang hoàn chỉnh:
   * Trang 1: Phôi HPV tương ứng (HPV 20 / 40 / 23)
   * Trang 2: Phôi Tế bào học tương ứng (Cell / ThinPrep)
   */
  async generateComboPdf(
    caseItem: any,
    cat: string,
    templateId?: string,
  ): Promise<Buffer> {
    const hpvCat = cat.includes('hpv40')
      ? 'hpv40'
      : cat.includes('hpv23')
      ? 'hpv23'
      : 'hpv20';

    const isThinprep = cat.includes('thinprep');

    // Xác định tên phôi mẫu cho Trang 1 (HPV)
    const hpvTemplate =
      hpvCat === 'hpv40'
        ? 'sample_hpv40.pdf'
        : hpvCat === 'hpv23'
        ? 'sample_hpv23.pdf'
        : 'sample_hpv20.pdf';

    let hpvPath = path.join(process.cwd(), 'templates', hpvTemplate);
    if (!fs.existsSync(hpvPath) && hpvCat === 'hpv20') {
      hpvPath = path.join(process.cwd(), 'templates', 'sample_hpv20_blank.pdf');
    }
    if (!fs.existsSync(hpvPath)) {
      throw new NotFoundException(`Không tìm thấy phôi mẫu ${hpvTemplate}`);
    }

    // Xác định tên phôi mẫu cho Trang 2 (Cell / ThinPrep)
    const cellTemplate = isThinprep ? 'sample_thinprep.pdf' : 'sample_cell.pdf';
    const cellPath = path.join(process.cwd(), 'templates', cellTemplate);
    if (!fs.existsSync(cellPath)) {
      throw new NotFoundException(`Không tìm thấy phôi mẫu ${cellTemplate}`);
    }

    // 1. Khởi tạo PDFDoc từ Trang 1 (HPV)
    const pdfDoc = await PDFDocument.load(fs.readFileSync(hpvPath));
    pdfDoc.registerFontkit(fontkit);

    // 2. Tải Trang 2 (Cell / ThinPrep) và ghép vào pdfDoc
    const cellDoc = await PDFDocument.load(fs.readFileSync(cellPath));
    const [cellPage] = await pdfDoc.copyPages(cellDoc, [0]);
    pdfDoc.addPage(cellPage);

    // 3. Nhúng font chữ Arial
    let fontPath = path.join(process.cwd(), 'templates', 'fonts', 'arial.ttf');
    let fontBoldPath = path.join(
      process.cwd(),
      'templates',
      'fonts',
      'arialbd.ttf',
    );
    if (!fs.existsSync(fontPath)) fontPath = 'C:/Windows/Fonts/arial.ttf';
    if (!fs.existsSync(fontBoldPath))
      fontBoldPath = 'C:/Windows/Fonts/arialbd.ttf';

    const fontR = await pdfDoc.embedFont(fs.readFileSync(fontPath));
    const fontB = await pdfDoc.embedFont(fs.readFileSync(fontBoldPath));

    // 4. Trang 1 (index = 0): Đổ kết quả HPV pixel-perfect
    await this.hpvPdfService.generatePdf(
      pdfDoc,
      caseItem,
      hpvCat,
      fontR,
      fontB,
      0,
    );

    // 5. Trang 2 (index = 1): Đổ kết quả Cell / ThinPrep pixel-perfect
    const cellCaseItem = {
      ...caseItem,
      ketLuan:
        caseItem.ketLuan2 ||
        caseItem.ketLuan ||
        'KHÔNG THẤY TẾ BÀO BẤT THƯỜNG TRÊN PHIẾN ĐỒ',
      bacSiDoc: caseItem.bacSiDoc2 || caseItem.bacSiDoc,
      daKy: caseItem.daKy2 !== undefined ? caseItem.daKy2 : caseItem.daKy,
      ngayTraKetQua: caseItem.ngayXetNghiem2 || caseItem.ngayTraKetQua,
    };
    await this.cellPdfService.generatePdf(
      pdfDoc,
      cellCaseItem,
      fontR,
      fontB,
      1,
    );

    const output = await pdfDoc.save();
    return Buffer.from(output);
  }

  /**
   * Phương thức dự phòng nếu gọi với pdfDoc có sẵn
   */
  async generatePdf(
    pdfDoc: PDFDocument,
    caseItem: any,
    cat: string,
    fontR: PDFFont,
    fontB: PDFFont,
  ) {
    const hpvCat = cat.includes('hpv40')
      ? 'hpv40'
      : cat.includes('hpv23')
      ? 'hpv23'
      : 'hpv20';

    // Trang 1: Chạy dịch vụ HPV
    await this.hpvPdfService.generatePdf(
      pdfDoc,
      caseItem,
      hpvCat,
      fontR,
      fontB,
      0,
    );

    // Trang 2: Nếu chưa có trang 2, ghép thêm trang Cell/ThinPrep
    if (pdfDoc.getPageCount() < 2) {
      const isThinprep = cat.includes('thinprep');
      const cellTemplate = isThinprep
        ? 'sample_thinprep.pdf'
        : 'sample_cell.pdf';
      const cellPath = path.join(process.cwd(), 'templates', cellTemplate);
      if (fs.existsSync(cellPath)) {
        const cellDoc = await PDFDocument.load(fs.readFileSync(cellPath));
        const [cellPage] = await pdfDoc.copyPages(cellDoc, [0]);
        pdfDoc.addPage(cellPage);
      }
    }

    if (pdfDoc.getPageCount() > 1) {
      const cellCaseItem = {
        ...caseItem,
        ketLuan:
          caseItem.ketLuan2 ||
          caseItem.ketLuan ||
          'KHÔNG THẤY TẾ BÀO BẤT THƯỜNG TRÊN PHIẾN ĐỒ',
        bacSiDoc: caseItem.bacSiDoc2 || caseItem.bacSiDoc,
        daKy: caseItem.daKy2 !== undefined ? caseItem.daKy2 : caseItem.daKy,
        ngayTraKetQua: caseItem.ngayXetNghiem2 || caseItem.ngayTraKetQua,
      };
      await this.cellPdfService.generatePdf(
        pdfDoc,
        cellCaseItem,
        fontR,
        fontB,
        1,
      );
    }
  }
}
