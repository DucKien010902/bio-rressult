import { Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import { BasePdfService } from './base-pdf.service.js';

@Injectable()
export class GiaiphaubenhPdfService extends BasePdfService {
  /**
   * Xử lý vẽ kết quả Giải phẫu bệnh
   * Tọa độ chuẩn 100% khớp với mẫu trắng thật GenHD, không dùng nền trắng đè lên watermark
   */
  async generatePdf(
    pdfDoc: PDFDocument,
    caseItem: any,
    fontR: PDFFont,
    fontB: PDFFont,
    templateId?: string,
  ) {
    const pg = pdfDoc.getPages()[0];

    const textColor = rgb(0.1, 0.15, 0.2);
    const blueColor = rgb(0.05, 0.25, 0.45);

    // Helper vẽ chữ trong suốt (hoàn toàn không nền trắng)
    const drawText = (
      text: string,
      x: number,
      y: number,
      opt: { bold?: boolean; size?: number; color?: any } = {},
    ) => {
      if (!text) return;
      const font = opt.bold ? fontB : fontR;
      const size = opt.size || 9.0;
      const color = opt.color || textColor;
      pg.drawText(String(text), { x, y, size, font, color });
    };

    // Helper căn giữa chữ trong khoảng [minX, maxX]
    const drawCentered = (
      text: string,
      minX: number,
      maxX: number,
      y: number,
      opt: { bold?: boolean; size?: number; color?: any } = {},
    ) => {
      if (!text) return;
      const font = opt.bold ? fontB : fontR;
      const size = opt.size || 9.0;
      const color = opt.color || textColor;
      const textWidth = font.widthOfTextAtSize(String(text), size);
      const x = minX + (maxX - minX - textWidth) / 2;
      pg.drawText(String(text), { x, y, size, font, color });
    };

    // Helper ngắt dòng tự động (không nền trắng)
    const drawWrappedText = (
      text: string,
      startX: number,
      startY: number,
      maxWidth: number,
      lineHeight: number,
      opt: { bold?: boolean; size?: number; color?: any } = {},
    ) => {
      if (!text) return;
      const font = opt.bold ? fontB : fontR;
      const size = opt.size || 9.0;
      const color = opt.color || textColor;

      const words = String(text).split(' ');
      let currentLine = '';
      let currentY = startY;

      for (const w of words) {
        const testLine = currentLine ? `${currentLine} ${w}` : w;
        const width = font.widthOfTextAtSize(testLine, size);
        if (width > maxWidth && currentLine) {
          pg.drawText(currentLine, { x: startX, y: currentY, size, font, color });
          currentLine = w;
          currentY -= lineHeight;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        pg.drawText(currentLine, { x: startX, y: currentY, size, font, color });
      }
    };

    // --- 1. HEADER HÀNH CHÍNH (Cột trái X=140.0, Cột phải X=399.5 căn trái đều tăm tắp) ---
    const X_LEFT = 140.0;
    const X_RIGHT = 399.5;

    drawText(caseItem.maSo, X_LEFT, 709.2, { bold: true, size: 9.5 });
    drawText(
      (caseItem.hoTen || '').toUpperCase(),
      X_RIGHT,
      709.2,
      { bold: true, size: 9.5 },
    );

    drawText(String(caseItem.namSinh || ''), X_LEFT, 690.4, { size: 9.0 });
    drawText(caseItem.gioiTinh || 'Nữ', X_RIGHT, 690.4, { size: 9.0 });

    drawText(caseItem.diaChi || '', X_LEFT, 671.7, { size: 8.5 });

    drawText(caseItem.soDienThoai || '', X_LEFT, 652.8, { size: 9.0 });
    drawText(caseItem.bacSiChiDinh || '', X_RIGHT, 652.8, { size: 9.0 });

    drawText(caseItem.donVi || '', X_LEFT, 633.8, { size: 9.0 });

    drawText(caseItem.chanDoanLamSang || '', X_LEFT, 612.9, { size: 9.0 });
    drawText(caseItem.viTriBenhPham || '', X_LEFT, 595.6, { size: 9.0 });

    const tNhan = this.fmtDate(caseItem.ngayNhanMau || caseItem.createdAt);
    const tKq = this.fmtDate(
      caseItem.ngayTraKetQua || caseItem.ngayDuKienTra,
    );
    drawText(tNhan, X_LEFT, 577.6, { size: 9.0 });
    drawText(tKq, X_RIGHT, 577.6, { size: 9.0 });

    // --- 2. KẾT QUẢ GIẢI PHẪU BỆNH ---
    // Mô tả Đại thể (ĐẠI THỂ) - Vùng trắng dưới thanh ĐẠI THỂ
    drawWrappedText(caseItem.daiThe || '', 55.0, 462.0, 485, 14, { size: 9.0 });

    // Mô tả Vi thể (VI THỂ) - Vùng trắng dưới thanh VI THỂ
    drawWrappedText(caseItem.viThe || '', 55.0, 392.0, 485, 14, { size: 9.0 });

    // --- 3. KẾT LUẬN ---
    // Khung xanh nhạt KẾT LUẬN tại Y = 178.9
    drawWrappedText(
      caseItem.ketLuan || '',
      115.0,
      178.9,
      420,
      13,
      { bold: true, size: 9.5, color: blueColor },
    );

    // --- 4. NGÀY KÝ & BÁC SĨ ĐỌC KẾT QUẢ ---
    let dStr = 'Hà Nội, ngày ..... tháng ..... năm 202...';
    if (tKq && tKq.includes('/')) {
      const parts = tKq.split('/');
      if (parts.length === 3) {
        dStr = `Hà Nội, ngày ${parts[0]} tháng ${parts[1]} năm ${parts[2]}`;
      }
    }

    // Che dòng chữ chấm in sẵn "Hà Nội, ngày ..... tháng ..... năm 202..." tại Y = 132.8
    pg.drawRectangle({
      x: 345,
      y: 128,
      width: 185,
      height: 12,
      color: rgb(1, 1, 1),
    });
    drawCentered(dStr, 345, 530, 132.8, { size: 8.5, color: rgb(0.25, 0.3, 0.35) });

    // Tên bác sĩ đọc kết quả (nếu khác tên in sẵn "BS CK1 NGUYỄN TRUNG TRỰC")
    const drName = caseItem.bacSiDoc || 'BS CK1 NGUYỄN TRUNG TRỰC';
    if (drName !== 'BS CK1 NGUYỄN TRUNG TRỰC' && drName !== 'Chưa phân loại') {
      pg.drawRectangle({
        x: 330,
        y: 20,
        width: 220,
        height: 38,
        color: rgb(1, 1, 1),
      });
      drawCentered(drName, 330, 540, 43.5, { bold: true, size: 9.5 });
      if (caseItem.chucDanhDoc) {
        drawCentered(caseItem.chucDanhDoc, 330, 540, 32.4, {
          size: 8.0,
          color: rgb(0.35, 0.35, 0.35),
        });
      }
    }

    // --- 5. ẢNH TIÊU BẢN GIẢI PHẪU BỆNH (Góc dưới bên trái, nếu có) ---
    const imgData = caseItem.anhTeBao || caseItem.anhGpb;
    if (imgData && typeof imgData === 'string' && imgData.startsWith('data:image')) {
      try {
        const base64Data = imgData.split(',')[1];
        if (base64Data) {
          const imgBuffer = Buffer.from(base64Data, 'base64');
          let embeddedImg: any;
          if (imgData.includes('jpeg') || imgData.includes('jpg')) {
            embeddedImg = await pdfDoc.embedJpg(imgBuffer);
          } else {
            embeddedImg = await pdfDoc.embedPng(imgBuffer);
          }
          if (embeddedImg) {
            pg.drawImage(embeddedImg, {
              x: 60,
              y: 28,
              width: 175,
              height: 115,
            });
          }
        }
      } catch (e) {
        // ignore image error
      }
    }
  }
}
