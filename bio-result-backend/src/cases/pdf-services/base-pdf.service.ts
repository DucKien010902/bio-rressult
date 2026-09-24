import { Injectable } from '@nestjs/common';
import { PDFFont, rgb } from 'pdf-lib';

@Injectable()
export class BasePdfService {
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
}
