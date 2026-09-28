import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import { BasePdfService } from './base-pdf.service.js';
import { MinioService } from '../../minio/minio.service.js';
import { UsersService } from '../../users/users.service.js';

@Injectable()
export class HpvPdfService extends BasePdfService {
  constructor(
    private minioService: MinioService,
    private usersService: UsersService,
  ) {
    super();
  }

  private async renderDoctorSignatureBlock({
    pdfDoc,
    pg,
    caseItem,
    centerX,
    yName,
    yTitle,
    ySigCenter,
    maskBox,
    fontR,
    fontB,
    textColor,
  }: {
    pdfDoc: PDFDocument;
    pg: any;
    caseItem: any;
    centerX: number;
    yName: number;
    yTitle: number;
    ySigCenter: number;
    maskBox: { x: number; y: number; width: number; height: number };
    fontR: PDFFont;
    fontB: PDFFont;
    textColor: any;
  }) {
    // 1. Che sạch toàn bộ chữ in sẵn cũ (tên & chú thích trên phôi)
    pg.drawRectangle({
      x: maskBox.x,
      y: maskBox.y,
      width: maskBox.width,
      height: maskBox.height,
      color: rgb(1, 1, 1),
    });

    const drawCentered = (text: string, minX: number, maxX: number, y: number, opt: any = {}) => {
      if (!text) return;
      const font = opt.bold ? fontB : fontR;
      let size = opt.size || 9.5;
      const color = opt.color || textColor;
      const maxAllowedWidth = maxX - minX - 4;
      let width = font.widthOfTextAtSize(String(text), size);
      if (width > maxAllowedWidth && width > 0) {
        size = Math.max(5.5, size * (maxAllowedWidth / width));
        width = font.widthOfTextAtSize(String(text), size);
      }
      const x = minX + (maxX - minX - width) / 2;
      pg.drawText(String(text), { x, y, size, font, color });
    };

    const drName = (caseItem.bacSiDoc || caseItem.nguoiThucHien || 'BS CK1 PHẠM THẾ HÙNG').trim();
    let subTitle = (caseItem.chucDanhDoc || '').trim();
    let signatureUrl = (caseItem.signatureUrl || caseItem.chuKy || '').trim();

    if (this.usersService) {
      try {
        const docInfo = await this.usersService.getDoctorInfo(drName);
        if (docInfo) {
          if (!subTitle && docInfo.title) {
            subTitle = docInfo.title;
          }
          if (!signatureUrl && docInfo.signatureUrl) {
            signatureUrl = docInfo.signatureUrl;
          }
        }
      } catch (e) {
        console.error('[HpvPdfService] Lỗi khi lấy thông tin bác sĩ:', e);
      }
    }

    if (!subTitle) {
      subTitle = '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)';
    }

    // 2. Vẽ Tên bác sĩ căn giữa 100% tại trục centerX
    drawCentered(drName, centerX - 105, centerX + 105, yName, {
      bold: true,
      size: 9.5,
      color: textColor,
    });

    // 3. Vẽ Chú thích chuyên môn / đơn vị công tác căn giữa 100% tại trục centerX
    drawCentered(subTitle, centerX - 105, centerX + 105, yTitle, {
      size: 8.0,
      color: rgb(0.35, 0.35, 0.35),
    });

    // 4. Nếu đã ký duyệt, vẽ chữ ký căn giữa tại trục centerX
    const isSigned = !!(caseItem.daKy || caseItem.daKy1 || caseItem.trangThai === 'da_tra_ket_qua');
    if (isSigned) {
      let sigBuffer: Buffer | null = null;
      if (signatureUrl) {
        try {
          sigBuffer = await this.minioService.getImageBuffer(signatureUrl);
        } catch (e) {}
      }

      // Fallback file cục bộ nếu MinIO chưa có
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
          const targetH = 45; // Chiều cao ảnh chữ ký
          let targetW = (origW / origH) * targetH;
          if (targetW > 180) targetW = 180;

          const sigX = centerX - targetW / 2;
          const sigY = ySigCenter - targetH / 2;

          pg.drawImage(embeddedSig, {
            x: sigX,
            y: sigY,
            width: targetW,
            height: targetH,
          });
        } catch (e) {
          console.error('[HpvPdfService] Lỗi nhúng ảnh chữ ký:', e);
        }
      }
    }

    // Đóng con dấu đỏ công ty GenHD nếu đã được Admin xác nhận trả kết quả
    if (caseItem.trangThai === 'da_tra_ket_qua' || caseItem.status === 'diagnosed') {
      const centerStampY = (ySigCenter + yName) / 2;
      await this.drawOfficialStamp(pdfDoc, pg, centerX, centerStampY);
    }
  }

  /**
   * Xử lý vẽ kết quả HPV (HPV 40, HPV 20, HPV 23)
   */
  async generatePdf(
    pdfDoc: PDFDocument,
    caseItem: any,
    cat: string,
    fontR: PDFFont,
    fontB: PDFFont,
    pageIndex = 0,
    templateId?: string,
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

      // Helper to center text in a column [minX, maxX] with auto-shrink
      const drawCentered = (text: string, minX: number, maxX: number, y: number, opt: any = {}) => {
        if (!text) return;
        const font = opt.bold ? fontB : fontR;
        let size = opt.size || 9.5;
        const color = opt.color || textColor;
        const maxAllowedWidth = (maxX - minX) - 4; // chừa lề 2pt mỗi bên để chữ không bao giờ chạm viền cột
        let width = font.widthOfTextAtSize(String(text), size);
        if (width > maxAllowedWidth && width > 0) {
          size = Math.max(5.5, size * (maxAllowedWidth / width));
          width = font.widthOfTextAtSize(String(text), size);
        }
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

      // 4. KẾT LUẬN & KHUYẾN NGHỊ (Căn chuẩn 2 cột: Cột nhãn X=43.5, Cột nội dung X=125)
      const klText = (caseItem.ketLuan || 'ÂM TÍNH VỚI CÁC TYPE HPV KHẢO SÁT.').toUpperCase();
      drawText(klText, 125, 262.9, {
        bold: true,
        size: 8.5,
        color: blueColor,
      });

      const knText = (caseItem.khuyenNghi && caseItem.khuyenNghi.trim()) ? caseItem.khuyenNghi.trim() : 'Không có';
      drawText('KHUYẾN NGHỊ:', 43.5, 246.0, {
        bold: true,
        size: 8.5,
        color: blueColor,
      });
      drawText(knText, 125, 246.0, {
        size: 8.5,
        color: textColor,
      });

      // 5. NGÀY KÝ VÀ BÁC SĨ ĐỌC KẾT QUẢ
      // Che phần chấm "Hà Nội, ngày ..... tháng ..... năm 202..."
      pg.drawRectangle({
        x: 340,
        y: 209,
        width: 190,
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
      drawCentered(dStr, 330, 540, 214.1, { size: 8.5, color: rgb(0.25, 0.3, 0.35) });

      // Đổ tên, chú thích và chữ ký Bác sĩ căn giữa tuyệt đối
      await this.renderDoctorSignatureBlock({
        pdfDoc,
        pg,
        caseItem,
        centerX: 435,
        yName: 124.8,
        yTitle: 111.0,
        ySigCenter: 165.0,
        maskBox: { x: 330, y: 98, width: 210, height: 38 },
        fontR,
        fontB,
        textColor,
      });
      return;
    }

    if (cat === 'hpv40') {
      const textColor = rgb(0.1, 0.15, 0.2);
      const blueColor = rgb(0.05, 0.25, 0.45);
      const redColor = rgb(0.8, 0.1, 0.1);

      // Hàm vẽ chữ trong suốt (không vẽ nền trắng đè lên watermark)
      const drawText = (text: string, x: number, y: number, opt: any = {}) => {
        if (!text) return;
        const font = opt.bold ? fontB : fontR;
        const size = opt.size || 9.0;
        const color = opt.color || textColor;
        pg.drawText(String(text), { x, y, size, font, color });
      };

      // Helper to center text in a column [minX, maxX] with auto-shrink
      const drawCentered = (text: string, minX: number, maxX: number, y: number, opt: any = {}) => {
        if (!text) return;
        const font = opt.bold ? fontB : fontR;
        let size = opt.size || 9.5;
        const color = opt.color || textColor;
        const maxAllowedWidth = (maxX - minX) - 4; // chừa lề 2pt mỗi bên để chữ không bao giờ chạm viền cột
        let width = font.widthOfTextAtSize(String(text), size);
        if (width > maxAllowedWidth && width > 0) {
          size = Math.max(5.5, size * (maxAllowedWidth / width));
          width = font.widthOfTextAtSize(String(text), size);
        }
        const x = minX + (maxX - minX - width) / 2;
        pg.drawText(String(text), { x, y, size, font, color });
      };

      const X_LEFT = 137.5;
      const X_RIGHT = 399.5;

      // 1. CỘT TRÁI (Tất cả căn trái đều nhau tại X=137.5, không nền trắng)
      drawText(caseItem.maSo, X_LEFT, 692.6, { bold: true, size: 9.5 });
      drawText(String(caseItem.namSinh || ''), X_LEFT, 673.6, { size: 9.0 });
      drawText(caseItem.diaChi || '', X_LEFT, 654.7, { size: 8.5 });
      drawText(caseItem.soDienThoai || '', X_LEFT, 635.7, { size: 9.0 });
      drawText(caseItem.donVi || '', X_LEFT, 616.7, { size: 9.0 });
      // Không đổ trường loại mẫu (phôi trắng đã có sẵn 'Dịch')
      drawText(tNhan, X_LEFT, 549.0, { size: 9.0 });

      // 2. CỘT PHẢI (Tất cả căn trái đều nhau tại X=399.5, không nền trắng)
      drawText((caseItem.hoTen || '').toUpperCase(), X_RIGHT, 692.6, { bold: true, size: 9.5 });
      drawText(caseItem.gioiTinh || 'Nữ', X_RIGHT, 673.6, { size: 9.0 });
      drawText(caseItem.bacSiChiDinh || '', X_RIGHT, 635.7, { size: 9.0 });
      drawText(tKq, X_RIGHT, 549.0, { size: 9.0 });

      // 3. BẢNG KẾT QUẢ 4 HÀNG (Cột KẾT QUẢ giữa X: 456.43 -> 560.88)
      const colMinX = 456.43;
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
        { bold: true, size: 9.5, color: r2Pos ? redColor : blueColor },
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

      // Row 4: Các Type HPV Khác (20 Types)
      const r4Val = caseItem.hpvOtherTypesResult || caseItem.hpvOtherResult || 'Âm tính';
      const r4Pos = _isPos(r4Val);
      drawCentered(
        r4Val,
        colMinX,
        colMaxX,
        370.5,
        { bold: true, size: 9.5, color: r4Pos ? redColor : blueColor },
      );

      // 4. KẾT LUẬN & KHUYẾN NGHỊ (Căn chuẩn 2 cột: Cột nhãn X=43.5, Cột nội dung X=125)
      const klText = (caseItem.ketLuan || 'ÂM TÍNH VỚI VIRUS HPV (40 TYPE TRÊN) TRÊN MẪU NHẬN ĐƯỢC.').toUpperCase();
      // Hàng trên: Y = 231.9 khớp chính xác baseline chữ "KẾT LUẬN:" in sẵn (Y=231.91), X = 125 căn thẳng cột nội dung
      drawText(klText, 125, 231.9, {
        bold: true,
        size: 8.5,
        color: blueColor,
      });

      // Hàng dưới: Nâng Y lên 216.0 cho cả nhãn "KHUYẾN NGHỊ:" và nội dung để thoáng đáy khung
      const knText = (caseItem.khuyenNghi && caseItem.khuyenNghi.trim()) ? caseItem.khuyenNghi.trim() : 'Không có';
      drawText('KHUYẾN NGHỊ:', 43.5, 216.0, {
        bold: true,
        size: 8.5,
        color: blueColor,
      });
      drawText(knText, 125, 216.0, {
        size: 8.5,
        color: textColor,
      });

      // 5. NGÀY KÝ VÀ BÁC SĨ ĐỌC KẾT QUẢ
      // Che phần chấm "Hà Nội, ngày ..... tháng ..... năm 202..." tại Y=178
      pg.drawRectangle({
        x: 340,
        y: 178,
        width: 190,
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
      drawCentered(dStr, 330, 540, 183.0, { size: 8.5, color: rgb(0.25, 0.3, 0.35) });

      // Đổ tên, chú thích và chữ ký Bác sĩ căn giữa tuyệt đối
      // Mép trên khung vàng "GHI CHÚ & CHÚ Ý" nằm tại Y = 76.7; đặt đáy maskBox tại Y = 77.5 để che sạch phôi cũ mà hoàn toàn không đè lên khung vàng
      await this.renderDoctorSignatureBlock({
        pdfDoc,
        pg,
        caseItem,
        centerX: 435,
        yName: 94.0,
        yTitle: 82.5,
        ySigCenter: 133.5,
        maskBox: { x: 330, y: 77.5, width: 210, height: 29 },
        fontR,
        fontB,
        textColor,
      });

      // 6. NẾU CÓ BIỂU ĐỒ REAL-TIME PCR
      if (caseItem.hienBieuDo && caseItem.anhHpv) {
        try {
          const imgBuffer = await this.minioService.getImageBuffer(caseItem.anhHpv);
          if (imgBuffer) {
            pg.drawRectangle({
              x: 42,
              y: 248,
              width: 512,
              height: 82,
              color: rgb(1, 1, 1),
            });
            await this.drawFittedImage(pdfDoc, pg, imgBuffer, {
              x: 45,
              y: 249,
              width: 506,
              height: 80,
            });
          }
        } catch (e) {
          // ignore error
        }
      }
      return;
    }

    if (cat === 'hpv23') {
      const textColor = rgb(0.1, 0.15, 0.2);
      const blueColor = rgb(0.05, 0.25, 0.45);
      const redColor = rgb(0.8, 0.1, 0.1);

      // Hàm vẽ chữ trong suốt (không vẽ nền trắng đè lên watermark)
      const drawText = (text: string, x: number, y: number, opt: any = {}) => {
        if (!text) return;
        const font = opt.bold ? fontB : fontR;
        const size = opt.size || 9.0;
        const color = opt.color || textColor;
        pg.drawText(String(text), { x, y, size, font, color });
      };

      // Helper to center text in a column [minX, maxX] with auto-shrink
      const drawCentered = (text: string, minX: number, maxX: number, y: number, opt: any = {}) => {
        if (!text) return;
        const font = opt.bold ? fontB : fontR;
        let size = opt.size || 9.5;
        const color = opt.color || textColor;
        const maxAllowedWidth = (maxX - minX) - 4; // chừa lề 2pt mỗi bên để chữ không bao giờ chạm viền cột
        let width = font.widthOfTextAtSize(String(text), size);
        if (width > maxAllowedWidth && width > 0) {
          size = Math.max(5.5, size * (maxAllowedWidth / width));
          width = font.widthOfTextAtSize(String(text), size);
        }
        const x = minX + (maxX - minX - width) / 2;
        pg.drawText(String(text), { x, y, size, font, color });
      };

      const X_LEFT = 137.5;
      const X_RIGHT = 399.5;

      // 1. CỘT TRÁI (Tất cả căn trái đều nhau tại X=137.5, không nền trắng)
      drawText(caseItem.maSo, X_LEFT, 693.0, { bold: true, size: 9.5 });
      drawText(String(caseItem.namSinh || ''), X_LEFT, 674.0, { size: 9.0 });
      drawText(caseItem.diaChi || '', X_LEFT, 654.5, { size: 8.5 });
      drawText(caseItem.soDienThoai || '', X_LEFT, 635.5, { size: 9.0 });
      drawText(caseItem.donVi || '', X_LEFT, 616.5, { size: 9.0 });

      // Che chữ "Dịch" in sẵn trên phôi trắng và ghi loại mẫu sạch đẹp
      pg.drawRectangle({
        x: 133,
        y: 574,
        width: 250,
        height: 14,
        color: rgb(1, 1, 1),
      });
      drawText(caseItem.loaiMau || 'Dịch phết', X_LEFT, 579.5, { size: 9.0 });
      drawText(tNhan, X_LEFT, 550.0, { size: 9.0 });

      // 2. CỘT PHẢI (Tất cả căn trái đều nhau tại X=399.5, không nền trắng)
      drawText((caseItem.hoTen || '').toUpperCase(), X_RIGHT, 693.0, { bold: true, size: 9.5 });
      drawText(caseItem.gioiTinh || 'Nữ', X_RIGHT, 674.0, { size: 9.0 });
      drawText(caseItem.bacSiChiDinh || '', X_RIGHT, 635.5, { size: 9.0 });
      drawText(tKq, X_RIGHT, 550.0, { size: 9.0 });

      // 3. BẢNG KẾT QUẢ 4 HÀNG (Cột KẾT QUẢ giữa X: 456.4 -> 560.0)
      const colMinX = 456.4;
      const colMaxX = 560.0;

      // Row 1: HPV Nguy Cơ Cao (Type 16, 18) -> Y = 459.7
      const r1Val = caseItem.hpvHighRiskResult || 'Âm tính';
      const r1Pos = _isPos(r1Val);
      drawCentered(
        r1Val,
        colMinX,
        colMaxX,
        459.7,
        { bold: r1Pos, size: 9.5, color: r1Pos ? redColor : blueColor },
      );

      // Row 2: HPV Nguy Cơ Cao Khác (10 Types) -> Y = 429.7
      const r2Val = caseItem.hpvHighRiskOtherResult || 'Âm tính';
      const r2Pos = _isPos(r2Val);
      drawCentered(
        r2Val,
        colMinX,
        colMaxX,
        429.7,
        { bold: r2Pos, size: 9.5, color: r2Pos ? redColor : blueColor },
      );

      // Row 3: Các Type HPV khác (9 Types) -> Y = 407.0 (Đặc thù HPV 23: 9 types khác nằm ở HÀNG 3)
      const r3Val = caseItem.hpvOtherTypesResult || caseItem.hpvOtherResult || 'Âm tính';
      const r3Pos = _isPos(r3Val);
      drawCentered(
        r3Val,
        colMinX,
        colMaxX,
        407.0,
        { bold: r3Pos, size: 9.5, color: r3Pos ? redColor : blueColor },
      );

      // Row 4: HPV Nguy Cơ Thấp (2 Types: 6, 11) -> Y = 387.0 (Đặc thù HPV 23: 2 types thấp nằm ở HÀNG 4)
      const r4Val = caseItem.hpvLowRiskResult || 'Âm tính';
      const r4Pos = _isPos(r4Val);
      drawCentered(
        r4Val,
        colMinX,
        colMaxX,
        387.0,
        { bold: r4Pos, size: 9.5, color: r4Pos ? redColor : blueColor },
      );

      // 4. KẾT LUẬN & KHUYẾN NGHỊ (Khung KẾT LUẬN của HPV 23: hàng trên Kết luận, hàng dưới Khuyến nghị)
      const hasPos = r1Pos || r2Pos || r3Pos || r4Pos;
      let klText = caseItem.ketLuan || '';
      if (!klText) {
        if (hasPos) {
          klText = 'DƯƠNG TÍNH VỚI VIRUS HPV TRÊN MẪU NHẬN ĐƯỢC.';
        } else {
          klText = 'ÂM TÍNH VỚI VIRUS HPV (23 TYPE TRÊN) TRÊN MẪU NHẬN ĐƯỢC.';
        }
      }
      // Hàng trên: Kết luận (căn thẳng cột nội dung X = 125)
      drawText(klText.toUpperCase(), 125, 251.8, {
        bold: true,
        size: 8.5,
        color: hasPos ? redColor : blueColor,
      });

      // Hàng dưới: Khuyến nghị (nhãn X = 43.5, nội dung X = 125)
      const knText = (caseItem.khuyenNghi && caseItem.khuyenNghi.trim()) ? caseItem.khuyenNghi.trim() : 'Không có';
      drawText('KHUYẾN NGHỊ:', 43.5, 235.0, {
        bold: true,
        size: 8.5,
        color: blueColor,
      });
      drawText(knText, 125, 235.0, {
        size: 8.5,
        color: textColor,
      });

      // 5. NGÀY KÝ VÀ BÁC SĨ ĐỌC KẾT QUẢ
      // Che dòng chữ chấm "Hà Nội, ngày ..... tháng ..... năm 202..." tại Y = 203.1
      pg.drawRectangle({
        x: 340,
        y: 198,
        width: 190,
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
      drawCentered(dStr, 330, 540, 203.1, { size: 8.5, color: rgb(0.25, 0.3, 0.35) });

      // Đổ tên, chú thích và chữ ký Bác sĩ căn giữa tuyệt đối
      await this.renderDoctorSignatureBlock({
        pdfDoc,
        pg,
        caseItem,
        centerX: 435,
        yName: 118.0,
        yTitle: 104.0,
        ySigCenter: 156.0,
        maskBox: { x: 330, y: 92, width: 210, height: 38 },
        fontR,
        fontB,
        textColor,
      });

      // 6. NẾU CÓ BIỂU ĐỒ REAL-TIME PCR
      if (caseItem.hienBieuDo && caseItem.anhHpv) {
        try {
          const imgBuffer = await this.minioService.getImageBuffer(caseItem.anhHpv);
          if (imgBuffer) {
            pg.drawRectangle({
              x: 45,
              y: 268,
              width: 506,
              height: 72,
              color: rgb(1, 1, 1),
            });
            await this.drawFittedImage(pdfDoc, pg, imgBuffer, {
              x: 48,
              y: 270,
              width: 500,
              height: 68,
            });
          }
        } catch (e) {
          // ignore error
        }
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
