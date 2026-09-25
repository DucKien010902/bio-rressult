const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

async function testHpv23() {
  const templatePath = path.join(__dirname, '../templates/sample_hpv23.pdf');
  const pdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const fontRegularBytes = fs.readFileSync(path.join(__dirname, '../templates/fonts/arial.ttf'));
  const fontBoldBytes = fs.readFileSync(path.join(__dirname, '../templates/fonts/arialbd.ttf'));
  const fontR = await pdfDoc.embedFont(fontRegularBytes);
  const fontB = await pdfDoc.embedFont(fontBoldBytes);

  const pg = pdfDoc.getPages()[0];

  const caseItem = {
    maSo: 'GTHD-23HP001',
    hoTen: 'NGUYỄN THỊ THU HÀ',
    namSinh: 1992,
    gioiTinh: 'Nữ',
    diaChi: 'Số 15 ngõ 42 Trâu Quỳ, Gia Lâm, Hà Nội',
    soDienThoai: '0987654321',
    bacSiChiDinh: 'BS. Lê Thị Hoa',
    donVi: 'Phòng khám Đa khoa Quốc tế',
    loaiMau: 'Dịch phết cổ tử cung',
    ngayNhanMau: '2026-09-05',
    ngayTraKetQua: '2026-09-06',
    hpvHighRiskResult: 'Âm tính',
    hpvHighRiskOtherResult: 'Âm tính',
    hpvOtherTypesResult: 'Âm tính',
    hpvLowRiskResult: 'Âm tính',
    ketLuan: 'KẾT QUẢ XÉT NGHIỆM TRONG GIỚI HẠN BÌNH THƯỜNG.',
    bacSiDoc: 'BS CK1 PHẠM THẾ HÙNG',
    hienBieuDo: false,
  };

  const textColor = rgb(0.1, 0.15, 0.2);
  const blueColor = rgb(0.05, 0.25, 0.45);
  const redColor = rgb(0.8, 0.1, 0.1);

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

  const _isPos = (v) => !!(v && v !== 'Âm tính' && v !== 'am tinh' && v.trim() !== '');

  // 1. HEADER BỆNH NHÂN
  const X_LEFT = 137.5;
  const X_RIGHT = 399.5;

  drawText(caseItem.maSo, X_LEFT, 693.0, { bold: true, size: 9.5 });
  drawText((caseItem.hoTen || '').toUpperCase(), X_RIGHT, 693.0, { bold: true, size: 9.5 });

  drawText(caseItem.namSinh, X_LEFT, 674.0, { size: 9.0 });
  drawText(caseItem.gioiTinh || 'Nữ', X_RIGHT, 674.0, { size: 9.0 });

  drawText(caseItem.diaChi, X_LEFT, 654.5, { size: 8.5 });

  drawText(caseItem.soDienThoai, X_LEFT, 635.5, { size: 9.0 });
  drawText(caseItem.bacSiChiDinh, X_RIGHT, 635.5, { size: 9.0 });

  drawText(caseItem.donVi, X_LEFT, 616.5, { size: 9.0 });

  // Che chữ "Dịch" in sẵn trên phôi trắng và ghi loại mẫu sạch đẹp
  pg.drawRectangle({
    x: 133,
    y: 574,
    width: 250,
    height: 14,
    color: rgb(1, 1, 1),
  });
  drawText(caseItem.loaiMau || 'Dịch phết', X_LEFT, 579.5, { size: 9.0 });

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
  drawText(tNhan, X_LEFT, 550.0, { size: 9.0 });
  drawText(tKq, X_RIGHT, 550.0, { size: 9.0 });

  // 2. BẢNG KẾT QUẢ 4 HÀNG CHO HPV 23 TYPES
  // Cột KẾT QUẢ: X từ 456.4 đến 560.0
  const RES_MIN_X = 456.4;
  const RES_MAX_X = 560.0;

  // Hàng 1: HPV Nguy Cơ Cao (Type 16, 18) -> Y = 459.7
  const res1 = caseItem.hpvHighRiskResult || 'Âm tính';
  const pos1 = _isPos(res1);
  drawCentered(res1, RES_MIN_X, RES_MAX_X, 459.7, {
    bold: pos1,
    size: 9.5,
    color: pos1 ? redColor : blueColor,
  });

  // Hàng 2: HPV Nguy Cơ Cao Khác (10 Types) -> Y = 429.7
  const res2 = caseItem.hpvHighRiskOtherResult || 'Âm tính';
  const pos2 = _isPos(res2);
  drawCentered(res2, RES_MIN_X, RES_MAX_X, 429.7, {
    bold: pos2,
    size: 9.5,
    color: pos2 ? redColor : blueColor,
  });

  // Hàng 3: Các Type HPV khác (9 Types) -> Y = 407.0 (ở HPV 23, 9 types khác ở HÀNG 3!)
  const res3 = caseItem.hpvOtherTypesResult || caseItem.hpvOtherResult || 'Âm tính';
  const pos3 = _isPos(res3);
  drawCentered(res3, RES_MIN_X, RES_MAX_X, 407.0, {
    bold: pos3,
    size: 9.5,
    color: pos3 ? redColor : blueColor,
  });

  // Hàng 4: HPV Nguy Cơ Thấp (2 Types: 6, 11) -> Y = 387.0 (ở HPV 23, 2 types nguy cơ thấp ở HÀNG 4!)
  const res4 = caseItem.hpvLowRiskResult || 'Âm tính';
  const pos4 = _isPos(res4);
  drawCentered(res4, RES_MIN_X, RES_MAX_X, 387.0, {
    bold: pos4,
    size: 9.5,
    color: pos4 ? redColor : blueColor,
  });

  // 3. KẾT LUẬN
  const hasPos = pos1 || pos2 || pos3 || pos4;
  let kl = caseItem.ketLuan || '';
  if (!kl) {
    if (hasPos) {
      kl = 'DƯƠNG TÍNH VỚI VIRUS HPV TRÊN MẪU NHẬN ĐƯỢC.';
    } else {
      kl = 'ÂM TÍNH VỚI VIRUS HPV (23 TYPE TRÊN) TRÊN MẪU NHẬN ĐƯỢC.';
    }
  }
  // Khung KẾT LUẬN trên mẫu trắng HPV 23 ở Y = 251.8
  drawText(kl.toUpperCase(), 115, 251.8, {
    bold: true,
    size: 9.0,
    color: hasPos ? redColor : blueColor,
  });

  // 4. NGÀY KÝ & BÁC SĨ ĐỌC KẾT QUẢ
  let dStr = 'Hà Nội, ngày ..... tháng ..... năm 202...';
  if (caseItem.ngayTraKetQua) {
    const parts = caseItem.ngayTraKetQua.split('-');
    if (parts.length === 3) {
      dStr = `Hà Nội, ngày ${parts[2]} tháng ${parts[1]} năm ${parts[0]}`;
    }
  }
  // Che dòng chữ chấm "Hà Nội, ngày ..... tháng ..... năm 202..." tại Y = 203.1
  pg.drawRectangle({
    x: 350,
    y: 198,
    width: 175,
    height: 12,
    color: rgb(1, 1, 1),
  });
  drawCentered(dStr, 350, 520, 203.1, { size: 8.5, color: rgb(0.25, 0.3, 0.35) });

  // Tên bác sĩ đọc kết quả (in đậm, căn giữa dưới tiêu đề BÁC SĨ ĐỌC KẾT QUẢ)
  const bs = caseItem.bacSiDoc || 'BS CK1 PHẠM THẾ HÙNG';
  drawCentered(bs, 330, 530, 118.0, { bold: true, size: 9.5 });

  const outBytes = await pdfDoc.save();
  const outPath = path.join(__dirname, '../scratch/test_hpv23_out.pdf');
  fs.writeFileSync(outPath, outBytes);
  console.log('Saved HPV 23 test output to:', outPath);
}

testHpv23();
