import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import { BasePdfService } from './base-pdf.service.js';
import { MinioService } from '../../minio/minio.service.js';
import { UsersService } from '../../users/users.service.js';

@Injectable()
export class SoituoiPdfService extends BasePdfService {
  constructor(
    private minioService: MinioService,
    private usersService: UsersService,
  ) {
    super();
  }
  /**
   * Xử lý vẽ kết quả Soi tươi dịch âm đạo (5 chỉ số chuẩn pixel-perfect)
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

    // Helper vẽ ghi chú trong ô bảng: tự động ngắt dòng tối đa 2 dòng, tự co cỡ chữ nếu dài, căn giữa ô
    const drawCellNote = (text: any, minX: number, maxX: number, centerY: number) => {
      if (text === undefined || text === null || text === '') return;
      const maxW = maxX - minX - 4;
      const words = String(text).trim().split(/\s+/);
      if (!words.length || !words[0]) return;

      let chosenLines: string[] = [];
      let chosenSize = 8.0;

      if (fontR.widthOfTextAtSize(String(text), 8.0) <= maxW) {
        chosenLines = [String(text)];
        chosenSize = 8.0;
      } else {
        let found = false;
        for (let s = 8.0; s >= 6.0; s -= 0.5) {
          let l1 = '';
          let l2 = '';
          let idx = 0;
          while (idx < words.length) {
            const test = l1 ? l1 + ' ' + words[idx] : words[idx];
            if (fontR.widthOfTextAtSize(test, s) <= maxW) {
              l1 = test;
              idx++;
            } else break;
          }
          while (idx < words.length) {
            const test = l2 ? l2 + ' ' + words[idx] : words[idx];
            if (fontR.widthOfTextAtSize(test, s) <= maxW) {
              l2 = test;
              idx++;
            } else break;
          }
          if (idx === words.length) {
            chosenLines = [l1, l2].filter(Boolean);
            chosenSize = s;
            found = true;
            break;
          }
        }
        if (!found) {
          chosenSize = 6.0;
          let l1 = '';
          let idx = 0;
          while (idx < words.length) {
            const test = l1 ? l1 + ' ' + words[idx] : words[idx];
            if (fontR.widthOfTextAtSize(test, chosenSize) <= maxW) {
              l1 = test;
              idx++;
            } else break;
          }
          let l2 = '';
          while (idx < words.length) {
            const test = l2 ? l2 + ' ' + words[idx] : words[idx];
            if (fontR.widthOfTextAtSize(test + '...', chosenSize) <= maxW) {
              l2 = test;
              idx++;
            } else {
              l2 = l2 ? l2 + '...' : words[idx].slice(0, 8) + '...';
              break;
            }
          }
          chosenLines = [l1, l2].filter(Boolean);
        }
      }

      if (chosenLines.length === 1) {
        const lineW = fontR.widthOfTextAtSize(chosenLines[0], chosenSize);
        const x = minX + (maxX - minX - lineW) / 2;
        pg.drawText(chosenLines[0], {
          x,
          y: centerY,
          size: chosenSize,
          font: fontR,
          color: textColor,
        });
      } else if (chosenLines.length >= 2) {
        const lineSpacing = chosenSize + 2.5;
        const y1 = centerY + lineSpacing / 2;
        const y2 = centerY - lineSpacing / 2;
        for (let i = 0; i < 2; i++) {
          const lineW = fontR.widthOfTextAtSize(chosenLines[i], chosenSize);
          const x = minX + (maxX - minX - lineW) / 2;
          const y = i === 0 ? y1 : y2;
          pg.drawText(chosenLines[i], {
            x,
            y,
            size: chosenSize,
            font: fontR,
            color: textColor,
          });
        }
      }
    };

    for (const item of soiItems) {
      if (item.val) {
        drawCentered(item.val, 206.0, 297.5, item.y, {
          bold: true,
          size: 10.5,
          color: blueColor,
        });
      }
      if (item.note) {
        drawCellNote(item.note, 489.5, 560.6, item.y);
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

    // Bác sĩ đọc kết quả & Chữ ký số
    const drLookupKey = (caseItem.bacSiDocUsername || caseItem.bacSiDoc || caseItem.nguoiThucHien || 'bacsi_hung').trim();
    const drName = (caseItem.bacSiDoc || caseItem.nguoiThucHien || 'BS CK1 PHẠM THẾ HÙNG').trim();
    let subTitle = (caseItem.chucDanhDoc || '').trim();
    let signatureUrl = (caseItem.signatureUrl || caseItem.chuKy || caseItem.signatureImage || '').trim();

    if (this.usersService) {
      try {
        const docInfo = await this.usersService.getDoctorInfo(drLookupKey);
        if (docInfo) {
          if (!subTitle && docInfo.title) subTitle = docInfo.title;
          if (!signatureUrl && docInfo.signatureUrl) signatureUrl = docInfo.signatureUrl;
        }
      } catch (e) {}
    }

    if (!subTitle) {
      subTitle = '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)';
    }

    // Che toàn bộ khối tên cũ trên phôi (từ Y=62 đến Y=98, X=330 đến X=540)
    pg.drawRectangle({
      x: 330,
      y: 62,
      width: 210,
      height: 38,
      color: rgb(1, 1, 1),
    });

    const centerX = 435;
    drawCentered(drName, centerX - 105, centerX + 105, 85.9, { bold: true, size: 9.5 });
    drawCentered(subTitle, centerX - 105, centerX + 105, 74.9, {
      size: 8.0,
      color: rgb(0.35, 0.35, 0.35),
    });

    // Chữ ký điện tử / Ảnh chữ ký nếu đã ký
    const isSigned = !!(caseItem.daKy || caseItem.daKy1 || caseItem.trangThai === 'da_tra_ket_qua');
    if (isSigned) {
      let sigBuffer: Buffer | null = null;
      if (signatureUrl) {
        try {
          sigBuffer = await this.minioService.getImageBuffer(signatureUrl);
        } catch (e) {}
      }

      if (!sigBuffer) {
        const slug = drName.toLowerCase();
        let fallbackName = '';
        if (slug.includes('lánh') || slug.includes('lanh')) fallbackName = 'bacsi_lanh.png';
        else if (slug.includes('hùng') || slug.includes('hung')) fallbackName = 'bacsi_hung.png';
        else if (slug.includes('sơn') || slug.includes('son')) fallbackName = 'bacsi_son.png';
        else if (slug.includes('dương') || slug.includes('duong')) fallbackName = 'bacsi_duong.png';
        else if (slug.includes('trực') || slug.includes('truc')) fallbackName = 'bacsi_truc.png';

        if (fallbackName) {
          const fbPath = path.join(process.cwd(), 'templates', 'signatures', fallbackName);
          if (fs.existsSync(fbPath)) {
            sigBuffer = fs.readFileSync(fbPath);
          }
        }
      }

      if (sigBuffer) {
        try {
          let embeddedSig;
          const isPng =
            sigBuffer.length > 4 &&
            sigBuffer[0] === 0x89 &&
            sigBuffer[1] === 0x50 &&
            sigBuffer[2] === 0x4e &&
            sigBuffer[3] === 0x47;
          if (isPng) {
            embeddedSig = await pdfDoc.embedPng(sigBuffer);
          } else {
            embeddedSig = await pdfDoc.embedJpg(sigBuffer);
          }

          const { width: origW, height: origH } = embeddedSig.size();
          const targetH = 45;
          let targetW = (origW / origH) * targetH;
          if (targetW > 180) targetW = 180;

          const sigX = centerX - targetW / 2;
          const sigY = 125.0 - targetH / 2;

          pg.drawImage(embeddedSig, {
            x: sigX,
            y: sigY,
            width: targetW,
            height: targetH,
          });
        } catch (e) {}
      }
    }

    // Đóng con dấu đỏ công ty GenHD nếu đã được Admin xác nhận trả kết quả
    if (caseItem.trangThai === 'da_tra_ket_qua' || caseItem.status === 'diagnosed') {
      await this.drawOfficialStamp(pdfDoc, pg, centerX, 105);
    }
  }
}
