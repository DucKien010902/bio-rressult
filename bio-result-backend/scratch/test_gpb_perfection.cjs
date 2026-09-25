const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

async function testGpb() {
  const templatePath = path.join(__dirname, '../templates/sample_giaiphaubenh.pdf');
  const pdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const fontRegularBytes = fs.readFileSync(path.join(__dirname, '../templates/fonts/arial.ttf'));
  const fontBoldBytes = fs.readFileSync(path.join(__dirname, '../templates/fonts/arialbd.ttf'));
  const fontR = await pdfDoc.embedFont(fontRegularBytes);
  const fontB = await pdfDoc.embedFont(fontBoldBytes);

  const pg = pdfDoc.getPages()[0];

  // Dữ liệu mô phỏng giống hệt ảnh 3 của người dùng
  const caseItem = {
    maSo: 'GTHD-GPB001',
    hoTen: 'NGUYỄN THỊ HOA',
    namSinh: 1964,
    gioiTinh: 'Nữ',
    diaChi: 'Gia Bình - Bắc Ninh',
    soDienThoai: '',
    bacSiChiDinh: '',
    donVi: 'PK Thiên Đức',
    chanDoanLamSang: 'Tổn thương thực quản',
    viTriBenhPham: 'Thực quản',
    ngayNhanMau: '2026-09-21',
    ngayTraKetQua: '2026-09-23',
    daiThe: '01 sinh thiết',
    viThe: 'Hình ảnh vi thể là niêm mạc thực quản có u tạo bởi các cấu trúc nhú phủ biểu mô vảy nhân nhỏ, đều, bào tương rộng. Không thấy loạn sản hay ác tính.',
    ketLuan: 'U nhú biểu mô vảy lành tính.',
    bacSiDoc: 'TS.BS Nguyễn Sỹ Lánh',
    chucDanhDoc: 'Trưởng khoa Giải phẫu bệnh BV Việt Đức',
  };

  const textColor = rgb(0.1, 0.15, 0.2);
  const blueColor = rgb(0.05, 0.25, 0.45);

  const drawText = (text, x, y, opt = {}) => {
    if (!text) return;
    const font = opt.bold ? fontB : fontR;
    const size = opt.size || 9.0;
    const color = opt.color || textColor;
    pg.drawText(String(text), { x, y, size, font, color });
  };

  const drawCentered = (text, minX, maxX, y, opt = {}) => {
    if (!text) return;
    const font = opt.bold ? fontB : fontR;
    const size = opt.size || 9.0;
    const color = opt.color || textColor;
    const textWidth = font.widthOfTextAtSize(String(text), size);
    const x = minX + (maxX - minX - textWidth) / 2;
    pg.drawText(String(text), { x, y, size, font, color });
  };

  // Helper ngắt dòng tự động
  const drawWrappedText = (text, startX, startY, maxWidth, lineHeight, opt = {}) => {
    if (!text) return;
    const font = opt.bold ? fontB : fontR;
    const size = opt.size || 9.0;
    const color = opt.color || textColor;

    const words = String(text).split(' ');
    let currentLine = '';
    let currentY = startY;

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

  // 1. HEADER HÀNH CHÍNH (Cột trái X=140.0, Cột phải X=399.5)
  const X_LEFT = 140.0;
  const X_RIGHT = 399.5;

  drawText(caseItem.maSo, X_LEFT, 709.2, { bold: true, size: 9.5 });
  drawText((caseItem.hoTen || '').toUpperCase(), X_RIGHT, 709.2, { bold: true, size: 9.5 });

  drawText(caseItem.namSinh, X_LEFT, 690.4, { size: 9.0 });
  drawText(caseItem.gioiTinh || 'Nữ', X_RIGHT, 690.4, { size: 9.0 });

  drawText(caseItem.diaChi, X_LEFT, 671.7, { size: 8.5 });

  drawText(caseItem.soDienThoai, X_LEFT, 652.8, { size: 9.0 });
  drawText(caseItem.bacSiChiDinh, X_RIGHT, 652.8, { size: 9.0 });

  drawText(caseItem.donVi, X_LEFT, 633.8, { size: 9.0 });

  drawText(caseItem.chanDoanLamSang, X_LEFT, 612.9, { size: 9.0 });
  drawText(caseItem.viTriBenhPham, X_LEFT, 595.6, { size: 9.0 });

  const fmtDate = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
    } catch (e) {
      return d;
    }
  };

  const tNhan = fmtDate(caseItem.ngayNhanMau);
  const tKq = fmtDate(caseItem.ngayTraKetQua);
  drawText(tNhan, X_LEFT, 577.6, { size: 9.0 });
  drawText(tKq, X_RIGHT, 577.6, { size: 9.0 });

  // 2. KẾT QUẢ GIẢI PHẪU BỆNH
  // Mô tả Đại thể (ĐẠI THỂ)
  drawWrappedText(caseItem.daiThe, 55.0, 463.0, 480, 14, { size: 9.0 });

  // Mô tả Vi thể (VI THỂ)
  drawWrappedText(caseItem.viThe, 55.0, 393.0, 480, 15, { size: 9.0 });

  // 3. KẾT LUẬN
  drawWrappedText(caseItem.ketLuan, 115.0, 178.9, 420, 14, { bold: true, size: 9.5, color: blueColor });

  // 4. NGÀY KÝ & BÁC SĨ ĐỌC KẾT QUẢ
  let dStr = 'Hà Nội, ngày ..... tháng ..... năm 202...';
  if (caseItem.ngayTraKetQua) {
    const parts = caseItem.ngayTraKetQua.split('-');
    if (parts.length === 3) {
      dStr = `Hà Nội, ngày ${parts[2]} tháng ${parts[1]} năm ${parts[0]}`;
    }
  }
  // Che dòng chấm ngày tháng
  pg.drawRectangle({
    x: 350,
    y: 128,
    width: 175,
    height: 12,
    color: rgb(1, 1, 1),
  });
  drawCentered(dStr, 350, 520, 132.8, { size: 8.5, color: rgb(0.25, 0.3, 0.35) });

  // Bác sĩ đọc kết quả (nếu khác BS CK1 NGUYỄN TRUNG TRỰC)
  const drName = caseItem.bacSiDoc || 'BS CK1 NGUYỄN TRUNG TRỰC';
  if (drName !== 'BS CK1 NGUYỄN TRUNG TRỰC') {
    pg.drawRectangle({
      x: 330,
      y: 22,
      width: 220,
      height: 38,
      color: rgb(1, 1, 1),
    });
    drawCentered(drName, 330, 540, 43.5, { bold: true, size: 9.5 });
    if (caseItem.chucDanhDoc) {
      drawCentered(caseItem.chucDanhDoc, 330, 540, 32.4, { size: 8.0, color: rgb(0.35, 0.35, 0.35) });
    }
  }

  // 5. ẢNH TIÊU BẢN GIẢI PHẪU BỆNH (Góc dưới bên trái)
  // Tạo khung hoặc chèn ảnh mẫu
  // Box: x = 60, y = 30, w = 175, h = 115
  pg.drawRectangle({
    x: 60,
    y: 30,
    width: 175,
    height: 115,
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
    color: rgb(0.97, 0.98, 1.0), // Placeholder background
  });

  const outBytes = await pdfDoc.save();
  const outPath = path.join(__dirname, '../scratch/test_gpb_out.pdf');
  fs.writeFileSync(outPath, outBytes);
  console.log('Saved GPB test output to:', outPath);
}

testGpb();
