import { Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import { BasePdfService } from './base-pdf.service.js';

@Injectable()
export class SoituoiPdfService extends BasePdfService {
  /**
   * Xử lý vẽ kết quả Soi tươi dịch âm đạo (5 chỉ số chuẩn pixel-perfect)
   */
  async generatePdf(
    pdfDoc: PDFDocument,
    caseItem: any,
    fontR: PDFFont,
    fontB: PDFFont,
  ) {
    const pg = pdfDoc.getPages()[0];

    const textColor = rgb(0.1, 0.15, 0.2);
    const blueColor = rgb(0.05, 0.25, 0.45);

    const drawText = (
      text: any,
      x: number,
      y: number,
      opt: { bold?: boolean; size?: number; color?: any } = {},
    ) => {
      if (text === undefined || text === null || text === '') return;
      const font = opt.bold ? fontB : fontR;
      const size = opt.size || 9.0;
      const color = opt.color || textColor;
      pg.drawText(String(text), { x, y, size, font, color });
    };

    const drawCentered = (
      text: any,
      minX: number,
      maxX: number,
      y: number,
      opt: { bold?: boolean; size?: number; color?: any } = {},
    ) => {
      if (text === undefined || text === null || text === '') return;
      const font = opt.bold ? fontB : fontR;
      const size = opt.size || 9.0;
      const color = opt.color || textColor;
      const textWidth = font.widthOfTextAtSize(String(text), size);
      const x = minX + (maxX - minX - textWidth) / 2;
      pg.drawText(String(text), { x, y, size, font, color });
    };

    const drawWrappedText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight: number,
      opt: { bold?: boolean; size?: number; color?: any } = {},
    ) => {
      if (!text) return y;
      const font = opt.bold ? fontB : fontR;
      const size = opt.size || 9.0;
      const color = opt.color || textColor;

      const words = String(text).split(/\s+/);
      let curLine = '';
      let curY = y;

      for (const w of words) {
        const testLine = curLine ? `${curLine} ${w}` : w;
        const testWidth = font.widthOfTextAtSize(testLine, size);
        if (testWidth > maxWidth && curLine) {
          pg.drawText(curLine, { x, y: curY, size, font, color });
          curY -= lineHeight;
          curLine = w;
        } else {
          curLine = testLine;
        }
      }
      if (curLine) {
        pg.drawText(curLine, { x, y: curY, size, font, color });
        curY -= lineHeight;
      }
      return curY;
    };

    // --- 1. THÔNG TIN HÀNH CHÍNH (CĂN CHUẨN LỀ TRÁI CẢ 2 CỘT) ---
    const X_LEFT = 140.0;
    const X_RIGHT = 399.5;

    // Hàng 1: Mã bệnh nhân / Họ và tên
    drawText(caseItem.maSo, X_LEFT, 709.2, { bold: true, size: 9.0 });
    drawText(
      (caseItem.hoTen || '').toUpperCase(),
      X_RIGHT,
      709.2,
      { bold: true, size: 9.0 },
    );

    // Hàng 2: Năm sinh / Giới tính
    drawText(String(caseItem.namSinh || ''), X_LEFT, 691.9, { size: 9.0 });
    drawText(caseItem.gioiTinh || 'Nữ', X_RIGHT, 691.9, { size: 9.0 });

    // Hàng 3: Địa chỉ
    drawText(caseItem.diaChi || '', X_LEFT, 672.9, { size: 8.5 });

    // Hàng 4: Điện thoại / Bác sĩ chỉ định
    drawText(caseItem.soDienThoai || '', X_LEFT, 654.2, { size: 9.0 });
    drawText(caseItem.bacSiChiDinh || '', X_RIGHT, 654.2, { size: 9.0 });

    // Hàng 5: Đơn vị gửi mẫu
    drawText(caseItem.donVi || '', X_LEFT, 635.2, { size: 9.0 });

    // Hàng 6: Chẩn đoán lâm sàng
    drawText(caseItem.chanDoanLamSang || '', X_LEFT, 616.3, { size: 9.0 });

    // Hàng 7: Nhận xét đại thể
    drawText(
      caseItem.nhanXetDaiThe || caseItem.daiThe || '',
      X_LEFT,
      599.2,
      { size: 9.0 },
    );

    // Hàng 8: Ngày nhận mẫu / Ngày trả kết quả
    const tNhan = this.fmtDate(caseItem.ngayNhanMau || caseItem.createdAt);
    const tKq = this.fmtDate(
      caseItem.ngayTraKetQua || caseItem.ngayDuKienTra,
    );
    drawText(tNhan, X_LEFT, 581.0, { size: 9.0 });
    drawText(tKq, X_RIGHT, 581.0, { size: 9.0 });

    // --- 2. BẢNG KẾT QUẢ SOI TƯƠI (5 CHỈ TIÊU CĂN GIỮA TUYỆT ĐỐI) ---
    // Cột KẾT QUẢ: minX = 206.0, maxX = 297.5 (tâm = 251.75)
    // Cột GHI CHÚ: minX = 489.5, maxX = 560.6 (tâm = 525.0)
    const soiItems = [
      {
        y: 454.2,
        val: caseItem.soiTuoiBachCau,
        note: caseItem.soiTuoiGhiChuBachCau,
      },
      {
        y: 416.5,
        val: caseItem.soiTuoiNam,
        note: caseItem.soiTuoiGhiChuNam,
      },
      {
        y: 378.6,
        val: caseItem.soiTuoiTapKhuan,
        note: caseItem.soiTuoiGhiChuTapKhuan,
      },
      {
        y: 340.7,
        val: caseItem.soiTuoiTeBaoBieuMo,
        note: caseItem.soiTuoiGhiChuTeBaoBieuMo,
      },
      {
        y: 301.1,
        val: caseItem.soiTuoiTrichomonas,
        note: caseItem.soiTuoiGhiChuTrichomonas,
      },
    ];

    for (const item of soiItems) {
      if (item.val) {
        drawCentered(item.val, 206.0, 297.5, item.y, {
          bold: true,
          size: 10.5,
          color: blueColor,
        });
      }
      if (item.note) {
        drawCentered(item.note, 489.5, 560.6, item.y, {
          size: 8.5,
          color: textColor,
        });
      }
    }

    // --- 3. KẾT LUẬN (ĐẶT CHÍNH XÁC TRONG KHUNG KẾT LUẬN) ---
    // Khung KẾT LUẬN tại x = 34.8, y = 210, w = 527.04, h = 48
    // Nhãn "KẾT LUẬN:" in sẵn kết thúc tại x = 105.0. Chữ bắt đầu tại x = 125.0, y = 239.6
    const ketLuanText = (caseItem.ketLuan || 'BÌNH THƯỜNG').toUpperCase();
    drawWrappedText(ketLuanText, 125.0, 239.6, 425, 13, {
      bold: true,
      size: 9.5,
      color: rgb(0.05, 0.1, 0.15),
    });

    // --- 4. NGÀY KÝ & BÁC SĨ ĐỌC KẾT QUẢ ---
    let dStr = 'Hà Nội, ngày ..... tháng ..... năm 202...';
    if (tKq && tKq.includes('/')) {
      const parts = tKq.split('/');
      if (parts.length === 3) {
        dStr = `Hà Nội, ngày ${parts[0]} tháng ${parts[1]} năm ${parts[2]}`;
      }
    }

    // Che đúng phần dấu chấm in sẵn "Hà Nội, ngày ..... tháng ..... năm 202..." tại Y = 175.5
    pg.drawRectangle({
      x: 345,
      y: 171,
      width: 185,
      height: 12,
      color: rgb(1, 1, 1),
    });
    drawCentered(dStr, 345, 530, 175.5, {
      size: 8.5,
      color: rgb(0.25, 0.3, 0.35),
    });

    // Bác sĩ đọc kết quả: Phôi mẫu đã in sẵn "BS CK1 PHẠM THẾ HÙNG" tại y = 85.9
    // Chỉ che và in tên mới nếu khác tên mặc định
    const drName = caseItem.bacSiDoc || 'BS CK1 PHẠM THẾ HÙNG';
    if (
      drName &&
      !drName.toUpperCase().includes('PHẠM THẾ HÙNG') &&
      drName !== 'Chưa phân loại'
    ) {
      pg.drawRectangle({
        x: 330,
        y: 65,
        width: 220,
        height: 35,
        color: rgb(1, 1, 1),
      });
      drawCentered(drName, 330, 540, 85.9, { bold: true, size: 9.5 });
      if (caseItem.chucDanhDoc) {
        drawCentered(caseItem.chucDanhDoc, 330, 540, 74.9, {
          size: 8.0,
          color: rgb(0.35, 0.35, 0.35),
        });
      }
    }

    // Chữ ký điện tử / Ảnh chữ ký (nếu có)
    const sigData = caseItem.chuKy || caseItem.signatureImage;
    if (sigData && typeof sigData === 'string' && sigData.startsWith('data:image')) {
      try {
        const base64Data = sigData.split(',')[1];
        if (base64Data) {
          const imgBuffer = Buffer.from(base64Data, 'base64');
          let embeddedImg: any;
          if (sigData.includes('jpeg') || sigData.includes('jpg')) {
            embeddedImg = await pdfDoc.embedJpg(imgBuffer);
          } else {
            embeddedImg = await pdfDoc.embedPng(imgBuffer);
          }
          if (embeddedImg) {
            pg.drawImage(embeddedImg, {
              x: 380,
              y: 95,
              width: 110,
              height: 55,
            });
          }
        }
      } catch (e) {
        // bỏ qua nếu ảnh lỗi
      }
    }
  }
}
