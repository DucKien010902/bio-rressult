import { Injectable } from '@nestjs/common';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import { BasePdfService } from './base-pdf.service.js';

@Injectable()
export class CellPdfService extends BasePdfService {
  /**
   * Xử lý vẽ kết quả Tế bào học (Cell & ThinPrep)
   * Tọa độ bóc tách & căn chỉnh chuẩn 100% khớp với mẫu thật GenHD
   */
  async generatePdf(
    pdfDoc: PDFDocument,
    caseItem: any,
    fontR: PDFFont,
    fontB: PDFFont,
    pageIndex = 0,
  ) {
    const pg = pdfDoc.getPages()[pageIndex];

    // Helper vẽ chữ trực tiếp lên phôi mẫu sạch (không che khuất đường kẻ khung)
    const drawCellText = (
      x: number,
      y: number,
      text: string,
      opts: { bold?: boolean; size?: number; color?: any } = {},
    ) => {
      const { bold = false, size = 9, color = rgb(0.05, 0.05, 0.05) } = opts;
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

    // Helper đánh dấu X vào ô vuông checkbox
    const drawCheckMark = (x: number, y: number, checked = false) => {
      if (checked) {
        pg.drawText('X', {
          x: x + 1.5,
          y: y + 1.5,
          size: 7.5,
          font: fontB,
          color: rgb(0.05, 0.05, 0.05),
        });
      }
    };

    // --- Header Hành chính (Chuẩn baseline Y = 707, 689, 671, 653, 635, 617, 599, 581) ---
    drawCellText(125, 707, caseItem.maSo || '', { bold: true, size: 9.5 });
    drawCellText(365, 707, (caseItem.hoTen || '').toUpperCase(), {
      bold: true,
      size: 9.5,
    });
    drawCellText(125, 689, String(caseItem.namSinh || ''), { size: 9 });
    drawCellText(365, 689, caseItem.gioiTinh || 'Nữ', { size: 9 });
    drawCellText(125, 671, caseItem.diaChi || '', { size: 8.5 });
    drawCellText(125, 653, caseItem.soDienThoai || '', { size: 9 });
    drawCellText(385, 653, caseItem.bacSiChiDinh || '', { size: 9 });
    drawCellText(130, 635, caseItem.donVi || '', { size: 9 });
    drawCellText(125, 617, caseItem.loaiMau || 'Dịch phết tế bào', { size: 9 });

    // Checkbox Đánh giá tiêu bản (Đạt / Không đạt) tại Y = 599
    const isDat = caseItem.tinhChatBenhPham !== 'khong_dat';
    drawCheckMark(153, 599, isDat);
    drawCheckMark(203, 599, !isDat);
    if (!isDat && caseItem.lyDoKhongDat) {
      drawCellText(330, 599, caseItem.lyDoKhongDat, { size: 8.5 });
    }

    drawCellText(
      140,
      581,
      this.fmtDate(caseItem.ngayNhanMau || caseItem.createdAt),
      { size: 9 },
    );
    const tKq = this.fmtDate(
      caseItem.ngayTraKetQua || caseItem.ngayDuKienTra,
    );
    drawCellText(400, 581, tKq, { size: 9 });

    // --- Section 2: HỆ THỐNG BETHESDA (3 Checkbox tại Y = 534) ---
    drawCheckMark(43, 534, !!caseItem.khongTonThuong);
    drawCheckMark(273, 534, !!caseItem.batThuongKhac);
    drawCheckMark(388, 534, !!caseItem.teBaoNoiMac);

    // --- Section 3: BIẾN ĐỔI TẾ BÀO DO VI SINH (Cột trái X=43) & KHÁC (Cột phải X=304) ---
    const viSinh = Array.isArray(caseItem.bienDoiViSinh)
      ? caseItem.bienDoiViSinh
      : typeof caseItem.bienDoiViSinh === 'string'
      ? caseItem.bienDoiViSinh.split(',')
      : [];
    const viSinhChecked = (k: string) => viSinh.includes(k);

    drawCheckMark(43, 484, viSinhChecked('trichomonas'));
    drawCheckMark(43, 469, viSinhChecked('candida'));
    drawCheckMark(43, 454, viSinhChecked('actinomyces'));
    drawCheckMark(43, 439, viSinhChecked('gardnerella'));
    drawCheckMark(43, 424, viSinhChecked('hpv'));
    drawCheckMark(43, 409, viSinhChecked('tapKhuan'));

    const bdKhac = Array.isArray(caseItem.bienDoiKhac)
      ? caseItem.bienDoiKhac
      : typeof caseItem.bienDoiKhac === 'string'
      ? caseItem.bienDoiKhac.split(',')
      : [];
    const bdKhacChecked = (k: string) => bdKhac.includes(k);

    drawCheckMark(304, 484, bdKhacChecked('viem'));
    drawCheckMark(304, 469, bdKhacChecked('xaTri'));
    drawCheckMark(304, 454, bdKhacChecked('iud'));
    drawCheckMark(304, 439, bdKhacChecked('teo'));

    // --- Section 4: BẤT THƯỜNG TẾ BÀO BIỂU MÔ (VẢY X=43 & TUYẾN X=304) ---
    const btVay = Array.isArray(caseItem.batThuongVay)
      ? caseItem.batThuongVay
      : typeof caseItem.batThuongVay === 'string'
      ? caseItem.batThuongVay.split(',')
      : [];
    const btVayChecked = (k: string) => btVay.includes(k);

    drawCheckMark(43, 343, btVayChecked('ascUs'));
    drawCheckMark(43, 329, btVayChecked('ascH'));
    drawCheckMark(43, 315, btVayChecked('lsil'));
    drawCheckMark(43, 301, btVayChecked('lsilHpv'));
    drawCheckMark(43, 287, btVayChecked('hsil'));
    drawCheckMark(43, 273, btVayChecked('carcinomaVay'));

    const btTuyen = Array.isArray(caseItem.batThuongTuyen)
      ? caseItem.batThuongTuyen
      : typeof caseItem.batThuongTuyen === 'string'
      ? caseItem.batThuongTuyen.split(',')
      : [];
    const btTuyenChecked = (k: string) => btTuyen.includes(k);

    drawCheckMark(304, 343, btTuyenChecked('agc'));
    drawCheckMark(304, 329, btTuyenChecked('agcKdh'));
    drawCheckMark(304, 315, btTuyenChecked('agcKCtc'));
    drawCheckMark(304, 301, btTuyenChecked('agcKTuyen'));
    drawCheckMark(304, 287, btTuyenChecked('carcinomaTaiCho'));
    drawCheckMark(304, 273, btTuyenChecked('carcinomaCtc'));
    drawCheckMark(304, 259, btTuyenChecked('carcinomaNoiMac'));
    drawCheckMark(304, 245, btTuyenChecked('carcinomaKdh'));

    // --- Section 5: KẾT LUẬN & CHỮ KÝ ---
    const klText =
      caseItem.ketLuan2 ||
      caseItem.ketLuan ||
      'PHIẾN ĐỒ BÌNH THƯỜNG TRONG GIỚI HẠN SINH LÝ.';
    drawCellText(125, 207, klText.toUpperCase(), {
      bold: true,
      size: 8.5,
      color: rgb(0, 0.2, 0.6),
    });

    // --- Section 6: Xử lý Tải Ảnh Tế Bào (nếu có) ---
    if (caseItem.anhTeBao && typeof caseItem.anhTeBao === 'string' && caseItem.anhTeBao.startsWith('data:image')) {
      try {
        const base64Data = caseItem.anhTeBao.split(',')[1];
        if (base64Data) {
          const imgBuffer = Buffer.from(base64Data, 'base64');
          let embeddedImg: any;
          if (caseItem.anhTeBao.includes('jpeg') || caseItem.anhTeBao.includes('jpg')) {
            embeddedImg = await pdfDoc.embedJpg(imgBuffer);
          } else {
            embeddedImg = await pdfDoc.embedPng(imgBuffer);
          }
          pg.drawImage(embeddedImg, {
            x: 80,
            y: 25,
            width: 240,
            height: 90,
          });
        }
      } catch (e) {
        // Silently fallback if image parse fails
      }
    } else {
      // Nếu không có ảnh tế bào, tẩy trắng vùng góc trái dưới để không hiện ảnh cũ
      pg.drawRectangle({
        x: 70,
        y: 15,
        width: 260,
        height: 100,
        color: rgb(1, 1, 1),
      });
    }

    const [dd, mm, yy] = tKq.split('/');
    drawCellText(
      351,
      151,
      `Hà Nội, ngày ${dd || '01'} tháng ${mm || '01'} năm ${yy || '2026'}`,
      { size: 8.5 },
    );

    const drName = pageIndex === 1 ? caseItem.bacSiDoc2 : caseItem.bacSiDoc;
    const dr =
      drName && drName !== 'Chưa phân loại'
        ? drName
        : 'BS CK1 PHẠM THẾ HÙNG';
    drawCellText(360, 29, dr, { bold: true, size: 9.5 });
    drawCellText(340, 15, '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)', {
      size: 8,
      color: rgb(0.35, 0.35, 0.35),
    });
  }
}
