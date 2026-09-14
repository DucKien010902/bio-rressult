import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateCasePdf(caseItem: any): Promise<Buffer> {
    const templatePath = path.join(process.cwd(), 'templates', 'sample_hpv40.pdf');
    if (!fs.existsSync(templatePath)) {
      this.logger.error(`Template not found at: ${templatePath}`);
      throw new NotFoundException('Chưa tìm thấy biểu mẫu PDF trên hệ thống');
    }

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);

    // Resolve Unicode Vietnamese Fonts (Arial / Arial Bold)
    let fontPath = path.join(process.cwd(), 'templates', 'fonts', 'arial.ttf');
    let fontBoldPath = path.join(process.cwd(), 'templates', 'fonts', 'arialbd.ttf');

    if (!fs.existsSync(fontPath)) fontPath = 'C:/Windows/Fonts/arial.ttf';
    if (!fs.existsSync(fontBoldPath)) fontBoldPath = 'C:/Windows/Fonts/arialbd.ttf';

    const fontRegular = await pdfDoc.embedFont(fs.readFileSync(fontPath));
    const fontBold = await pdfDoc.embedFont(fs.readFileSync(fontBoldPath));

    const page = pdfDoc.getPages()[0];

    // Helper to clear old sample text and write dynamic patient data
    const maskAndWrite = (
      x: number,
      y: number,
      text: string,
      options: {
        isBold?: boolean;
        fontSize?: number;
        maskWidth?: number;
        maskHeight?: number;
        maskOffsetX?: number;
        maskOffsetY?: number;
        color?: any;
      } = {}
    ) => {
      const isBold = options.isBold ?? false;
      const fontSize = options.fontSize ?? 9;
      const maskWidth = options.maskWidth ?? 150;
      const maskHeight = options.maskHeight ?? 14;
      const maskOffsetX = options.maskOffsetX ?? -3;
      const maskOffsetY = options.maskOffsetY ?? -3;
      const font = isBold ? fontBold : fontRegular;
      const color = options.color ?? rgb(0.1, 0.1, 0.1);

      // Clean whiteout rectangle
      page.drawRectangle({
        x: x + maskOffsetX,
        y: y + maskOffsetY,
        width: maskWidth,
        height: maskHeight,
        color: rgb(1, 1, 1),
      });

      if (text) {
        page.drawText(String(text), {
          x,
          y,
          size: fontSize,
          font,
          color,
        });
      }
    };

    // Helper to format date strings to DD/MM/YYYY
    const formatDate = (val?: string) => {
      if (!val) {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        return `${d}/${m}/${now.getFullYear()}`;
      }
      if (val.includes('/')) return val;
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // 1. Mã bệnh nhân: x = 125, y = 699
    maskAndWrite(125, 699, caseItem.maSo || caseItem.patientCode || '', {
      isBold: true,
      fontSize: 9.5,
      maskWidth: 165,
    });

    // 2. Họ và tên bệnh nhân: x = 365, y = 699
    const patientName = (caseItem.hoTen || caseItem.patientName || '').toUpperCase();
    maskAndWrite(365, 699, patientName, {
      isBold: true,
      fontSize: 9.5,
      maskWidth: 205,
    });

    // 3. Năm sinh: x = 125, y = 682
    const birthYear = caseItem.namSinh || (caseItem.age ? new Date().getFullYear() - caseItem.age : '');
    maskAndWrite(125, 682, String(birthYear), {
      fontSize: 9,
      maskWidth: 165,
    });

    // 4. Giới tính: x = 365, y = 682
    maskAndWrite(365, 682, caseItem.gioiTinh || caseItem.gender || 'Nữ', {
      fontSize: 9,
      maskWidth: 120,
    });

    // 5. Địa chỉ: x = 125, y = 664 (covers entire remaining width)
    maskAndWrite(125, 664, caseItem.diaChi || '', {
      fontSize: 8.5,
      maskWidth: 445,
    });

    // 6. Điện thoại: x = 125, y = 647
    maskAndWrite(125, 647, caseItem.soDienThoai || '', {
      fontSize: 9,
      maskWidth: 165,
    });

    // 7. Bác sĩ chỉ định: x = 385, y = 647
    maskAndWrite(385, 647, caseItem.bacSiChiDinh || '', {
      fontSize: 9,
      maskWidth: 185,
    });

    // 8. Đơn vị gửi mẫu: x = 130, y = 629
    maskAndWrite(130, 629, caseItem.donVi || '', {
      fontSize: 9,
      maskWidth: 440,
    });

    // 9. Loại mẫu: x = 125, y = 612
    maskAndWrite(125, 612, caseItem.loaiMau || 'Dịch phết', {
      fontSize: 9,
      maskWidth: 445,
    });

    // 10. Ngày nhận mẫu: x = 140, y = 594
    const nhanMauStr = formatDate(caseItem.ngayNhanMau || caseItem.sampleDate || caseItem.createdAt);
    maskAndWrite(140, 594, nhanMauStr, {
      fontSize: 9,
      maskWidth: 155,
    });

    // 11. Ngày trả kết quả: x = 400, y = 594
    const traKqStr = formatDate(caseItem.ngayTraKetQua || caseItem.ngayDuKienTra);
    maskAndWrite(400, 594, traKqStr, {
      fontSize: 9,
      maskWidth: 170,
    });

    // 12. Kết quả 4 nhóm HPV:
    // Row 1 (HPV 16, 18) at y = 533
    const row1Positive =
      caseItem.hpvHighRiskResult?.includes('16') ||
      caseItem.hpvHighRiskResult?.includes('18');
    const row1Res = row1Positive ? 'Dương tính' : 'Âm tính';
    maskAndWrite(482, 533, row1Res, {
      isBold: row1Positive,
      fontSize: 9,
      maskOffsetX: -10,
      maskWidth: 85,
      color: row1Positive ? rgb(0.85, 0, 0) : rgb(0.1, 0.1, 0.1),
    });

    // Row 2 (HPV High Risk khác) at y = 500
    const row2Positive =
      caseItem.hpvHighRiskResult &&
      !row1Positive &&
      caseItem.hpvHighRiskResult !== 'Âm tính' &&
      caseItem.hpvHighRiskResult.trim() !== '';
    const row2Res = row2Positive
      ? caseItem.hpvHighRiskResult.length > 15
        ? 'Dương tính'
        : caseItem.hpvHighRiskResult
      : 'Âm tính';
    maskAndWrite(482, 500, row2Res, {
      isBold: !!row2Positive,
      fontSize: 9,
      maskOffsetX: -10,
      maskWidth: 85,
      color: row2Positive ? rgb(0.85, 0, 0) : rgb(0.1, 0.1, 0.1),
    });

    // Row 3 (HPV Low Risk) at y = 467
    const row3Positive =
      caseItem.hpvLowRiskResult &&
      caseItem.hpvLowRiskResult !== 'Âm tính' &&
      caseItem.hpvLowRiskResult.trim() !== '';
    const row3Res = row3Positive
      ? caseItem.hpvLowRiskResult.length > 15
        ? 'Dương tính'
        : caseItem.hpvLowRiskResult
      : 'Âm tính';
    maskAndWrite(482, 467, row3Res, {
      isBold: !!row3Positive,
      fontSize: 9,
      maskOffsetX: -10,
      maskWidth: 85,
      color: row3Positive ? rgb(0.85, 0, 0) : rgb(0.1, 0.1, 0.1),
    });

    // Row 4 (Các Type khác) at y = 434
    maskAndWrite(482, 434, 'Âm tính', {
      fontSize: 9,
      maskOffsetX: -10,
      maskWidth: 85,
      color: rgb(0.1, 0.1, 0.1),
    });

    // 13. Kết luận: x = 120, y = 256
    const defaultConclusion = 'ÂM TÍNH VỚI VIRUS HPV (40 TYPE TRÊN) TRÊN MẪU NHẬN ĐƯỢC.';
    const conclusion = (caseItem.ketLuan || defaultConclusion).toUpperCase();
    maskAndWrite(120, 256, conclusion, {
      isBold: true,
      fontSize: 8.5,
      maskOffsetX: -3,
      maskOffsetY: -4,
      maskWidth: 455,
      maskHeight: 20,
      color: rgb(0, 0.2, 0.6), // GenHD brand blue
    });

    // 14. Địa danh & Ngày tháng năm: x = 340, y = 210
    const [dDay, dMonth, dYear] = traKqStr.split('/');
    const dateLine = `Hà Nội, ngày ${dDay || '12'} tháng ${dMonth || '09'} năm ${dYear || '2026'}`;
    maskAndWrite(340, 210, dateLine, {
      fontSize: 8.5,
      maskOffsetX: -5,
      maskOffsetY: -3,
      maskWidth: 235,
      maskHeight: 14,
    });

    // 15. Bác sĩ ký: x = 330, y = 88
    const doctorName =
      caseItem.bacSiDoc && caseItem.bacSiDoc !== 'Chưa phân loại'
        ? caseItem.bacSiDoc
        : 'TS . BS Nguyễn Khánh Dương';
    maskAndWrite(330, 88, doctorName, {
      isBold: true,
      fontSize: 9.5,
      maskOffsetX: -5,
      maskOffsetY: -3,
      maskWidth: 240,
      maskHeight: 16,
    });

    const pdfOutputBytes = await pdfDoc.save();
    return Buffer.from(pdfOutputBytes);
  }
}
