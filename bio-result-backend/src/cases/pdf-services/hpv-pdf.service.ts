import { Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import { BasePdfService } from './base-pdf.service.js';

@Injectable()
export class HpvPdfService extends BasePdfService {
  /**
   * Xử lý vẽ kết quả HPV (HPV 40, HPV 20, HPV 23)
   */
  generatePdf(
    pdfDoc: PDFDocument,
    caseItem: any,
    cat: string,
    fontR: PDFFont,
    fontB: PDFFont,
    pageIndex = 0,
  ) {
    const pg = pdfDoc.getPages()[pageIndex];

    const _isPos = (v?: string) =>
      !!(v && v !== 'Âm tính' && v !== 'am tinh' && v.trim() !== '');

    const tKq = this.fmtDate(
      caseItem.ngayTraKetQua || caseItem.ngayDuKienTra,
    );
    const tNhan = this.fmtDate(caseItem.ngayNhanMau || caseItem.createdAt);

    if (cat === 'hpv20') {
      const textColor = rgb(0.1, 0.15, 0.2);
      const blueColor = rgb(0.05, 0.25, 0.45);
      const redColor = rgb(0.8, 0.1, 0.1);

      // Hàm vẽ chữ trong suốt (hoàn toàn không vẽ nền trắng đè lên watermark)
      const drawText = (text: string, x: number, y: number, opt: any = {}) => {
        if (!text) return;
        const font = opt.bold ? fontB : fontR;
        const size = opt.size || 9.0;
        const color = opt.color || textColor;
        pg.drawText(String(text), { x, y, size, font, color });
      };

      // Helper to center text in a column [minX, maxX]
      const drawCentered = (text: string, minX: number, maxX: number, y: number, opt: any = {}) => {
        if (!text) return;
        const font = opt.bold ? fontB : fontR;
        const size = opt.size || 9.5;
        const color = opt.color || textColor;
        const width = font.widthOfTextAtSize(String(text), size);
        const x = minX + (maxX - minX - width) / 2;
        pg.drawText(String(text), { x, y, size, font, color });
      };

      // Vách ngăn cột trái X=127.25 -> thụt lề vào X=137.5 (+10pt)
      const X_LEFT = 137.5;

      // Vách ngăn cột phải X=389.45 -> thụt lề vào X=399.5 (+10pt cân bằng với cột trái)
      const X_RIGHT = 399.5;

      // 1. CỘT TRÁI (Tất cả căn trái đều nhau tại X=137.5, không nền trắng)
      drawText(caseItem.maSo, X_LEFT, 692.6, { bold: true, size: 9.5 });
      drawText(String(caseItem.namSinh || ''), X_LEFT, 673.6, { size: 9.0 });
      drawText(caseItem.diaChi || '', X_LEFT, 654.7, { size: 8.5 });
      drawText(caseItem.soDienThoai || '', X_LEFT, 635.7, { size: 9.0 });
      drawText(caseItem.donVi || '', X_LEFT, 616.7, { size: 9.0 });
      // Không đổ trường loại mẫu theo yêu cầu (mẫu trắng đã có sẵn 'Dịch')
      drawText(tNhan, X_LEFT, 549.0, { size: 9.0 });

      // 2. CỘT PHẢI (Tất cả căn trái đều nhau tại X=399.5, không nền trắng)
      drawText((caseItem.hoTen || '').toUpperCase(), X_RIGHT, 692.6, { bold: true, size: 9.5 });
      drawText(caseItem.gioiTinh || 'Nữ', X_RIGHT, 673.6, { size: 9.0 });
      drawText(caseItem.bacSiChiDinh || '', X_RIGHT, 635.7, { size: 9.0 });
      drawText(tKq, X_RIGHT, 549.0, { size: 9.0 });

      // 3. BẢNG KẾT QUẢ 3 NHÓM (Cột KẾT QUẢ giữa X: 455.71 -> 560.88)
      const colMinX = 455.71;
      const colMaxX = 560.88;

      // Row 1: HPV Nguy Cơ Cao (Type 16, 18)
      const r1Pos = _isPos(caseItem.hpvHighRiskResult);
      drawCentered(
        caseItem.hpvHighRiskResult || 'Âm tính',
        colMinX,
        colMaxX,
        459.5,
        { bold: true, size: 9.5, color: r1Pos ? redColor : blueColor },
      );

      // Row 2: HPV Nguy Cơ Cao Khác (16 Types)
      const r2Pos = _isPos(caseItem.hpvHighRiskOtherResult);
      drawCentered(
        caseItem.hpvHighRiskOtherResult || 'Âm tính',
        colMinX,
        colMaxX,
        429.7,
        { bold: true, size: 9.5, color: r2Pos ? blueColor : blueColor },
      );

      // Row 3: HPV Nguy Cơ Thấp (2 Types)
      const r3Pos = _isPos(caseItem.hpvLowRiskResult);
      drawCentered(
        caseItem.hpvLowRiskResult || 'Âm tính',
        colMinX,
        colMaxX,
        399.7,
        { bold: true, size: 9.5, color: r3Pos ? redColor : blueColor },
      );

      // 4. KẾT LUẬN (Chữ trong suốt đè lên khung xanh, không nền trắng)
      const klText = (caseItem.ketLuan || 'ÂM TÍNH VỚI CÁC TYPE HPV KHẢO SÁT.').toUpperCase();
      drawText(klText, 115, 262.9, {
        bold: true,
        size: 9.0,
        color: blueColor,
      });

      // 5. NGÀY KÝ VÀ BÁC SĨ ĐỌC KẾT QUẢ
      // Che phần chấm "Hà Nội, ngày ..... tháng ..... năm 202..."
      pg.drawRectangle({
        x: 350,
        y: 209,
        width: 170,
        height: 12,
        color: rgb(1, 1, 1),
      });

      let dStr = 'Hà Nội, ngày ..... tháng ..... năm 202...';
      if (tKq && tKq.includes('/')) {
        const parts = tKq.split('/');
        if (parts.length === 3) {
          dStr = `Hà Nội, ngày ${parts[0]} tháng ${parts[1]} năm ${parts[2]}`;
        }
      }
      drawCentered(dStr, 350, 510, 214.1, { size: 8.5, color: rgb(0.25, 0.3, 0.35) });

      // Nếu bác sĩ đọc khác tên in sẵn "BS CK1 PHẠM THẾ HÙNG"
      if (caseItem.bacSiDoc && caseItem.bacSiDoc !== 'BS CK1 PHẠM THẾ HÙNG') {
        pg.drawRectangle({
          x: 340,
          y: 118,
          width: 210,
          height: 16,
          color: rgb(1, 1, 1),
        });
        drawCentered(caseItem.bacSiDoc, 340, 550, 124.8, { bold: true, size: 9.5 });
      }
      return;
    }

    // Header HPV cũ cho các phân loại chưa có mẫu trắng riêng
    this.mw(pg, 125, 699, caseItem.maSo || '', fontR, fontB, {
      bold: true,
      size: 9.5,
      w: 165,
    });
    this.mw(
      pg,
      365,
      699,
      (caseItem.hoTen || '').toUpperCase(),
      fontR,
      fontB,
      { bold: true, size: 9.5, w: 205 },
    );
    this.mw(pg, 125, 682, String(caseItem.namSinh || ''), fontR, fontB, {
      size: 9,
      w: 165,
    });
    this.mw(pg, 365, 682, caseItem.gioiTinh || 'Nữ', fontR, fontB, {
      size: 9,
      w: 100,
    });
    this.mw(pg, 125, 664, caseItem.diaChi || '', fontR, fontB, {
      size: 8.5,
      w: 445,
    });
    this.mw(pg, 125, 647, caseItem.soDienThoai || '', fontR, fontB, {
      size: 9,
      w: 445,
    });
    this.mw(pg, 130, 629, caseItem.donVi || '', fontR, fontB, {
      size: 9,
      w: 440,
    });
    this.mw(pg, 125, 612, caseItem.loaiMau || 'Dịch phết', fontR, fontB, {
      size: 9,
      w: 440,
    });
    this.mw(pg, 140, 594, tNhan, fontR, fontB, { size: 9, w: 150 });
    this.mw(pg, 400, 594, tKq, fontR, fontB, { size: 9, w: 170 });

    const drawHpvRes = (pos: boolean, x: number, y: number) => {
      this.mw(pg, x, y, pos ? 'Dương tính' : 'Âm tính', fontR, fontB, {
        bold: pos,
        size: 9,
        w: 100,
        ox: -8,
        color: pos ? rgb(0.85, 0, 0) : rgb(0.05, 0.05, 0.05),
      });
    };

    if (cat === 'hpv40') {
      drawHpvRes(_isPos(caseItem.hpvHighRiskResult), 484.8, 533);
      drawHpvRes(
        _isPos(caseItem.hpvHighRiskOtherResult || caseItem.hpvHighRiskResult),
        484.8,
        500,
      );
      drawHpvRes(_isPos(caseItem.hpvLowRiskResult), 484.8, 467);
      drawHpvRes(_isPos(caseItem.hpvOtherTypesResult), 484.8, 434);
      this.mw(
        pg,
        120,
        256,
        (caseItem.ketLuan || 'ÂM TÍNH VỚI VIRUS HPV (40 TYPE TRÊN) TRÊN MẪU NHẬN ĐƯỢC.').toUpperCase(),
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
        210,
        348,
        88,
      );
    } else if (cat === 'hpv23') {
      drawHpvRes(_isPos(caseItem.hpvHighRiskResult), 484.8, 532);
      drawHpvRes(_isPos(caseItem.hpvHighRiskOtherResult), 484.8, 502);
      drawHpvRes(_isPos(caseItem.hpvLowRiskResult), 484.8, 472);
      drawHpvRes(_isPos(caseItem.hpvOtherTypesResult), 484.8, 442);
      this.mw(
        pg,
        120,
        400,
        (caseItem.ketLuan || 'ÂM TÍNH VỚI CÁC CHỦNG HPV KHẢO SÁT.').toUpperCase(),
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
        354,
        340,
        232,
      );
    }
  }
}
