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

export interface PdfTemplateOption {
  id: string; // Mã định danh mẫu PDF, ví dụ 'hpv20_default', 'hpv20_blank'
  name: string; // Tên hiển thị người dùng chọn
  category: string; // Danh mục dịch vụ: hpv20, hpv40, cell...
  templateFile: string; // Tên file phôi PDF trong thư mục templates/
  isDefault: boolean; // Có phải mẫu mặc định hay không
  description?: string;
}

// Bảng danh mục các mẫu PDF cho từng loại dịch vụ (hiện tại mỗi loại có 1 mẫu chuẩn thật)
export const PDF_TEMPLATES_CATALOG: PdfTemplateOption[] = [
  // 1. HPV 20 Types
  {
    id: 'hpv20_default',
    name: 'Mẫu chuẩn GenHD (20 Types)',
    category: 'hpv20',
    templateFile: 'sample_hpv20.pdf',
    isDefault: true,
    description: 'Phiếu kết quả xét nghiệm 20 tuýp HPV đầy đủ khung viền & logo',
  },

  // 2. HPV 40 Types
  {
    id: 'hpv40_default',
    name: 'Mẫu chuẩn GenHD (40 Types)',
    category: 'hpv40',
    templateFile: 'sample_hpv40.pdf',
    isDefault: true,
    description: 'Phiếu kết quả xét nghiệm 40 tuýp HPV Real-time PCR đầy đủ khung viền & logo',
  },

  // 3. HPV 23 Types
  {
    id: 'hpv23_default',
    name: 'Mẫu chuẩn GenHD (23 Types)',
    category: 'hpv23',
    templateFile: 'sample_hpv23.pdf',
    isDefault: true,
    description: 'Phiếu kết quả xét nghiệm 23 tuýp HPV Real-time PCR đầy đủ khung viền & logo',
  },

  // 4. CELL (Tế bào học cổ tử cung)
  {
    id: 'cell_default',
    name: 'Mẫu chuẩn Cell GenHD (Bethesda 2014)',
    category: 'cell',
    templateFile: 'sample_cell.pdf',
    isDefault: true,
    description: 'Phiếu tế bào học cổ tử cung quy ước Bethesda 2014 đầy đủ khung viền & logo',
  },

  // 5. ThinPrep Pap Test
  {
    id: 'thinprep_default',
    name: 'Mẫu 1: Chuẩn GenHD (ThinPrep)',
    category: 'thinprep',
    templateFile: 'sample_thinprep.pdf',
    isDefault: true,
    description: 'Phiếu xét nghiệm ThinPrep Pap Test tiêu chuẩn GenHD',
  },
  {
    id: 'thinprep_medilab',
    name: 'Mẫu 2: Medilab Hà Nội (ThinPrep)',
    category: 'thinprep',
    templateFile: 'sample_thinprep_medilab.pdf',
    isDefault: false,
    description: 'Phiếu xét nghiệm ThinPrep Medilab Hà Nội',
  },

  // 6. Soi tươi dịch âm đạo
  {
    id: 'soituoi_default',
    name: 'Mẫu chuẩn Soi tươi GenHD (5 chỉ số)',
    category: 'soituoi',
    templateFile: 'sample_soituoi.pdf',
    isDefault: true,
    description: 'Phiếu kết quả 5 chỉ số soi tươi phụ khoa đầy đủ logo',
  },

  // 7. Giải Phẫu Bệnh
  {
    id: 'giaiphaubenh_default',
    name: 'Mẫu chuẩn Giải Phẫu Bệnh Sinh Thiết',
    category: 'giaiphaubenh',
    templateFile: 'sample_giaiphaubenh.pdf',
    isDefault: true,
    description: 'Phiếu kết quả mô bệnh học kèm ảnh tiêu bản đầy đủ logo',
  },

  // 8. Các gói Combo 2 trang
  {
    id: 'combo_hpv20_cell_default',
    name: 'Mẫu chuẩn: Combo HPV 20 + Cell (2 trang)',
    category: 'combo_hpv20_cell',
    templateFile: 'combo_hpv20_cell',
    isDefault: true,
    description: 'Phiếu kết quả 2 trang: HPV 20 và Cell',
  },
  {
    id: 'combo_hpv40_cell_default',
    name: 'Mẫu chuẩn: Combo HPV 40 + Cell (2 trang)',
    category: 'combo_hpv40_cell',
    templateFile: 'combo_hpv40_cell',
    isDefault: true,
    description: 'Phiếu kết quả 2 trang: HPV 40 và Cell',
  },
  {
    id: 'combo_hpv23_cell_default',
    name: 'Mẫu chuẩn: Combo HPV 23 + Cell (2 trang)',
    category: 'combo_hpv23_cell',
    templateFile: 'combo_hpv23_cell',
    isDefault: true,
    description: 'Phiếu kết quả 2 trang: HPV 23 và Cell',
  },
  {
    id: 'combo_hpv20_thinprep_default',
    name: 'Mẫu chuẩn: Combo HPV 20 + ThinPrep (2 trang)',
    category: 'combo_hpv20_thinprep',
    templateFile: 'combo_hpv20_thinprep',
    isDefault: true,
    description: 'Phiếu kết quả 2 trang: HPV 20 và ThinPrep',
  },
  {
    id: 'combo_hpv40_thinprep_default',
    name: 'Mẫu chuẩn: Combo HPV 40 + ThinPrep (2 trang)',
    category: 'combo_hpv40_thinprep',
    templateFile: 'combo_hpv40_thinprep',
    isDefault: true,
    description: 'Phiếu kết quả 2 trang: HPV 40 và ThinPrep',
  },
  {
    id: 'combo_hpv23_thinprep_default',
    name: 'Mẫu chuẩn: Combo HPV 23 + ThinPrep (2 trang)',
    category: 'combo_hpv23_thinprep',
    templateFile: 'combo_hpv23_thinprep',
    isDefault: true,
    description: 'Phiếu kết quả 2 trang: HPV 23 và ThinPrep',
  },
];

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

  /**
   * Lấy danh sách các mẫu PDF có thể chọn theo từng loại dịch vụ
   */
  getAvailableTemplates(category: string): PdfTemplateOption[] {
    const cat = (category || '').toLowerCase();
    const list = PDF_TEMPLATES_CATALOG.filter((t) => t.category === cat);
    if (list.length === 0) {
      return [
        {
          id: `${cat}_default`,
          name: `Mẫu chuẩn (${cat.toUpperCase()})`,
          category: cat,
          templateFile: `sample_${cat}.pdf`,
          isDefault: true,
        },
      ];
    }
    return list;
  }

  /**
   * Sinh file PDF theo ca xét nghiệm và mẫu template được chọn
   */
  async generateCasePdf(
    caseItem: any,
    templateId?: string,
  ): Promise<Buffer> {
    const cat = (caseItem?.loaiXetNghiem || '').toLowerCase();
    const availableTemplates = this.getAvailableTemplates(cat);

    // Xác định mẫu template được chọn:
    // 1. Tham số templateId truyền vào từ request query
    // 2. Trường caseItem.pdfTemplate lưu trong ca
    // 3. Mẫu mặc định isDefault
    const selectedTpl =
      availableTemplates.find((t) => t.id === templateId) ||
      availableTemplates.find((t) => t.id === caseItem?.pdfTemplate) ||
      availableTemplates.find((t) => t.isDefault) ||
      availableTemplates[0];

    // Đối với 6 gói Combo 2 trang (HPV + Cell / ThinPrep):
    if (cat.startsWith('combo_')) {
      return this.comboPdfService.generateComboPdf(
        caseItem,
        cat,
        selectedTpl?.id,
      );
    }

    const tFileName = selectedTpl?.templateFile || `sample_${cat}.pdf`;
    let tPath = path.join(process.cwd(), 'templates', tFileName);
    if (!fs.existsSync(tPath) && cat === 'hpv20') {
      tPath = path.join(process.cwd(), 'templates', 'sample_hpv20_blank.pdf');
    }
    if (!fs.existsSync(tPath)) {
      tPath = path.join(process.cwd(), 'templates', `sample_${cat}.pdf`);
    }
    if (!fs.existsSync(tPath)) {
      tPath = path.join(process.cwd(), 'templates', 'sample_hpv20.pdf');
    }
    if (!fs.existsSync(tPath)) {
      throw new NotFoundException(`Chưa tìm thấy biểu mẫu PDF: ${tFileName}`);
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
    if (!fs.existsSync(fontBoldPath))
      fontBoldPath = 'C:/Windows/Fonts/arialbd.ttf';

    const fontR = await pdfDoc.embedFont(fs.readFileSync(fontPath));
    const fontB = await pdfDoc.embedFont(fs.readFileSync(fontBoldPath));

    // Điều hướng đến từng Mô-đun Service chuyên biệt, truyền kèm templateId đã chọn
    if (cat === 'cell' || cat === 'thinprep') {
      await this.cellPdfService.generatePdf(
        pdfDoc,
        caseItem,
        fontR,
        fontB,
        0,
        selectedTpl?.id,
      );
    } else if (cat === 'hpv40' || cat === 'hpv20' || cat === 'hpv23') {
      await this.hpvPdfService.generatePdf(
        pdfDoc,
        caseItem,
        cat,
        fontR,
        fontB,
        0,
        selectedTpl?.id,
      );
    } else if (cat === 'giaiphaubenh') {
      await this.giaiphaubenhPdfService.generatePdf(
        pdfDoc,
        caseItem,
        fontR,
        fontB,
        selectedTpl?.id,
      );
    } else if (cat === 'soituoi') {
      await this.soituoiPdfService.generatePdf(
        pdfDoc,
        caseItem,
        fontR,
        fontB,
        selectedTpl?.id,
      );
    } else {
      await this.cellPdfService.generatePdf(
        pdfDoc,
        caseItem,
        fontR,
        fontB,
        0,
        selectedTpl?.id,
      );
    }

    const output = await pdfDoc.save();
    return Buffer.from(output);
  }
}
