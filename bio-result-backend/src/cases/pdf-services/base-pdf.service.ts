import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFFont, rgb } from 'pdf-lib';

@Injectable()
export class BasePdfService {
  /**
   * Đóng con dấu đỏ công ty GenHD lên vùng chữ ký bác sĩ
   * Chỉ thực hiện khi ca đã được Admin xác nhận trả kết quả (trangThai === 'da_tra_ket_qua')
   * @param pdfDoc Đối tượng PDFDocument
   * @param pg Trang PDF cần vẽ
   * @param centerX Trục ngang trung tâm của khối chữ ký
   * @param centerY Trục dọc trung tâm của khối chữ ký
   * @param size Đường kính con dấu (mặc định 92pt)
   */
  async drawOfficialStamp(
    pdfDoc: any,
    pg: any,
    centerX: number,
    centerY: number,
    size = 175,
  ): Promise<boolean> {
    try {
      const stampPath = path.join(process.cwd(), 'templates', 'con_dau_genhd.png');
      if (!fs.existsSync(stampPath)) {
        return false;
      }
      const buf = fs.readFileSync(stampPath);
      const embeddedStamp = await pdfDoc.embedPng(buf);

      // Con dấu to hơn (size=175), mép phải đặt sát 592pt để dịch tối đa sang phải
      let stampX = centerX + 10;
      if (stampX + size > 592) {
        stampX = 592 - size;
      }

      // Hạ trục Y xuống dưới một chút
      let stampY = centerY - size / 2 - 12;
      if (stampY < 8) {
        stampY = 8;
      }

      pg.drawImage(embeddedStamp, {
        x: stampX,
        y: stampY,
        width: size,
        height: size,
        opacity: 0.88,
      });
      return true;
    } catch (e) {
      console.error('[drawOfficialStamp] Lỗi đóng dấu:', e);
      return false;
    }
  }
  /**
   * Phủ lớp nền trắng (Whiteout) rồi ghi chữ lên trên
   */
  mw(
    pg: any,
    x: number,
    y: number,
    text: string,
    fontR: PDFFont,
    fontB: PDFFont,
    opts: {
      bold?: boolean;
      size?: number;
      w?: number;
      h?: number;
      ox?: number;
      oy?: number;
      color?: any;
    } = {},
  ) {
    const {
      bold = false,
      size = 9,
      w = 160,
      h = 14,
      ox = -2,
      oy = -3,
      color = rgb(0.05, 0.05, 0.05),
    } = opts;
    pg.drawRectangle({
      x: x + ox,
      y: y + oy,
      width: w,
      height: h,
      color: rgb(1, 1, 1),
    });
    if (text) {
      pg.drawText(String(text), {
        x,
        y,
        size,
        font: bold ? fontB : fontR,
        color,
      });
    }
  }

  /**
   * Tẩy trắng ruột ô vuông 9x9 và đánh dấu X nếu checked = true
   */
  drawBoxCheck(pg: any, x: number, y: number, fontB: PDFFont, checked = false) {
    pg.drawRectangle({
      x: x + 1,
      y: y + 1,
      width: 7,
      height: 7,
      color: rgb(1, 1, 1),
    });
    if (checked) {
      pg.drawText('X', {
        x: x + 1.5,
        y: y + 1.5,
        size: 7.5,
        font: fontB,
        color: rgb(0.05, 0.05, 0.05),
      });
    }
  }

  /**
   * Định dạng ngày tháng DD/MM/YYYY
   */
  fmtDate(v?: string): string {
    if (!v) {
      const n = new Date();
      return `${String(n.getDate()).padStart(2, '0')}/${String(n.getMonth() + 1).padStart(2, '0')}/${n.getFullYear()}`;
    }
    if (typeof v === 'string' && v.includes('/')) return v;
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  /**
   * Vẽ dòng Ngày tháng ký và Tên Bác sĩ chẩn đoán
   */
  drawDateAndDoctor(
    pg: any,
    tKq: string,
    drName: string,
    fontR: PDFFont,
    fontB: PDFFont,
    xDate = 351,
    yDate = 151,
    xDr = 360,
    yDr = 29,
  ) {
    const [dd, mm, yy] = tKq.split('/');
    this.mw(
      pg,
      xDate,
      yDate,
      `Hà Nội, ngày ${dd || '01'} tháng ${mm || '01'} năm ${yy || '2026'}`,
      fontR,
      fontB,
      { size: 8.5, w: 220, h: 14, ox: -2, oy: -2 },
    );
    const dr = drName && drName !== 'Chưa phân loại' ? drName : 'TS. BS Nguyễn Thế Lãnh';
    this.mw(pg, xDr, yDr, dr, fontR, fontB, {
      bold: true,
      size: 9.5,
      w: 220,
      h: 16,
      ox: -5,
      oy: -3,
    });
  }

  /**
   * Nhúng và vẽ ảnh vào bounding box theo đúng tỷ lệ gốc (không bóp méo, co dãn), căn giữa ô
   * @param pdfDoc Đối tượng PDFDocument
   * @param pg Trang PDF cần vẽ
   * @param imgBuffer Buffer dữ liệu ảnh (JPG / PNG)
   * @param box Bounding box { x, y, width, height }
   */
  async drawFittedImage(
    pdfDoc: any,
    pg: any,
    imgBuffer: Buffer,
    box: { x: number; y: number; width: number; height: number },
  ): Promise<boolean> {
    if (!imgBuffer || imgBuffer.length === 0) return false;

    let embeddedImg: any;
    // Kiểm tra định dạng ảnh qua magic bytes
    const isPng =
      imgBuffer.length > 4 &&
      imgBuffer[0] === 0x89 &&
      imgBuffer[1] === 0x50 &&
      imgBuffer[2] === 0x4e &&
      imgBuffer[3] === 0x47;

    try {
      if (isPng) {
        embeddedImg = await pdfDoc.embedPng(imgBuffer);
      } else {
        embeddedImg = await pdfDoc.embedJpg(imgBuffer);
      }
    } catch (e1) {
      // Thử định dạng ngược lại nếu header/đuôi file bị nhầm lẫn
      try {
        if (isPng) {
          embeddedImg = await pdfDoc.embedJpg(imgBuffer);
        } else {
          embeddedImg = await pdfDoc.embedPng(imgBuffer);
        }
      } catch (e2) {
        return false;
      }
    }

    if (!embeddedImg) return false;

    const imgW = embeddedImg.width;
    const imgH = embeddedImg.height;
    if (!imgW || !imgH) return false;

    // Giữ nguyên 100% tỷ lệ ảnh gốc (không bóp méo)
    const scale = Math.min(box.width / imgW, box.height / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    // Căn giữa trong bounding box
    const drawX = box.x + (box.width - drawW) / 2;
    const drawY = box.y + (box.height - drawH) / 2;

    pg.drawImage(embeddedImg, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });

    return true;
  }
}
