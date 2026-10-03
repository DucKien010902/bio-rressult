import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import { BasePdfService } from './base-pdf.service.js';
import { MinioService } from '../../minio/minio.service.js';
import { UsersService } from '../../users/users.service.js';

@Injectable()
export class CellPdfService extends BasePdfService {
  constructor(
    private minioService: MinioService,
    private usersService: UsersService,
  ) {
    super();
  }
  /**
   * Xử lý vẽ kết quả Tế bào học Cổ tử cung (Cell & ThinPrep)
   * Tọa độ bóc tách & căn chỉnh chuẩn 100% khớp với mẫu trắng thật GenHD
   */
  async generatePdf(
    pdfDoc: PDFDocument,
    caseItem: any,
    fontR: PDFFont,
    fontB: PDFFont,
    pageIndex = 0,
    templateId?: string,
  ) {
    if (templateId === 'thinprep_medilab') {
      return this.renderThinprepMedilab(
        pdfDoc,
        caseItem,
        fontR,
        fontB,
        pageIndex,
      );
    }

    const pg = pdfDoc.getPages()[pageIndex];

    const textColor = rgb(0.1, 0.15, 0.2);
    const blueColor = rgb(0.05, 0.25, 0.45);

    // Helper vẽ chữ trực tiếp lên phôi mẫu sạch (không nền trắng)
    const drawCellText = (
      x: number,
      y: number,
      text: string,
      opts: { bold?: boolean; size?: number; color?: any } = {},
    ) => {
      const { bold = false, size = 9, color = textColor } = opts;
      if (text) {
        pg.drawText(String(text), {
          x,
          y,
          size,
          font: bold ? fontB : fontR,
          color,
        });
      }
    };

    // Helper căn giữa chữ trong khoảng [minX, maxX] với cơ chế tự co cỡ chữ nếu dài
    const drawCentered = (
      text: string,
      minX: number,
      maxX: number,
      y: number,
      opts: { bold?: boolean; size?: number; color?: any } = {},
    ) => {
      if (!text) return;
      const { bold = false, size = 9, color = textColor } = opts;
      const font = bold ? fontB : fontR;
      let finalSize = size;
      const maxAllowedWidth = (maxX - minX) - 4;
      let textWidth = font.widthOfTextAtSize(String(text), finalSize);
      if (textWidth > maxAllowedWidth && textWidth > 0) {
        finalSize = Math.max(5.5, finalSize * (maxAllowedWidth / textWidth));
        textWidth = font.widthOfTextAtSize(String(text), finalSize);
      }
      const x = minX + (maxX - minX - textWidth) / 2;
      pg.drawText(String(text), { x, y, size: finalSize, font, color });
    };

    // Helper đánh dấu X chuẩn xác vào giữa ô vuông checkbox <0000>
    const drawCheck = (boxX: number, boxY: number, checked = false) => {
      if (!checked) return;
      pg.drawText('X', {
        x: boxX + 0.8,
        y: boxY + 0.6,
        size: 7.2,
        font: fontB,
        color: rgb(0.05, 0.2, 0.5),
      });
    };

    // Helper kiểm tra một option có được chọn trong array hoặc string hay không
    const hasItem = (
      field: string,
      key: string,
      label?: string,
      keywords: string[] = [],
    ) => {
      const val = caseItem[field];
      if (!val) return false;
      if (typeof val === 'boolean') return val;
      if (Array.isArray(val)) {
        return val.some((v: any) => {
          if (!v) return false;
          const s = String(v).trim().toLowerCase();
          if (s === key.toLowerCase()) return true;
          if (label && (s === label.toLowerCase() || s.includes(label.toLowerCase()))) return true;
          return keywords.some((k) => s === k.toLowerCase() || s.includes(k.toLowerCase()));
        });
      }
      if (typeof val === 'string') {
        const lower = val.toLowerCase().trim();
        if (lower === key.toLowerCase()) return true;
        if (label && lower.includes(label.toLowerCase())) return true;
        const parts = lower.split(',').map((p) => p.trim());
        if (parts.includes(key.toLowerCase())) return true;
        if (label && parts.includes(label.toLowerCase())) return true;
        return keywords.some((k) => lower.includes(k.toLowerCase()));
      }
      return false;
    };

    const isCheckedVal = (v: any) => {
      if (!v) return false;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        return s !== '' && s !== 'false' && s !== '0' && s !== 'null';
      }
      return false;
    };

    // --- 1. Header Hành chính (Cột trái X=137.5, Cột phải X=399.5) ---
    const X_LEFT = 137.5;
    const X_RIGHT = 399.5;

    drawCellText(X_LEFT, 710.8, caseItem.maSo || '', { bold: true, size: 9.5 });
    drawCellText(
      X_RIGHT,
      710.8,
      (caseItem.hoTen || '').toUpperCase(),
      { bold: true, size: 9.5 },
    );

    drawCellText(X_LEFT, 691.9, String(caseItem.namSinh || ''), { size: 9.0 });
    drawCellText(X_RIGHT, 691.9, caseItem.gioiTinh || 'Nữ', { size: 9.0 });

    drawCellText(X_LEFT, 672.9, caseItem.diaChi || '', { size: 8.5 });

    drawCellText(X_LEFT, 654.2, caseItem.soDienThoai || '', { size: 9.0 });
    drawCellText(X_RIGHT, 654.2, caseItem.bacSiChiDinh || '', { size: 9.0 });

    drawCellText(X_LEFT, 635.2, caseItem.donVi || '', { size: 9.0 });

    // Loại mẫu: Che chữ "Dịch phết" in sẵn và vẽ loại mẫu
    pg.drawRectangle({
      x: 133,
      y: 610,
      width: 250,
      height: 14,
      color: rgb(1, 1, 1),
    });
    drawCellText(X_LEFT, 616.0, caseItem.loaiMau || 'Dịch phết tế bào', { size: 9.0 });

    // Đánh giá tiêu bản: Đạt (x=132.3, y=597.3), Không đạt (x=177.2, y=597.3)
    const isDat =
      (caseItem.tinhChatBenhPham || 'dat') !== 'khong_dat' &&
      caseItem.tinhChatBenhPham !== 'Không đạt';
    drawCheck(132.3, 597.3, isDat);
    drawCheck(177.2, 597.3, !isDat);
    if (!isDat && caseItem.lyDoKhongDat) {
      drawCellText(345.0, 597.3, caseItem.lyDoKhongDat, { size: 8.5 });
    }

    const tNhan = this.fmtDate(caseItem.ngayNhanMau || caseItem.createdAt);
    const tKq = this.fmtDate(
      caseItem.ngayTraKetQua || caseItem.ngayDuKienTra,
    );
    drawCellText(X_LEFT, 579.3, tNhan, { size: 9.0 });
    drawCellText(X_RIGHT, 579.3, tKq, { size: 9.0 });

    // --- 2. HỆ THỐNG BETHESDA (3 Checkbox tại Y = 519.3) ---
    drawCheck(57.1, 519.3, isCheckedVal(caseItem.khongTonThuong));
    drawCheck(275.2, 519.3, isCheckedVal(caseItem.batThuongKhac));
    drawCheck(425.9, 519.3, isCheckedVal(caseItem.teBaoNoiMac));

    // --- 3. BIẾN ĐỔI TẾ BÀO DO VI SINH (Cột trái X = 41.5) ---
    drawCheck(
      41.5,
      478.9,
      hasItem('bienDoiViSinh', 'trichomonas', 'Trichomonas vaginalis', [
        'trichomonas',
      ]),
    );
    drawCheck(
      41.5,
      467.2,
      hasItem('bienDoiViSinh', 'candida', 'Candida spp', ['candida', 'nấm']),
    );
    drawCheck(
      41.5,
      455.7,
      hasItem('bienDoiViSinh', 'actinomyces', 'Actinomyces spp', [
        'actinomyces',
      ]),
    );
    drawCheck(
      41.5,
      444.1,
      hasItem('bienDoiViSinh', 'gardnerella', 'Gardnerella vaginalis', [
        'gardnerella',
      ]),
    );
    drawCheck(41.5, 432.4, hasItem('bienDoiViSinh', 'hpv', 'HPV', ['hpv']));
    drawCheck(
      41.5,
      420.8,
      hasItem('bienDoiViSinh', 'tapKhuan', 'Tạp khuẩn', [
        'tapkhuan',
        'tạp khuẩn',
      ]),
    );

    // --- 4. BIẾN ĐỔI TẾ BÀO KHÁC (Cột phải X = 290.3) ---
    drawCheck(
      290.3,
      478.9,
      hasItem('bienDoiKhac', 'viem', 'Tế bào biến đổi do viêm', [
        'viem',
        'viêm',
      ]),
    );
    drawCheck(
      290.3,
      467.2,
      hasItem('bienDoiKhac', 'xaTri', 'Tế bào biến đổi do xạ trị', [
        'xatri',
        'xạ trị',
      ]),
    );
    drawCheck(
      290.3,
      455.7,
      hasItem('bienDoiKhac', 'iud', 'Tế bào biến đổi do vòng tránh thai (IUD)', [
        'iud',
        'tránh thai',
        'vòng',
      ]),
    );
    drawCheck(
      290.3,
      444.1,
      hasItem('bienDoiKhac', 'teo', 'Tế bào biểu mô teo', ['teo']),
    );

    // --- 5. BẤT THƯỜNG TẾ BÀO BIỂU MÔ - TẾ BÀO VẢY (Cột trái X = 41.5) ---
    drawCheck(
      41.5,
      346.2,
      hasItem(
        'batThuongVay',
        'ascUs',
        'Tế bào vảy không điển hình ý nghĩa không xác định (ASC-US)',
        ['asc-us', 'ascus'],
      ),
    );
    drawCheck(
      41.5,
      334.7,
      hasItem(
        'batThuongVay',
        'ascH',
        'Tế bào vảy không điển hình, chưa loại trừ HSIL (ASC-H)',
        ['asc-h', 'asch'],
      ),
    );
    drawCheck(
      41.5,
      322.9,
      hasItem(
        'batThuongVay',
        'lsil',
        'Tổn thương trong biểu mô vảy grade thấp (LSIL)',
        ['lsil'],
      ),
    );
    drawCheck(
      41.5,
      311.4,
      hasItem(
        'batThuongVay',
        'lsilHpv',
        'Tổn thương trong biểu mô vảy grade thấp (LSIL) + HPV',
        ['+ hpv', '+hpv', 'lsilhpv'],
      ),
    );
    drawCheck(
      41.5,
      299.9,
      hasItem(
        'batThuongVay',
        'hsil',
        'Tổn thương trong biểu mô vảy grade cao (HSIL)',
        ['(hsil)', 'hsil'],
      ),
    );
    drawCheck(
      41.5,
      288.1,
      hasItem(
        'batThuongVay',
        'carcinomaVay',
        'Carcinoma tế bào vảy',
        ['carcinomavay', 'carcinoma tế bào vảy'],
      ),
    );

    // --- 6. BẤT THƯỜNG TẾ BÀO BIỂU MÔ - TẾ BÀO TUYẾN (Cột phải X = 290.3) ---
    drawCheck(
      290.3,
      346.2,
      hasItem(
        'batThuongTuyen',
        'agc',
        'Tế bào tuyến không điển hình (AGC)',
        ['tế bào tuyến không điển hình'],
      ),
    );
    drawCheck(
      290.3,
      334.7,
      hasItem('batThuongTuyen', 'agcKdh', 'AGC, loại không đặc hiệu', [
        'agckdh',
        'không đặc hiệu',
      ]),
    );
    drawCheck(
      290.3,
      322.9,
      hasItem('batThuongTuyen', 'agcKCtc', 'AGC, hướng về K tuyến CTC', [
        'agckctc',
        'k tuyến ctc',
      ]),
    );
    drawCheck(
      290.3,
      311.4,
      hasItem('batThuongTuyen', 'agcKTuyen', 'AGC, hướng về K tuyến', [
        'agcktuyen',
        'hướng về k tuyến',
      ]),
    );
    drawCheck(
      290.3,
      299.9,
      hasItem('batThuongTuyen', 'carcinomaTaiCho', 'Carcinoma tuyến tại chỗ', [
        'tại chỗ',
        'taicho',
      ]),
    );
    drawCheck(
      290.3,
      288.1,
      hasItem(
        'batThuongTuyen',
        'carcinomaCtc',
        'Carcinoma tuyến cổ trong CTC',
        ['cổ trong ctc', 'cotrongctc'],
      ),
    );
    drawCheck(
      290.3,
      276.6,
      hasItem(
        'batThuongTuyen',
        'carcinomaNoiMac',
        'Carcinoma tuyến nội mạc tử cung',
        ['nội mạc', 'noimac'],
      ),
    );
    drawCheck(
      290.3,
      265.0,
      hasItem(
        'batThuongTuyen',
        'carcinomaKdh',
        'Carcinoma tuyến, loại không đặc hiệu',
        ['carcinomakdh'],
      ),
    );

    // --- 7. KẾT LUẬN & KHUYẾN NGHỊ ---
    const klText =
      caseItem.ketLuan2 ||
      caseItem.ketLuan ||
      'KHÔNG TỔN THƯƠNG TRONG BIỂU MÔ HAY ÁC TÍNH (NILM).';
    drawCellText(125, 222.3, klText.toUpperCase(), {
      bold: true,
      size: 8.5,
      color: blueColor,
    });

    const knText = (caseItem.khuyenNghi && caseItem.khuyenNghi.trim()) ? caseItem.khuyenNghi.trim() : 'Không có';
    drawCellText(125, 204.6, knText, {
      size: 8.5,
      color: textColor,
    });

    // --- 8. NGÀY KÝ & BÁC SĨ ĐỌC KẾT QUẢ ---
    const docCenterX = 446; // Trục giữa đồng bộ cho toàn bộ khối Bác sĩ đọc kết quả (đẩy sang phải cân đối)
    const minBoxX = docCenterX - 105;
    const maxBoxX = docCenterX + 105;

    let dStr = 'Hà Nội, ngày ..... tháng ..... năm 202...';
    if (tKq && tKq.includes('/')) {
      const parts = tKq.split('/');
      if (parts.length === 3) {
        dStr = `Hà Nội, ngày ${parts[0]} tháng ${parts[1]} năm ${parts[2]}`;
      }
    }
    // 8.1 Che dòng chữ chấm "Hà Nội, ngày ..... tháng ..... năm 202..." tại Y = 155.3
    pg.drawRectangle({
      x: 340,
      y: 150,
      width: 200,
      height: 14,
      color: rgb(1, 1, 1),
    });
    drawCentered(dStr, minBoxX, maxBoxX, 155.3, {
      size: 8.5,
      color: rgb(0.25, 0.3, 0.35),
    });

    // 8.2 Che dòng "BÁC SĨ ĐỌC KẾT QUẢ" in sẵn trên phôi cũ (tại Y ≈ 140.5) và vẽ lại căn giữa thẳng hàng
    pg.drawRectangle({
      x: 360,
      y: 135,
      width: 160,
      height: 16,
      color: rgb(1, 1, 1),
    });
    drawCentered('BÁC SĨ ĐỌC KẾT QUẢ', minBoxX, maxBoxX, 140.5, {
      bold: true,
      size: 9.2,
      color: rgb(0.08, 0.22, 0.42),
    });

    // 8.3 Bác sĩ đọc kết quả & Chữ ký số
    const drUsername =
      pageIndex === 1
        ? caseItem.bacSiDoc2Username || caseItem.bacSiDocUsername
        : caseItem.bacSiDocUsername;

    const drName =
      (pageIndex === 1
        ? caseItem.bacSiDoc2 || caseItem.bacSiDoc
        : caseItem.bacSiDoc) || 'BS CK1 PHẠM THẾ HÙNG';
    const isSigned = pageIndex === 1 ? !!(caseItem.daKy2 || caseItem.daKy) : !!caseItem.daKy;

    if (drName && drName !== 'Chưa phân loại') {
      // Che toàn bộ khối tên cũ trên phôi (từ Y=45 đến Y=78, X=335 đến X=555)
      pg.drawRectangle({
        x: 335,
        y: 45.0,
        width: 220,
        height: 33,
        color: rgb(1, 1, 1),
      });

      // Lấy thông tin chức danh & chữ ký của bác sĩ theo username trước
      let subTitle = caseItem.chucDanhDoc;
      let signatureUrl = caseItem.signatureUrl || caseItem.chuKy;

      if (this.usersService) {
        try {
          const docLookupKey = drUsername || drName;
          const docInfo = await this.usersService.getDoctorInfo(docLookupKey);
          if (docInfo) {
            if (!subTitle && docInfo.title) subTitle = docInfo.title;
            if (!signatureUrl && docInfo.signatureUrl) signatureUrl = docInfo.signatureUrl;
          }
        } catch (e) {}
      }

      if (!subTitle) {
        subTitle = '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)';
      }

      // 1. Vẽ Tên bác sĩ căn giữa 100% theo trục docCenterX
      drawCentered(drName, minBoxX, maxBoxX, 66.0, { bold: true, size: 9.5 });

      // 2. Vẽ Chức danh chuyên môn bác sĩ căn giữa 100% theo trục docCenterX
      drawCentered(subTitle, minBoxX, maxBoxX, 52.0, { size: 8.0, color: rgb(0.35, 0.35, 0.35) });

      // 3. Nếu đã ký duyệt, chèn ảnh chữ ký vào giữa dòng "BÁC SĨ ĐỌC KẾT QUẢ" (Y ≈ 140) và Tên BS (Y = 66)
      if (isSigned) {
        let sigBuffer: Buffer | null = null;
        if (signatureUrl) {
          try {
            sigBuffer = await this.minioService.getImageBuffer(signatureUrl);
          } catch (e) {}
        }

        // Fallback file cục bộ
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

            const sigX = docCenterX - targetW / 2;
            const sigY = 106.0 - targetH / 2; // Đặt tại tâm y = 106.0

            pg.drawImage(embeddedSig, {
              x: sigX,
              y: sigY,
              width: targetW,
              height: targetH,
            });
          } catch (e) {
            console.error('Lỗi nhúng ảnh chữ ký:', e);
          }
        }
      }
    }

    // Đóng con dấu đỏ công ty GenHD nếu đã được Admin xác nhận trả kết quả
    if (caseItem.trangThai === 'da_tra_ket_qua' || caseItem.status === 'diagnosed') {
      await this.drawOfficialStamp(pdfDoc, pg, docCenterX, 106);
    }

    // --- 9. Ảnh tiêu bản tế bào (nếu có) ---
    const cellImgSrc = caseItem.anhTeBao || caseItem.anhTieuBan;
    if (cellImgSrc) {
      try {
        const imgBuffer = await this.minioService.getImageBuffer(cellImgSrc);
        if (imgBuffer) {
          await this.drawFittedImage(pdfDoc, pg, imgBuffer, {
            x: 55,
            y: 45,
            width: 235,
            height: 135,
          });
        }
      } catch (e) {
        // bỏ qua nếu lỗi tải ảnh
      }
    }
  }

  /**
   * Xử lý đổ kết quả Mẫu 2: Medilab Hà Nội (ThinPrep)
   * Tọa độ căn chỉnh chuẩn xác 100% theo phôi Medilab 612x792
   */
  private async renderThinprepMedilab(
    pdfDoc: PDFDocument,
    caseItem: any,
    fontR: PDFFont,
    fontB: PDFFont,
    pageIndex = 0,
  ) {
    const pg = pdfDoc.getPages()[pageIndex];

    const textColor = rgb(0.08, 0.12, 0.2);
    const blueColor = rgb(0.05, 0.25, 0.6);

    const drawText = (
      x: number,
      y: number,
      text: string,
      opts: { bold?: boolean; size?: number; color?: any } = {},
    ) => {
      const { bold = false, size = 9, color = textColor } = opts;
      if (text) {
        pg.drawText(String(text), {
          x,
          y,
          size,
          font: bold ? fontB : fontR,
          color,
        });
      }
    };

    const drawCheck = (boxX: number, boxY: number, checked = false) => {
      if (!checked) return;
      pg.drawText('X', {
        x: boxX + 2.5,
        y: boxY + 3.2,
        size: 7.0,
        font: fontB,
        color: blueColor,
      });
    };

    const hasItem = (
      field: string,
      key: string,
      label?: string,
      keywords: string[] = [],
    ) => {
      const val = caseItem[field];
      if (!val) return false;
      if (typeof val === 'boolean') return val;
      if (Array.isArray(val)) {
        return val.some(
          (v: string) =>
            v === key ||
            (label && v === label) ||
            keywords.some((k) =>
              String(v).toLowerCase().includes(k.toLowerCase()),
            ),
        );
      }
      if (typeof val === 'string') {
        const lower = val.toLowerCase();
        if (lower.includes(key.toLowerCase())) return true;
        if (label && lower.includes(label.toLowerCase())) return true;
        return keywords.some((k) => lower.includes(k.toLowerCase()));
      }
      return false;
    };

    const isCheckedVal = (v: any) => {
      if (!v) return false;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        return s !== '' && s !== 'false' && s !== '0' && s !== 'null';
      }
      return false;
    };

    // 1. Hành chính bệnh nhân
    drawText(90, 642.0, (caseItem.hoTen || '').toUpperCase(), { bold: true, size: 9.5 });
    drawText(445, 639.8, String(caseItem.namSinh || ''), { bold: true, size: 9.0 });
    drawText(75, 623.8, caseItem.diaChi || '', { size: 8.5 });
    drawText(435, 622.3, caseItem.soDienThoai || '', { size: 9.0 });
    drawText(75, 606.2, caseItem.donVi || '', { size: 8.5 });
    drawText(415, 606.2, caseItem.maSo || caseItem.patientCode || '', { bold: true, size: 9.5, color: blueColor });
    drawText(95, 588.1, caseItem.chuanDoan || caseItem.chanDoan || caseItem.diagnosis || '', { size: 8.5 });

    // 2. Đánh giá tiêu bản
    const isDat = (caseItem.tinhChatBenhPham || 'dat') !== 'khong_dat' && caseItem.tinhChatBenhPham !== 'Không đạt';
    drawCheck(152.9, 568.8, isDat); // Đạt
    drawCheck(249.1, 569.2, !isDat); // Không đạt
    if (!isDat && caseItem.lyDoKhongDat) {
      drawText(365.0, 569.1, caseItem.lyDoKhongDat, { size: 8.5 });
    }

    // 3. Hệ thống Bethesda
    // 3.1 Âm tính với tổn thương nội biểu mô hoặc ác tính
    const isAmTinh =
      isCheckedVal(caseItem.khongTonThuong) ||
      hasItem('ketLuan', 'nilm') ||
      hasItem('ketLuan', 'âm tính') ||
      hasItem('ketLuan', 'không tổn thương');
    drawCheck(58.7, 530.7, isAmTinh);

    // 3.2 Không thấy tế bào u
    drawCheck(94.0, 513.0, isAmTinh);
    drawCheck(123.5, 494.1, hasItem('bienDoiKhac', 'khong_u') || isAmTinh);
    drawCheck(328.8, 494.6, hasItem('bienDoiKhac', 'sau_cat_tu_cung') || hasItem('bienDoiKhac', 'catTuCung'));

    const isBienDoiPhanUng =
      hasItem('bienDoiKhac', 'viem') ||
      hasItem('bienDoiKhac', 'teo') ||
      hasItem('bienDoiKhac', 'iud') ||
      hasItem('bienDoiKhac', 'xaTri');
    drawCheck(123.6, 476.4, isBienDoiPhanUng);

    // 3.3 Vi sinh vật
    const hasViSinh =
      hasItem('bienDoiViSinh', 'trichomonas') ||
      hasItem('bienDoiViSinh', 'candida') ||
      hasItem('bienDoiViSinh', 'actinomyces') ||
      hasItem('bienDoiViSinh', 'herpes') ||
      hasItem('bienDoiViSinh', 'gardnerella') ||
      hasItem('bienDoiViSinh', 'cytomegalo') ||
      hasItem('bienDoiViSinh', 'tapKhuan') ||
      hasItem('bienDoiViSinh', 'nam');
    drawCheck(92.7, 459.6, hasViSinh);
    drawCheck(94.7, 441.3, hasItem('bienDoiViSinh', 'trichomonas'));
    drawCheck(245.7, 440.5, hasItem('bienDoiViSinh', 'candida') || hasItem('bienDoiViSinh', 'nam'));
    drawCheck(387.8, 441.3, hasItem('bienDoiViSinh', 'actinomyces'));
    drawCheck(94.7, 422.2, hasItem('bienDoiViSinh', 'herpes'));
    drawCheck(245.7, 422.0, hasItem('bienDoiViSinh', 'gardnerella') || hasItem('bienDoiViSinh', 'tapKhuan'));
    drawCheck(387.8, 422.2, hasItem('bienDoiViSinh', 'cytomegalo'));

    // 3.4 Tế bào tuyến nội mạc
    drawCheck(59.4, 404.4, isCheckedVal(caseItem.teBaoNoiMac));

    // 3.5 Bất thường tế bào biểu mô
    const hasVay = !!caseItem.batThuongVay && caseItem.batThuongVay !== 'none' && caseItem.batThuongVay !== '';
    const hasTuyen = !!caseItem.batThuongTuyen && caseItem.batThuongTuyen !== 'none' && caseItem.batThuongTuyen !== '';
    drawCheck(59.4, 387.5, hasVay || hasTuyen);

    // Vảy
    drawCheck(88.6, 369.6, hasVay);
    drawCheck(93.0, 350.6, hasItem('batThuongVay', 'ascUs') || hasItem('batThuongVay', 'ascus'));
    drawCheck(93.0, 333.1, hasItem('batThuongVay', 'ascH') || hasItem('batThuongVay', 'asch'));
    drawCheck(93.0, 315.1, hasItem('batThuongVay', 'lsil'));
    drawCheck(92.3, 296.6, hasItem('batThuongVay', 'hsil'));
    drawCheck(93.0, 277.9, hasItem('batThuongVay', 'carcinomaVay') || hasItem('batThuongVay', 'carcinoma'));
    drawCheck(93.0, 257.8, hasItem('batThuongVay', 'chuaDinhLoai'));

    // Tuyến
    drawCheck(349.8, 369.3, hasTuyen);
    drawCheck(349.3, 351.1, hasItem('batThuongTuyen', 'agc') || hasItem('batThuongTuyen', 'agcNos'));
    drawCheck(349.3, 333.1, hasItem('batThuongTuyen', 'agcKCtc') || hasItem('batThuongTuyen', 'agcNeo'));
    drawCheck(349.3, 315.1, hasItem('batThuongTuyen', 'carcinomaTaiCho') || hasItem('batThuongTuyen', 'ais'));
    drawCheck(349.3, 297.1, hasItem('batThuongTuyen', 'carcinomaCtc') || hasItem('batThuongTuyen', 'tuyenKhac'));

    // 4. Kết luận & Khuyến nghị (Nâng Y lên ngang bằng với title in sẵn)
    const klTextMedilab =
      caseItem.ketLuan2 ||
      caseItem.ketLuan ||
      'KHÔNG THẤY TẾ BÀO BẤT THƯỜNG TRÊN PHIẾN ĐỒ';
    drawText(125, 245.8, klTextMedilab, { bold: true, size: 8.5, color: blueColor });
    const knTextAlt = (caseItem.khuyenNghi && caseItem.khuyenNghi.trim()) ? caseItem.khuyenNghi.trim() : 'Không có';
    drawText(145, 226.5, knTextAlt, { size: 8.5 });

    // 5. Ngày ký & Bác sĩ đọc
    const dStr = caseItem.ngayTraKetQua || caseItem.ngayDuKienTra || caseItem.createdAt;
    let day = '25', month = '09', year = '2026';
    if (dStr) {
      try {
        const parts = String(dStr).split('/');
        if (parts.length >= 3) {
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
          year = parts[2].trim();
        } else if (parts.length === 2) {
          day = parts[0].padStart(2, '0');
          month = parts[1].padStart(2, '0');
        } else {
          const dObj = new Date(dStr);
          if (!isNaN(dObj.getTime())) {
            day = String(dObj.getDate()).padStart(2, '0');
            month = String(dObj.getMonth() + 1).padStart(2, '0');
            year = String(dObj.getFullYear());
          }
        }
      } catch (e) {}
    }

    // Nhúng font Times Bold Italic (hoặc Arial nghiêng) để dòng ngày tháng đẹp và to đồng bộ 100%
    let fontDate = fontR;
    const fontTimesBiPath = path.join(process.cwd(), 'templates', 'fonts', 'timesbi.ttf');
    const fontItalicPath = path.join(process.cwd(), 'templates', 'fonts', 'ariali.ttf');
    if (fs.existsSync(fontTimesBiPath)) {
      try {
        fontDate = await pdfDoc.embedFont(fs.readFileSync(fontTimesBiPath), { subset: true });
      } catch (e) {}
    } else if (fs.existsSync(fontItalicPath)) {
      try {
        fontDate = await pdfDoc.embedFont(fs.readFileSync(fontItalicPath), { subset: true });
      } catch (e) {}
    }

    // Che dòng ngày tháng cũ và vẽ lại toàn bộ dòng ngày tháng to đồng bộ, cùng dòng
    pg.drawRectangle({
      x: 390,
      y: 194,
      width: 165,
      height: 18,
      color: rgb(1, 1, 1),
    });
    const medilabNavy = rgb(0, 31 / 255, 95 / 255);
    const fullDate = `Ngày ${day} tháng ${month} năm ${year}`;
    const dateW = fontDate.widthOfTextAtSize(fullDate, 11.5);
    // Trục giữa của tiêu đề "Bác sĩ đọc kết quả" trên phôi là X = 479
    const dateX = 479 - dateW / 2;
    pg.drawText(fullDate, { x: dateX, y: 198.5, size: 11.5, font: fontDate, color: medilabNavy });

    if (caseItem.daKy) {
      const docUsername = caseItem.bacSiDocUsername;
      const docName = caseItem.bacSiDoc || caseItem.doctorName || 'BS CK1 PHẠM THẾ HÙNG';
      const docLookupKey = docUsername || docName;

      // Dịch tên bác sĩ căn giữa chính xác với trục của "Bác sĩ đọc kết quả" (X = 479)
      const docW = fontB.widthOfTextAtSize(docName, 9.5);
      const docX = 479 - docW / 2;
      drawText(docX, 95, docName, { bold: true, size: 9.5 });

      // Lấy chức danh chuyên môn và chữ ký số từ tài khoản bác sĩ
      let subTitle = caseItem.chucDanhDoc;
      let signatureUrl = caseItem.signatureUrl || caseItem.chuKy;

      if (this.usersService) {
        try {
          const docInfo = await this.usersService.getDoctorInfo(docLookupKey);
          if (docInfo) {
            if (!subTitle && docInfo.title) subTitle = docInfo.title;
            if (!signatureUrl && docInfo.signatureUrl) signatureUrl = docInfo.signatureUrl;
          }
        } catch (e) {}
      }

      if (!subTitle) {
        subTitle = '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)';
      }

      // Dòng phụ chú chuyên khoa căn giữa chính xác cùng trục X = 479
      const subW = fontR.widthOfTextAtSize(subTitle, 8.0);
      const subX = 479 - subW / 2;
      drawText(subX, 83, subTitle, { size: 8.0, color: rgb(0.35, 0.35, 0.35) });

      // Vẽ ảnh chữ ký số bác sĩ ra khoảng trống giữa dòng "Bác sĩ đọc kết quả" và "Tên bác sĩ"
      // Khoảng cách trên dưới: từ đáy tiêu đề (182.5) đến đỉnh tên (104.5) = 78pt
      // Chiều cao ảnh = 2/3 khoảng cách = 52pt
      // Tâm dọc = 143.5, tâm ngang = 479 (căn giữa hoàn hảo cả 2 chiều)
      let sigBuffer: Buffer | null = null;
      if (signatureUrl) {
        try {
          sigBuffer = await this.minioService.getImageBuffer(signatureUrl);
        } catch (e) {}
      }

      // Fallback kiểm tra file cục bộ nếu chưa có trên MinIO
      if (!sigBuffer) {
        const slug = docName.toLowerCase();
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
            try {
              embeddedSig = await pdfDoc.embedPng(sigBuffer);
            } catch (e1) {
              embeddedSig = await pdfDoc.embedJpg(sigBuffer);
            }
          } else {
            try {
              embeddedSig = await pdfDoc.embedJpg(sigBuffer);
            } catch (e2) {
              embeddedSig = await pdfDoc.embedPng(sigBuffer);
            }
          }

          if (embeddedSig && embeddedSig.width && embeddedSig.height) {
            const targetH = 52; // Chiều cao bằng 2/3 khoảng cách
            // Chiều dài phụ thuộc độ dài ảnh mặc định (giữ nguyên tỷ lệ ảnh)
            let targetW = (embeddedSig.width / embeddedSig.height) * targetH;
            if (targetW > 145) {
              targetW = 145; // Giới hạn tối đa để không lấn sang tiêu bản tế bào
            }
            // Căn giữa ngang theo trục 479 và căn giữa dọc theo tâm 143.5
            const sigX = 479 - targetW / 2;
            const sigY = 143.5 - targetH / 2;

            pg.drawImage(embeddedSig, {
              x: sigX,
              y: sigY,
              width: targetW,
              height: targetH,
            });
          }
        } catch (err) {
          console.error('[CellPdfService] Lỗi khi nhúng ảnh chữ ký:', err);
        }
      }
    }

    // Đóng con dấu đỏ công ty GenHD nếu đã được Admin xác nhận trả kết quả
    if (caseItem.trangThai === 'da_tra_ket_qua' || caseItem.status === 'diagnosed') {
      await this.drawOfficialStamp(pdfDoc, pg, 479, 143);
    }

    // 6. Ảnh tiêu bản tế bào (Dịch lên Y=65 để không che dòng chữ chân trang, giữ nguyên tỷ lệ và chiều cao)
    const cellImgSrc = caseItem.anhTeBao || caseItem.anhTieuBan;
    if (cellImgSrc) {
      try {
        const imgBuffer = await this.minioService.getImageBuffer(cellImgSrc);
        if (imgBuffer) {
          await this.drawFittedImage(pdfDoc, pg, imgBuffer, {
            x: 55,
            y: 65,
            width: 230,
            height: 120,
          });
        }
      } catch (e) {}
    }
  }
}
