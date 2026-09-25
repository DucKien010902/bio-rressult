const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

async function testCell() {
  const templatePath = path.join(__dirname, '../templates/sample_cell.pdf');
  const pdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const fontRegularBytes = fs.readFileSync(path.join(__dirname, '../templates/fonts/arial.ttf'));
  const fontBoldBytes = fs.readFileSync(path.join(__dirname, '../templates/fonts/arialbd.ttf'));
  const fontR = await pdfDoc.embedFont(fontRegularBytes);
  const fontB = await pdfDoc.embedFont(fontBoldBytes);

  const pg = pdfDoc.getPages()[0];

  const caseItem = {
    maSo: 'GTHD-CELL001',
    hoTen: 'TRẦN THỊ MAI',
    namSinh: 1988,
    gioiTinh: 'Nữ',
    diaChi: 'Số 12 phố Huế, Hai Bà Trưng, Hà Nội',
    soDienThoai: '0912345678',
    bacSiChiDinh: 'BS. Nguyễn Văn A',
    donVi: 'Bệnh viện Phụ Sản',
    loaiMau: 'Dịch phết tế bào cổ tử cung',
    tinhChatBenhPham: 'dat',
    ngayNhanMau: '2026-09-24',
    ngayTraKetQua: '2026-09-25',
    khongTonThuong: true,
    batThuongKhac: false,
    teBaoNoiMac: false,
    bienDoiViSinh: ['trichomonas', 'candida'],
    bienDoiKhac: ['viem'],
    batThuongVay: ['ascUs'],
    batThuongTuyen: ['agc'],
    ketLuan: 'KHÔNG TỔN THƯƠNG TRONG BIỂU MÔ HAY ÁC TÍNH (NILM).',
    khuyenNghi: 'Khám phụ khoa định kỳ hàng năm.',
    bacSiDoc: 'BS CK1 PHẠM THẾ HÙNG',
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

  // Helper đánh dấu X vào đúng tâm ô vuông checkbox <0000>
  const drawCheck = (boxX, boxY, checked = false) => {
    if (!checked) return;
    // Box in font starts at boxX, width ~6pt, height ~6pt
    // Draw 'X' centered in box
    pg.drawText('X', {
      x: boxX + 0.8,
      y: boxY + 0.6,
      size: 7.2,
      font: fontB,
      color: rgb(0.05, 0.2, 0.5), // Deep blue checkmark
    });
  };

  // 1. HEADER HÀNH CHÍNH
  const X_LEFT = 137.5;
  const X_RIGHT = 399.5;

  drawText(caseItem.maSo, X_LEFT, 712.8, { bold: true, size: 9.5 });
  drawText((caseItem.hoTen || '').toUpperCase(), X_RIGHT, 712.8, { bold: true, size: 9.5 });

  drawText(caseItem.namSinh, X_LEFT, 694.0, { size: 9.0 });
  drawText(caseItem.gioiTinh || 'Nữ', X_RIGHT, 694.0, { size: 9.0 });

  drawText(caseItem.diaChi, X_LEFT, 675.1, { size: 8.5 });

  drawText(caseItem.soDienThoai, X_LEFT, 656.4, { size: 9.0 });
  drawText(caseItem.bacSiChiDinh, X_RIGHT, 656.4, { size: 9.0 });

  drawText(caseItem.donVi, X_LEFT, 635.5, { size: 9.0 });

  // Loại mẫu: che phần in sẵn "Dịch phết"
  pg.drawRectangle({
    x: 133,
    y: 610,
    width: 250,
    height: 14,
    color: rgb(1, 1, 1),
  });
  drawText(caseItem.loaiMau || 'Dịch phết', X_LEFT, 616.0, { size: 9.0 });

  // Đánh giá tiêu bản: Đạt (x=132.3, y=597.3), Không đạt (x=177.2, y=597.3)
  const isDat = (caseItem.tinhChatBenhPham || 'dat') !== 'khong_dat' && caseItem.tinhChatBenhPham !== 'Không đạt';
  drawCheck(132.3, 597.3, isDat);
  drawCheck(177.2, 597.3, !isDat);
  if (!isDat && caseItem.lyDoKhongDat) {
    drawText(caseItem.lyDoKhongDat, 345.0, 597.3, { size: 8.5 });
  }

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
  drawText(tNhan, X_LEFT, 579.3, { size: 9.0 });
  drawText(tKq, X_RIGHT, 579.3, { size: 9.0 });

  // 2. HỆ THỐNG BETHESDA (3 Checkbox tại Y = 519.3)
  drawCheck(57.1, 519.3, !!caseItem.khongTonThuong);
  drawCheck(275.2, 519.3, !!caseItem.batThuongKhac);
  drawCheck(425.9, 519.3, !!caseItem.teBaoNoiMac);

  // Helper check value trong array hoặc string
  const hasItem = (field, key, label) => {
    const val = caseItem[field];
    if (!val) return false;
    if (typeof val === 'boolean') return val;
    if (Array.isArray(val)) {
      return val.includes(key) || (label && val.includes(label));
    }
    if (typeof val === 'string') {
      const arr = val.split(',').map((s) => s.trim());
      return arr.includes(key) || (label && arr.includes(label));
    }
    return false;
  };

  // 3. BIẾN ĐỔI TẾ BÀO DO VI SINH (Cột trái X = 41.5)
  drawCheck(41.5, 478.9, hasItem('bienDoiViSinh', 'trichomonas', 'Trichomonas vaginalis'));
  drawCheck(41.5, 467.2, hasItem('bienDoiViSinh', 'candida', 'Candida spp'));
  drawCheck(41.5, 455.7, hasItem('bienDoiViSinh', 'actinomyces', 'Actinomyces spp'));
  drawCheck(41.5, 444.1, hasItem('bienDoiViSinh', 'gardnerella', 'Gardnerella vaginalis'));
  drawCheck(41.5, 432.4, hasItem('bienDoiViSinh', 'hpv', 'HPV'));
  drawCheck(41.5, 420.8, hasItem('bienDoiViSinh', 'tapKhuan', 'Tạp khuẩn'));

  // 4. BIẾN ĐỔI TẾ BÀO KHÁC (Cột phải X = 290.3)
  drawCheck(290.3, 478.9, hasItem('bienDoiKhac', 'viem', 'Tế bào biến đổi do viêm'));
  drawCheck(290.3, 467.2, hasItem('bienDoiKhac', 'xaTri', 'Tế bào biến đổi do xạ trị'));
  drawCheck(290.3, 455.7, hasItem('bienDoiKhac', 'iud', 'Tế bào biến đổi do vòng tránh thai (IUD)'));
  drawCheck(290.3, 444.1, hasItem('bienDoiKhac', 'teo', 'Tế bào biểu mô teo'));

  // 5. BẤT THƯỜNG TẾ BÀO BIỂU MÔ - TẾ BÀO VẢY (Cột trái X = 41.5)
  drawCheck(41.5, 346.2, hasItem('batThuongVay', 'ascUs', 'Tế bào vảy không điển hình ý nghĩa không xác định (ASC-US)'));
  drawCheck(41.5, 334.7, hasItem('batThuongVay', 'ascH', 'Tế bào vảy không điển hình, chưa loại trừ HSIL (ASC-H)'));
  drawCheck(41.5, 322.9, hasItem('batThuongVay', 'lsil', 'Tổn thương trong biểu mô vảy grade thấp (LSIL)'));
  drawCheck(41.5, 311.4, hasItem('batThuongVay', 'lsilHpv', 'Tổn thương trong biểu mô vảy grade thấp (LSIL) + HPV'));
  drawCheck(41.5, 299.9, hasItem('batThuongVay', 'hsil', 'Tổn thương trong biểu mô vảy grade cao (HSIL)'));
  drawCheck(41.5, 288.1, hasItem('batThuongVay', 'carcinomaVay', 'Carcinoma tế bào vảy'));

  // 6. BẤT THƯỜNG TẾ BÀO BIỂU MÔ - TẾ BÀO TUYẾN (Cột phải X = 290.3)
  drawCheck(290.3, 346.2, hasItem('batThuongTuyen', 'agc', 'Tế bào tuyến không điển hình (AGC)'));
  drawCheck(290.3, 334.7, hasItem('batThuongTuyen', 'agcKdh', 'AGC, loại không đặc hiệu'));
  drawCheck(290.3, 322.9, hasItem('batThuongTuyen', 'agcKCtc', 'AGC, hướng về K tuyến CTC'));
  drawCheck(290.3, 311.4, hasItem('batThuongTuyen', 'agcKTuyen', 'AGC, hướng về K tuyến'));
  drawCheck(290.3, 299.9, hasItem('batThuongTuyen', 'carcinomaTaiCho', 'Carcinoma tuyến tại chỗ'));
  drawCheck(290.3, 288.1, hasItem('batThuongTuyen', 'carcinomaCtc', 'Carcinoma tuyến cổ trong CTC'));
  drawCheck(290.3, 276.6, hasItem('batThuongTuyen', 'carcinomaNoiMac', 'Carcinoma tuyến nội mạc tử cung'));
  drawCheck(290.3, 265.0, hasItem('batThuongTuyen', 'carcinomaKdh', 'Carcinoma tuyến, loại không đặc hiệu'));

  // 7. KẾT LUẬN & KHUYẾN NGHỊ
  const kl = caseItem.ketLuan || 'KHÔNG TỔN THƯƠNG TRONG BIỂU MÔ HAY ÁC TÍNH (NILM).';
  drawText(kl.toUpperCase(), 115, 222.3, { bold: true, size: 8.5, color: blueColor });

  if (caseItem.khuyenNghi) {
    drawText(caseItem.khuyenNghi, 125, 204.6, { size: 8.5, color: textColor });
  }

  // 8. NGÀY KÝ & BÁC SĨ ĐỌC KẾT QUẢ
  let dStr = 'Hà Nội, ngày ..... tháng ..... năm 202...';
  if (caseItem.ngayTraKetQua) {
    const parts = caseItem.ngayTraKetQua.split('-');
    if (parts.length === 3) {
      dStr = `Hà Nội, ngày ${parts[2]} tháng ${parts[1]} năm ${parts[0]}`;
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

  // Nếu bác sĩ đọc khác tên in sẵn "BS CK1 PHẠM THẾ HÙNG"
  if (caseItem.bacSiDoc && caseItem.bacSiDoc !== 'BS CK1 PHẠM THẾ HÙNG') {
    pg.drawRectangle({
      x: 340,
      y: 58,
      width: 200,
      height: 16,
      color: rgb(1, 1, 1),
    });
    drawCentered(caseItem.bacSiDoc, 340, 540, 66.0, { bold: true, size: 9.5 });
  }

  const outBytes = await pdfDoc.save();
  const outPath = path.join(__dirname, '../scratch/test_cell_out.pdf');
  fs.writeFileSync(outPath, outBytes);
  console.log('Saved CELL test output to:', outPath);
}

testCell();
