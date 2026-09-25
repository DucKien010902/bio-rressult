const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

async function testSoiTuoi() {
  const templatePath = path.join(__dirname, '../templates/sample_soituoi.pdf');
  const pdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const fontRegularBytes = fs.readFileSync(path.join(__dirname, '../templates/fonts/arial.ttf'));
  const fontBoldBytes = fs.readFileSync(path.join(__dirname, '../templates/fonts/arialbd.ttf'));
  const fontR = await pdfDoc.embedFont(fontRegularBytes);
  const fontB = await pdfDoc.embedFont(fontBoldBytes);

  const pg = pdfDoc.getPages()[0];

  // Dữ liệu mô phỏng ảnh 3, 4 của người dùng
  const caseItem = {
    maSo: 'GTHD-ST238',
    hoTen: 'PHAN THỊ TƠ',
    namSinh: 1959,
    gioiTinh: 'Nữ',
    diaChi: '',
    soDienThoai: '',
    bacSiChiDinh: '',
    donVi: '1',
    chanDoanLamSang: '',
    nhanXetDaiThe: '',
    ngayNhanMau: '2026-08-15',
    ngayTraKetQua: '2026-08-17',
    soiTuoiBachCau: '++',
    soiTuoiNam: '-',
    soiTuoiTapKhuan: '++',
    soiTuoiTeBaoBieuMo: '++',
    soiTuoiTrichomonas: '-',
    ketLuan: 'BÌNH THƯỜNG',
    bacSiDoc: 'BS CK1 PHẠM THẾ HÙNG',
  };

  const textColor = rgb(0.1, 0.15, 0.2);
  const blueColor = rgb(0.05, 0.25, 0.45);

  const drawText = (text, x, y, opt = {}) => {
    if (!text && text !== 0) return;
    const font = opt.bold ? fontB : fontR;
    const size = opt.size || 9.0;
    const color = opt.color || textColor;
    pg.drawText(String(text), { x, y, size, font, color });
  };

  const drawCentered = (text, minX, maxX, y, opt = {}) => {
    if (!text && text !== 0) return;
    const font = opt.bold ? fontB : fontR;
    const size = opt.size || 9.0;
    const color = opt.color || textColor;
    const textWidth = font.widthOfTextAtSize(String(text), size);
    const x = minX + (maxX - minX - textWidth) / 2;
    pg.drawText(String(text), { x, y, size, font, color });
  };

  const drawWrappedText = (text, x, y, maxWidth, lineHeight, opt = {}) => {
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

  const fmtDate = (v) => {
    if (!v) {
      const n = new Date();
      return `${String(n.getDate()).padStart(2, '0')}/${String(n.getMonth() + 1).padStart(2, '0')}/${n.getFullYear()}`;
    }
    if (typeof v === 'string' && v.includes('/')) return v;
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // --- 1. THÔNG TIN HÀNH CHÍNH BỆNH NHÂN ---
  const X_LEFT = 140.0;
  const X_RIGHT = 399.5;

  drawText(caseItem.maSo, X_LEFT, 710.8, { bold: true, size: 9.0 });
  drawText((caseItem.hoTen || '').toUpperCase(), X_RIGHT, 710.8, { bold: true, size: 9.0 });

  drawText(String(caseItem.namSinh || ''), X_LEFT, 691.9, { size: 9.0 });
  drawText(caseItem.gioiTinh || 'Nữ', X_RIGHT, 691.9, { size: 9.0 });

  drawText(caseItem.diaChi || '', X_LEFT, 672.9, { size: 8.5 });

  drawText(caseItem.soDienThoai || '', X_LEFT, 654.2, { size: 9.0 });
  drawText(caseItem.bacSiChiDinh || '', X_RIGHT, 654.2, { size: 9.0 });

  drawText(caseItem.donVi || '', X_LEFT, 635.2, { size: 9.0 });

  drawText(caseItem.chanDoanLamSang || '', X_LEFT, 616.3, { size: 9.0 });

  drawText(caseItem.nhanXetDaiThe || caseItem.daiThe || '', X_LEFT, 599.2, { size: 9.0 });

  const tNhan = fmtDate(caseItem.ngayNhanMau);
  const tKq = fmtDate(caseItem.ngayTraKetQua);
  drawText(tNhan, X_LEFT, 581.0, { size: 9.0 });
  drawText(tKq, X_RIGHT, 581.0, { size: 9.0 });

  // --- 2. BẢNG KẾT QUẢ SOI TƯƠI (5 CHỈ TIÊU) ---
  // Cột KẾT QUẢ: minX = 206.0, maxX = 297.5 (giữa = 251.75)
  // Cột GHI CHÚ: minX = 489.5, maxX = 560.6 (giữa = 525.0)
  const soiItems = [
    { y: 454.2, val: caseItem.soiTuoiBachCau, note: caseItem.soiTuoiGhiChuBachCau },
    { y: 416.5, val: caseItem.soiTuoiNam, note: caseItem.soiTuoiGhiChuNam },
    { y: 378.6, val: caseItem.soiTuoiTapKhuan, note: caseItem.soiTuoiGhiChuTapKhuan },
    { y: 340.7, val: caseItem.soiTuoiTeBaoBieuMo, note: caseItem.soiTuoiGhiChuTeBaoBieuMo },
    { y: 301.1, val: caseItem.soiTuoiTrichomonas, note: caseItem.soiTuoiGhiChuTrichomonas },
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

  // --- 3. KẾT LUẬN ---
  // Khung KẾT LUẬN tại x = 34.8, y = 210, w = 527.04, h = 48
  // Tiêu đề KẾT LUẬN: tại x = 44.9, y = 239.6
  // Chữ kết luận bắt đầu từ x = 125.0, y = 239.6
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

  // Che dòng dấu chấm mẫu "Hà Nội, ngày ..... tháng ..... năm 202..." tại Y = 175.5
  pg.drawRectangle({
    x: 345,
    y: 171,
    width: 185,
    height: 12,
    color: rgb(1, 1, 1),
  });
  drawCentered(dStr, 345, 530, 175.5, { size: 8.5, color: rgb(0.25, 0.3, 0.35) });

  // Bác sĩ đọc kết quả: Mẫu đã in sẵn "BS CK1 PHẠM THẾ HÙNG" tại y = 85.9
  const drName = caseItem.bacSiDoc || 'BS CK1 PHẠM THẾ HÙNG';
  if (drName && !drName.toUpperCase().includes('PHẠM THẾ HÙNG') && drName !== 'Chưa phân loại') {
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

  const outBytes = await pdfDoc.save();
  const outPath = path.join(__dirname, 'test_soituoi_out.pdf');
  fs.writeFileSync(outPath, outBytes);
  console.log(`Saved test PDF to ${outPath}`);
}

testSoiTuoi().catch(console.error);
