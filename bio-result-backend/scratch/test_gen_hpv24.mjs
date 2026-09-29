import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { HpvPdfService } from '../dist/cases/pdf-services/hpv-pdf.service.js';

async function test() {
  const tplPath = path.join(process.cwd(), 'templates', 'sample_hpv24.pdf');
  const tplBytes = fs.readFileSync(tplPath);
  const pdfDoc = await PDFDocument.load(tplBytes);
  pdfDoc.registerFontkit(fontkit);

  const fontRBytes = fs.readFileSync(path.join(process.cwd(), 'templates', 'fonts', 'arial.ttf'));
  const fontBBytes = fs.readFileSync(path.join(process.cwd(), 'templates', 'fonts', 'arialbd.ttf'));
  const fontR = await pdfDoc.embedFont(fontRBytes);
  const fontB = await pdfDoc.embedFont(fontBBytes);

  const mockMinio = {
    getImageBuffer: async () => null,
  };
  const mockUsers = {
    getDoctorInfo: async () => ({
      title: '(Chuyên khoa Xét nghiệm - Sinh học phân tử)',
      signatureUrl: '',
    }),
  };

  const hpvService = new HpvPdfService(mockMinio, mockUsers);

  const mockCase = {
    maSo: 'GTHD-HPV24-888',
    hoTen: 'NGUYỄN THỊ THÙY TRANG',
    namSinh: 1992,
    gioiTinh: 'Nữ',
    diaChi: 'Ba Đình, Hà Nội',
    soDienThoai: '0988.765.432',
    donVi: 'Bệnh Viện Phụ Sản Hà Nội',
    bacSiChiDinh: 'BS. Lê Thị Hoa',
    loaiMau: 'Dịch phết cổ tử cung',
    ngayNhanMau: '2026-09-29',
    ngayTraKetQua: '2026-09-30',
    loaiXetNghiem: 'hpv24',
    hpvHighRiskResult: 'Âm tính',
    hpvHighRiskOtherResult: 'Dương tính (Type 52)',
    hpvLowRiskResult: 'Âm tính',
    ketLuan: 'DƯƠNG TÍNH VỚI HPV TYPE 52 (NHÓM NGUY CƠ CAO).',
    bacSiDoc: 'TS.BS Nguyễn Sỹ Lánh',
    daKy: true,
    trangThai: 'da_tra_ket_qua',
  };

  await hpvService.generatePdf(pdfDoc, mockCase, 'hpv24', fontR, fontB, 0, 'hpv24_default');

  const pdfBytes = await pdfDoc.save();
  const outPath = path.join(process.cwd(), 'scratch', 'test_hpv24_output.pdf');
  fs.writeFileSync(outPath, pdfBytes);
  console.log('Saved generated PDF to:', outPath);
}

test().catch(console.error);
