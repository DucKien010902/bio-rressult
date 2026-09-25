import { Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import { BasePdfService } from './base-pdf.service.js';

@Injectable()
export class CellPdfService extends BasePdfService {
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
  ) {
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

    // Helper căn giữa chữ trong khoảng [minX, maxX]
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
      const textWidth = font.widthOfTextAtSize(String(text), size);
      const x = minX + (maxX - minX - textWidth) / 2;
      pg.drawText(String(text), { x, y, size, font, color });
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

    // --- 1. Header Hành chính (Cột trái X=137.5, Cột phải X=399.5) ---
    const X_LEFT = 137.5;
    const X_RIGHT = 399.5;

    drawCellText(X_LEFT, 712.8, caseItem.maSo || '', { bold: true, size: 9.5 });
    drawCellText(
      X_RIGHT,
      712.8,
      (caseItem.hoTen || '').toUpperCase(),
      { bold: true, size: 9.5 },
    );

    drawCellText(X_LEFT, 694.0, String(caseItem.namSinh || ''), { size: 9.0 });
    drawCellText(X_RIGHT, 694.0, caseItem.gioiTinh || 'Nữ', { size: 9.0 });

    drawCellText(X_LEFT, 675.1, caseItem.diaChi || '', { size: 8.5 });

    drawCellText(X_LEFT, 656.4, caseItem.soDienThoai || '', { size: 9.0 });
    drawCellText(X_RIGHT, 656.4, caseItem.bacSiChiDinh || '', { size: 9.0 });

    drawCellText(X_LEFT, 635.5, caseItem.donVi || '', { size: 9.0 });

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
      ) &&
        !hasItem('batThuongVay', 'lsilHpv', '', ['+ hpv', '+hpv', 'lsilhpv']),
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
      hasItem('batThuongTuyen', 'agc', 'Tế bào tuyến không điển hình (AGC)') &&
        !hasItem('batThuongTuyen', 'agcKdh', '', ['không đặc hiệu']) &&
        !hasItem('batThuongTuyen', 'agcKCtc', '', ['ctc']) &&
        !hasItem('batThuongTuyen', 'agcKTuyen', '', ['hướng về k tuyến']),
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
    drawCellText(115, 222.3, klText.toUpperCase(), {
      bold: true,
      size: 8.5,
      color: blueColor,
    });

    if (caseItem.khuyenNghi) {
      drawCellText(125, 204.6, caseItem.khuyenNghi, {
        size: 8.5,
        color: textColor,
      });
    }

    // --- 8. NGÀY KÝ & BÁC SĨ ĐỌC KẾT QUẢ ---
    let dStr = 'Hà Nội, ngày ..... tháng ..... năm 202...';
    if (tKq && tKq.includes('/')) {
      const parts = tKq.split('/');
      if (parts.length === 3) {
        dStr = `Hà Nội, ngày ${parts[0]} tháng ${parts[1]} năm ${parts[2]}`;
      }
    }
    // Che dòng chữ chấm "Hà Nội, ngày ..... tháng ..... năm 202..." tại Y = 155.3
    pg.drawRectangle({
      x: 350,
      y: 150,
      width: 175,
      height: 12,
      color: rgb(1, 1, 1),
    });
    drawCentered(dStr, 350, 520, 155.3, { size: 8.5, color: rgb(0.25, 0.3, 0.35) });

    // Bác sĩ đọc kết quả (in đè nếu khác tên mặc định "BS CK1 PHẠM THẾ HÙNG")
    const drName = pageIndex === 1 ? caseItem.bacSiDoc2 : caseItem.bacSiDoc;
    if (drName && drName !== 'BS CK1 PHẠM THẾ HÙNG' && drName !== 'Chưa phân loại') {
      pg.drawRectangle({
        x: 340,
        y: 58,
        width: 200,
        height: 16,
        color: rgb(1, 1, 1),
      });
      drawCentered(drName, 340, 540, 66.0, { bold: true, size: 9.5 });
    }

    // --- 9. Ảnh tế bào (nếu có) ---
    if (
      caseItem.anhTeBao &&
      typeof caseItem.anhTeBao === 'string' &&
      caseItem.anhTeBao.startsWith('data:image')
    ) {
      try {
        const base64Data = caseItem.anhTeBao.split(',')[1];
        if (base64Data) {
          const imgBuffer = Buffer.from(base64Data, 'base64');
          let embeddedImg: any;
          if (
            caseItem.anhTeBao.includes('jpeg') ||
            caseItem.anhTeBao.includes('jpg')
          ) {
            embeddedImg = await pdfDoc.embedJpg(imgBuffer);
          } else {
            embeddedImg = await pdfDoc.embedPng(imgBuffer);
          }
          if (embeddedImg) {
            pg.drawImage(embeddedImg, {
              x: 60,
              y: 60,
              width: 220,
              height: 100,
            });
          }
        }
      } catch (e) {
        // ignore image error
      }
    }
  }
}
