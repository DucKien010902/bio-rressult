import mongoose from 'mongoose';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const mongoUri =
  process.env.MONGO_URI ||
  'mongodb+srv://DucKien:kien010902@cluster0.4l1lzw3.mongodb.net/bio-result?retryWrites=true&w=majority&appName=Cluster0';

async function importRealSamples() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB Atlas!');

  const raw = fs.readFileSync(
    'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\a7d3636b-a16b-4b1c-bff4-d300c1fca807\\scratch\\hpv40_samples.json',
    'utf-8',
  );
  const data = JSON.parse(raw);
  const CaseModel = mongoose.connection.collection('biocases');

  for (const item of data.results) {
    const doc = {
      maSo: item.maSo,
      patientCode: item.maSo,
      loaiXetNghiem: item.loaiXetNghiem || 'hpv40',
      testType: 'Xét nghiệm HPV 40 Types GenHD',
      hoTen: item.hoTen,
      patientName: item.hoTen,
      namSinh: item.namSinh || 1990,
      age: item.namSinh ? new Date().getFullYear() - item.namSinh : 30,
      gioiTinh: item.gioiTinh || 'Nữ',
      gender: item.gioiTinh || 'Nữ',
      diaChi: item.diaChi || '',
      soDienThoai: item.soDienThoai || '',
      loaiMau: item.loaiMau || 'Dịch phết',
      sampleType: item.loaiMau || 'Dịch phết',
      donVi: item.donVi || 'BVĐK Ngã Tư Hồ',
      bacSiChiDinh: item.bacSiChiDinh || 'Đoàn Xuân Dũng',
      chanDoanLamSang: item.chanDoanLamSang || '',
      ngayNhanMau: item.ngayNhanMau
        ? item.ngayNhanMau.split('T')[0]
        : '2026-09-08',
      sampleDate: item.ngayNhanMau
        ? item.ngayNhanMau.split('T')[0]
        : '2026-09-08',
      ngayXetNghiem: item.ngayXetNghiem
        ? item.ngayXetNghiem.split('T')[0]
        : '',
      ngayDuKienTra: item.ngayDuKienTra || '',
      ngayTraKetQua: item.ngayTraKetQua
        ? item.ngayTraKetQua.split('T')[0]
        : '2026-09-12',
      bacSiDoc: item.bacSiDoc || 'TS . BS Nguyễn Khánh Dương',
      doctorName: item.bacSiDoc || 'TS . BS Nguyễn Khánh Dương',
      bacSiDoc2: item.bacSiDoc2 || '',
      daKy: item.daKy !== undefined ? item.daKy : true,
      trangThai: item.trangThai || 'da_tra_ket_qua',
      status: item.trangThai === 'da_tra_ket_qua' ? 'diagnosed' : 'pending',
      hpvHighRiskResult: item.hpvHighRiskResult || 'Âm tính',
      hpvHighRiskOtherResult: item.hpvHighRiskOtherResult || 'Âm tính',
      hpvLowRiskResult: item.hpvLowRiskResult || 'Âm tính',
      hpvOtherTypesResult: item.hpvOtherTypesResult || 'Âm tính',
      ketLuan:
        item.ketLuan ||
        'ÂM TÍNH VỚI VIRUS HPV (40 TYPE TRÊN) TRÊN MẪU NHẬN ĐƯỢC.',
      diagnosis: item.ketLuan || 'ÂM TÍNH VỚI VIRUS HPV',
      khuyenNghi:
        item.khuyenNghi || 'Đề nghị kiểm tra theo lịch sàng lọc định kỳ.',
      nguoiNhap:
        typeof item.nguoiNhap === 'object'
          ? item.nguoiNhap.fullName
          : item.nguoiNhap || 'Genetrust vn',
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    };

    await CaseModel.updateOne(
      { maSo: doc.maSo },
      { $set: doc },
      { upsert: true },
    );
    console.log(`Synced case ${doc.maSo} (${doc.hoTen})`);
  }

  // Also add 2 cases in 'nhap_thong_tin' and 1 case in 'chay_ket_qua'
  const pendingCases = [
    {
      maSo: 'GTHD-40HP015',
      patientCode: 'GTHD-40HP015',
      loaiXetNghiem: 'hpv40',
      testType: 'Xét nghiệm HPV 40 Types GenHD',
      hoTen: 'VŨ THỊ BÍCH NGỌC',
      patientName: 'VŨ THỊ BÍCH NGỌC',
      namSinh: 1996,
      age: 30,
      gioiTinh: 'Nữ',
      gender: 'Nữ',
      diaChi: 'Hai Bà Trưng, Hà Nội',
      soDienThoai: '0965123456',
      loaiMau: 'Dịch phết',
      donVi: 'Bệnh Viện ĐHQG',
      bacSiChiDinh: 'BS. Lê Hoài An',
      chanDoanLamSang: 'Khám phụ khoa định kỳ',
      ngayNhanMau: '2026-09-13',
      sampleDate: '2026-09-13',
      bacSiDoc: 'Chưa phân loại',
      doctorName: '',
      daKy: false,
      trangThai: 'nhap_thong_tin',
      status: 'pending',
      nguoiNhap: 'bv_đhqg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      maSo: 'GTHD-40HP016',
      patientCode: 'GTHD-40HP016',
      loaiXetNghiem: 'hpv40',
      testType: 'Xét nghiệm HPV 40 Types GenHD',
      hoTen: 'ĐÀO THỊ MAI HOA',
      patientName: 'ĐÀO THỊ MAI HOA',
      namSinh: 1989,
      age: 37,
      gioiTinh: 'Nữ',
      gender: 'Nữ',
      diaChi: 'Thanh Xuân, Hà Nội',
      soDienThoai: '0972345678',
      loaiMau: 'Dịch phết',
      donVi: 'Lab 24/7',
      bacSiChiDinh: 'BS. Nguyễn Thị Lan',
      chanDoanLamSang: 'Sàng lọc ung thư cổ tử cung',
      ngayNhanMau: '2026-09-13',
      sampleDate: '2026-09-13',
      bacSiDoc: 'BS CK1 PHẠM THẾ HÙNG',
      doctorName: 'BS CK1 PHẠM THẾ HÙNG',
      daKy: false,
      trangThai: 'chay_ket_qua',
      status: 'tested',
      nguoiNhap: 'lab 24/7',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const item of pendingCases) {
    await CaseModel.updateOne(
      { maSo: item.maSo },
      { $set: item },
      { upsert: true },
    );
    console.log(`Synced pending case ${item.maSo} (${item.hoTen})`);
  }

  console.log('Finished importing cases into MongoDB!');
  await mongoose.disconnect();
}

importRealSamples().catch(console.error);
