import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import { BasePdfService } from './base-pdf.service.js';
import { MinioService } from '../../minio/minio.service.js';
import { UsersService } from '../../users/users.service.js';

@Injectable()
export class GiaiphaubenhPdfService extends BasePdfService {
  constructor(
    private minioService: MinioService,
    private usersService: UsersService,
  ) {
    super();
  }
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

    // Mẫu GPB Tế Bào Học (Tuyến vú, tuyến giáp) tiêu đề dài hơn nên toàn bộ bảng bị đẩy xuống 4.56 pt
    const isTebaoHoc =
      caseItem?.loaiXetNghiem === 'giaiphaubenh_tebaohoc' ||
      templateId === 'giaiphaubenh_tebaohoc_default';
    const dY = isTebaoHoc ? -4.56 : 0;

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
      pg.drawText(String(text), { x, y: y + dY, size, font, color });
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
      pg.drawText(String(text), { x, y: y + dY, size, font, color });
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
      let currentY = startY + dY;

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

    drawText(caseItem.maSo, X_LEFT, 707.2, { bold: true, size: 9.5 });
    drawText(
      (caseItem.hoTen || '').toUpperCase(),
      X_RIGHT,
      707.2,
      { bold: true, size: 9.5 },
    );

    drawText(String(caseItem.namSinh || ''), X_LEFT, 688.3, { size: 9.0 });
    drawText(caseItem.gioiTinh || 'Nữ', X_RIGHT, 688.3, { size: 9.0 });

    drawText(caseItem.diaChi || '', X_LEFT, 669.6, { size: 8.5 });

    drawText(caseItem.soDienThoai || '', X_LEFT, 650.6, { size: 9.0 });
    drawText(caseItem.bacSiChiDinh || '', X_RIGHT, 650.6, { size: 9.0 });

    drawText(caseItem.donVi || '', X_LEFT, 631.6, { size: 9.0 });

    drawText(caseItem.chanDoanLamSang || '', X_LEFT, 612.7, { size: 9.0 });
    drawText(caseItem.viTriBenhPham || '', X_LEFT, 595.6, { size: 9.0 });

    const tNhan = this.fmtDate(caseItem.ngayNhanMau || caseItem.createdAt);
    const tKq = this.fmtDate(
      caseItem.ngayTraKetQua || caseItem.ngayDuKienTra,
    );
    drawText(tNhan, X_LEFT, 577.6, { size: 9.0 });
    drawText(tKq, X_RIGHT, 577.4, { size: 9.0 });

    // --- 2. KẾT QUẢ GIẢI PHẪU BỆNH ---
    // Mô tả Đại thể (ĐẠI THỂ) - Vùng trắng dưới thanh ĐẠI THỂ
    drawWrappedText(caseItem.daiThe || '', 55.0, 462.0, 485, 14, { size: 9.0 });

    // Mô tả Vi thể (VI THỂ) - Vùng trắng dưới thanh VI THỂ
    drawWrappedText(caseItem.viThe || '', 55.0, 392.0, 485, 14, { size: 9.0 });

    // --- 3. KẾT LUẬN ---
    // Khung xanh nhạt KẾT LUẬN tại Y = 178.9 (đối với mẫu tế bào học: 179.2 để mép dưới chữ khớp chuẩn với chữ KẾT LUẬN:)
    const ketLuanY = isTebaoHoc ? 179.2 : 178.9;
    drawWrappedText(
      caseItem.ketLuan || '',
      115.0,
      ketLuanY,
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
      y: 128 + dY,
      width: 185,
      height: 12,
      color: rgb(1, 1, 1),
    });
    drawCentered(dStr, 345, 530, 132.8, { size: 8.5, color: rgb(0.25, 0.3, 0.35) });

    // Bác sĩ đọc kết quả & Chữ ký số
    const drName = (caseItem.bacSiDoc || caseItem.nguoiThucHien || 'BSCK1 . Nguyễn Trung Trực').trim();
    let subTitle = (caseItem.chucDanhDoc || '').trim();
    let signatureUrl = (caseItem.signatureUrl || caseItem.chuKy || caseItem.signatureImage || '').trim();

    if (this.usersService) {
      try {
        const docInfo = await this.usersService.getDoctorInfo(drName);
        if (docInfo) {
          if (!subTitle && docInfo.title) subTitle = docInfo.title;
          if (!signatureUrl && docInfo.signatureUrl) signatureUrl = docInfo.signatureUrl;
        }
      } catch (e) {}
    }

    if (!subTitle) {
      subTitle = '(Bệnh viện K Trung Ương)';
    }

    // Che toàn bộ khối tên cũ trên phôi (từ Y=20 đến Y=58, X=330 đến X=540)
    pg.drawRectangle({
      x: 330,
      y: 20,
      width: 210,
      height: 38,
      color: rgb(1, 1, 1),
    });

    const centerX = 435;
    drawCentered(drName, centerX - 105, centerX + 105, 43.5, { bold: true, size: 9.5 });
    drawCentered(subTitle, centerX - 105, centerX + 105, 32.4, {
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
          const sigY = 82.0 + dY - targetH / 2;

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
      await this.drawOfficialStamp(pdfDoc, pg, centerX, 65 + dY);
    }

    // --- 5. ẢNH TIÊU BẢN GIẢI PHẪU BỆNH (Góc dưới bên trái, nếu có) ---
    const imgData = caseItem.anhTeBao || caseItem.anhGpb;
    if (imgData) {
      try {
        const imgBuffer = await this.minioService.getImageBuffer(imgData);
        if (imgBuffer) {
          await this.drawFittedImage(pdfDoc, pg, imgBuffer, {
            x: 55,
            y: 25 + dY,
            width: 185,
            height: 120,
          });
        }
      } catch (e) {
        // ignore image error
      }
    }
  }
}
