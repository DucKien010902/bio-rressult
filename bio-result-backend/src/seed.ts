import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const mongoUri =
  process.env.MONGO_URI ||
  'mongodb+srv://DucKien:kien010902@cluster0.4l1lzw3.mongodb.net/bio-result?retryWrites=true&w=majority&appName=Cluster0';

// User Schema definition for seed
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'doctor', 'bacsy', 'lab'],
      required: true,
    },
    donVi: { type: String, default: '' },
    allowedCategories: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// BioCase Schema definition for seed
const bioCaseSchema = new mongoose.Schema(
  {
    maSo: { type: String, required: true, unique: true, index: true },
    loaiXetNghiem: { type: String, default: '', index: true },
    hoTen: { type: String, required: true },
    namSinh: { type: Number, default: 0 },
    gioiTinh: { type: String, enum: ['Nam', 'Nữ', 'Khác'], default: 'Nữ' },
    soDienThoai: { type: String, default: '' },
    diaChi: { type: String, default: '' },
    loaiMau: { type: String, default: 'Dịch phết' },
    donVi: { type: String, default: '' },
    bacSiChiDinh: { type: String, default: '' },
    chanDoanLamSang: { type: String, default: '' },

    nguoiNhap: { type: String, default: '' },
    ngayNhanMau: { type: String, default: '' },
    ngayXetNghiem: { type: String, default: '' },
    ngayDuKienTra: { type: String, default: '' },
    ngayTraKetQua: { type: String, default: '' },

    viTriBenhPham: { type: String, default: '' },
    tinhChatBenhPham: { type: String, default: 'Đạt yêu cầu' },
    lyDoKhongDat: { type: String, default: '' },
    daiThe: { type: String, default: '' },
    viThe: { type: String, default: '' },
    nhanXetDaiThe: { type: String, default: '' },
    khongTonThuong: { type: String, default: '' },
    bienDoiViSinh: { type: String, default: '' },
    bienDoiKhac: { type: String, default: '' },
    batThuongVay: { type: String, default: '' },
    batThuongTuyen: { type: String, default: '' },
    batThuongKhac: { type: String, default: '' },

    hpvHighRiskResult: { type: String, default: '' },
    hpvHighRiskOtherResult: { type: String, default: '' },
    hpvLowRiskResult: { type: String, default: '' },
    hpvOtherTypesResult: { type: String, default: '' },
    hienBieuDo: { type: Boolean, default: true },
    anhHpv: { type: String, default: '' },

    ketLuan: { type: String, default: '' },
    ketLuan2: { type: String, default: '' },
    khuyenNghi: { type: String, default: '' },
    bacSiDoc: { type: String, default: '' },
    bacSiDoc2: { type: String, default: '' },
    daKy: { type: Boolean, default: false },
    daKy2: { type: Boolean, default: false },

    trangThai: {
      type: String,
      enum: [
        'nhap_thong_tin',
        'chay_ket_qua',
        'da_tra_ket_qua',
        'pending',
        'tested',
        'diagnosed',
      ],
      default: 'nhap_thong_tin',
      index: true,
    },
    labMetrics: [
      {
        name: String,
        value: String,
        unit: String,
        referenceRange: String,
        alert: { type: String, enum: ['normal', 'warning', 'danger'] },
      },
    ],
    lichSuChinhSua: [
      {
        nguoiSua: String,
        thoiGian: String,
        noiDung: String,
      },
    ],

    // Legacy fields
    patientCode: { type: String, default: '' },
    patientName: { type: String, default: '' },
    age: { type: Number, default: 0 },
    gender: { type: String, default: '' },
    testType: { type: String, default: '' },
    sampleDate: { type: String, default: '' },
    sampleType: { type: String, default: '' },
    status: { type: String, default: '' },
    diagnosis: { type: String, default: '' },
    doctorNotes: { type: String, default: '' },
    technicianName: { type: String, default: '' },
    doctorName: { type: String, default: '' },
  },
  { timestamps: true, collection: 'biocases' },
);

const UserModel = mongoose.model('User', userSchema, 'users');
const CaseModel = mongoose.model('BioCase', bioCaseSchema, 'biocases');

const ALL_CATEGORIES = [
  'cell',
  'thinprep',
  'hpv40',
  'hpv20',
  'hpv23',
  'soituoi',
  'giaiphaubenh',
  'combo_hpv20_cell',
  'combo_hpv40_cell',
  'combo_hpv23_cell',
  'combo_hpv20_thinprep',
  'combo_hpv40_thinprep',
  'combo_hpv23_thinprep',
  'adn-convert',
];

async function seed() {
  console.log('--- Bắt đầu khởi tạo dữ liệu mẫu GenHD & Bio-Result ---');
  console.log(`Kết nối MongoDB: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);

  await mongoose.connect(mongoUri);
  console.log('Kết nối MongoDB thành công!');

  // ==========================================
  // 1. Seed Danh sách tài khoản chuẩn theo phân quyền
  // ==========================================
  const pass210577 = await bcrypt.hash('210577', 10);
  const pass123456 = await bcrypt.hash('123456', 10);

  const initialUsers: Array<{
    username: string;
    password: string;
    fullName: string;
    role: 'admin' | 'doctor' | 'bacsy' | 'lab';
    donVi: string;
    allowedCategories: string[];
    isActive: boolean;
  }> = [
    // Nhóm Quản trị (Admin)
    {
      username: 'admin_lab',
      password: pass210577,
      fullName: 'Admin phòng Lab',
      role: 'admin',
      donVi: 'Quản lý Lab',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    // Nhóm Bác sĩ đọc kết quả (Doctor)
    {
      username: 'bacsi_hùng',
      password: pass210577,
      fullName: 'BS CK1 PHẠM THẾ HÙNG',
      role: 'doctor',
      donVi: 'Phòng Đọc Kết Quả & Giải Phẫu Bệnh',
      allowedCategories: [
        'cell',
        'thinprep',
        'hpv40',
        'hpv20',
        'soituoi',
        'giaiphaubenh',
      ],
      isActive: true,
    },
    {
      username: 'bacsi_đương',
      password: pass123456,
      fullName: 'TS . BS Nguyễn Khánh Dương',
      role: 'doctor',
      donVi: 'Khoa Tế Bào Học',
      allowedCategories: ['cell', 'thinprep', 'giaiphaubenh'],
      isActive: true,
    },
    {
      username: 'bacsi_trực',
      password: pass123456,
      fullName: 'BSCK1 . Nguyễn Trung Trực',
      role: 'doctor',
      donVi: 'Khoa Tế Bào Học',
      allowedCategories: ['cell', 'thinprep', 'giaiphaubenh'],
      isActive: true,
    },
    {
      username: 'bacsi_son',
      password: pass123456,
      fullName: 'ThS. BSNT Trịnh Ngọc Sơn',
      role: 'doctor',
      donVi: 'Khoa Giải Phẫu Bệnh',
      allowedCategories: ['cell', 'thinprep', 'giaiphaubenh', 'hpv40'],
      isActive: true,
    },
    // Nhóm Đơn vị gửi mẫu / Bệnh viện / Phòng khám (Lab/Hospital)
    {
      username: 'bv_đhqg',
      password: pass123456,
      fullName: 'Bệnh Viện Đại Học Quốc Gia',
      role: 'lab',
      donVi: 'Bệnh Viện ĐHQG',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    {
      username: 'ninhbinh',
      password: pass123456,
      fullName: 'Bệnh Viện Sản Nhi Ninh Bình',
      role: 'lab',
      donVi: 'BV Sản Nhi Ninh Bình',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    {
      username: 'lab 24/7',
      password: pass123456,
      fullName: 'Phòng Xét Nghiệm Lab 24/7',
      role: 'lab',
      donVi: 'Lab 24/7',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    // Legacy users compatibility
    {
      username: 'admin',
      password: pass123456,
      fullName: 'Admin phòng Lab',
      role: 'admin',
      donVi: 'Quản lý Lab',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    {
      username: 'bacsy',
      password: pass123456,
      fullName: 'BS CK1 PHẠM THẾ HÙNG',
      role: 'doctor',
      donVi: 'Khoa Xét Nghiệm',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    {
      username: 'lab',
      password: pass123456,
      fullName: 'Kỹ Thuật Viên Tiếp Nhận',
      role: 'lab',
      donVi: 'Phòng Tiếp Nhận Mẫu',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
  ];

  for (const item of initialUsers) {
    const existing = await UserModel.findOne({ username: item.username });
    if (existing) {
      existing.fullName = item.fullName;
      existing.password = item.password;
      existing.role = item.role;
      existing.donVi = item.donVi;
      existing.allowedCategories = item.allowedCategories;
      existing.isActive = item.isActive;
      await existing.save();
      console.log(`[Cập nhật User] ${item.username} (${item.role})`);
    } else {
      await UserModel.create(item);
      console.log(`[Tạo mới User] ${item.username} (${item.role})`);
    }
  }

  // ==========================================
  // 2. Seed Ca Xét Nghiệm thực tế theo từng trạng thái
  // ==========================================
  const sampleCases: any[] = [
    // Ca 1: Trạng thái [nhap_thong_tin] - Mới tiếp nhận, chờ Bác sĩ đọc
    {
      maSo: 'GTHD-TP2026-001',
      patientCode: 'GTHD-TP2026-001',
      loaiXetNghiem: 'thinprep',
      testType: 'Xét nghiệm ThinPrep Pap Test',
      hoTen: 'Nguyễn Thị Mai',
      patientName: 'Nguyễn Thị Mai',
      namSinh: 1992,
      age: 34,
      gioiTinh: 'Nữ',
      gender: 'Nữ',
      soDienThoai: '0912345678',
      diaChi: 'Cầu Giấy, Hà Nội',
      loaiMau: 'Dịch phết tế bào cổ tử cung',
      sampleType: 'Dịch phết cổ tử cung',
      donVi: 'Bệnh Viện ĐHQG',
      bacSiChiDinh: 'BS. Nguyễn Thị Lan',
      chanDoanLamSang: 'Viêm âm đạo lộ tuyến, kiểm tra định kỳ',
      nguoiNhap: 'bv_đhqg',
      ngayNhanMau: '2026-09-12',
      sampleDate: '2026-09-12',
      ngayDuKienTra: '2026-09-14',
      bacSiDoc: 'BS. Nguyễn Văn Hùng',
      doctorName: 'BS. Nguyễn Văn Hùng',
      trangThai: 'nhap_thong_tin',
      status: 'pending',
      daKy: false,
    },
    // Ca 2: Trạng thái [chay_ket_qua] - Bác sĩ đã đọc và ký, chờ Admin trả KQ
    {
      maSo: 'GTHD-HPV40-002',
      patientCode: 'GTHD-HPV40-002',
      loaiXetNghiem: 'hpv40',
      testType: 'Xét nghiệm HPV 40 Types Real-time PCR',
      hoTen: 'Trần Thu Trang',
      patientName: 'Trần Thu Trang',
      namSinh: 1988,
      age: 38,
      gioiTinh: 'Nữ',
      gender: 'Nữ',
      soDienThoai: '0987654321',
      diaChi: 'Phố 8, TP. Ninh Bình',
      loaiMau: 'Dịch quệt âm đạo',
      sampleType: 'Dịch quệt âm đạo',
      donVi: 'BV Sản Nhi Ninh Bình',
      bacSiChiDinh: 'BS. Phạm Hồng Nhung',
      chanDoanLamSang: 'Tầm soát ung thư cổ tử cung',
      nguoiNhap: 'ninhbinh',
      ngayNhanMau: '2026-09-11',
      sampleDate: '2026-09-11',
      ngayXetNghiem: '2026-09-12',
      ngayDuKienTra: '2026-09-13',
      bacSiDoc: 'BS. Nguyễn Văn Hùng',
      doctorName: 'BS. Nguyễn Văn Hùng',
      hpvHighRiskResult: 'DƯƠNG TÍNH TUÝP 16',
      hpvHighRiskOtherResult:
        'Âm tính (Tuýp 18, 31, 33, 35, 39, 45, 51, 52, 56, 58, 59, 68)',
      hpvLowRiskResult: 'Âm tính (Tuýp 6, 11)',
      ketLuan:
        'Dương tính với HPV nhóm nguy cơ cao (Type 16). Âm tính với các tuýp còn lại.',
      diagnosis: 'Dương tính với HPV Type 16',
      khuyenNghi:
        'Đề nghị thực hiện thêm xét nghiệm ThinPrep tế bào học và soi cổ tử cung theo dõi.',
      doctorNotes: 'Bệnh nhân cần được tư vấn kỹ về lộ trình theo dõi tuýp 16.',
      daKy: true,
      trangThai: 'chay_ket_qua',
      status: 'tested',
    },
    // Ca 3: Trạng thái [da_tra_ket_qua] - Hoàn tất, đã xuất PDF
    {
      maSo: 'GTHD-CB23TP022',
      patientCode: 'GTHD-CB23TP022',
      loaiXetNghiem: 'combo_hpv23_thinprep',
      testType: 'Combo: HPV 23 Types + ThinPrep',
      hoTen: 'Lê Phương Anh',
      patientName: 'Lê Phương Anh',
      namSinh: 1995,
      age: 31,
      gioiTinh: 'Nữ',
      gender: 'Nữ',
      soDienThoai: '0901234567',
      diaChi: 'Đống Đa, Hà Nội',
      loaiMau: 'Dịch phết cổ tử cung',
      sampleType: 'Dịch phết cổ tử cung',
      donVi: 'Lab 24/7',
      bacSiChiDinh: 'BS. Vũ Văn Thắng',
      chanDoanLamSang: 'Khám sức khỏe tiền hôn nhân',
      nguoiNhap: 'lab 24/7',
      ngayNhanMau: '2026-09-10',
      sampleDate: '2026-09-10',
      ngayXetNghiem: '2026-09-11',
      ngayTraKetQua: '2026-09-12',
      bacSiDoc: 'BS. Trần Văn Trực',
      doctorName: 'BS. Trần Văn Trực',
      tinhChatBenhPham: 'Đạt yêu cầu',
      khongTonThuong: 'Không tổn thương trong biểu mô hay ác tính (NILM)',
      bienDoiViSinh: 'Nhiễm trực khuẩn Doderlein bình thường',
      hpvHighRiskResult: 'Âm tính',
      hpvLowRiskResult: 'Âm tính',
      ketLuan:
        'Tế bào học cổ tử cung trong giới hạn bình thường (NILM). Âm tính với 23 tuýp HPV.',
      diagnosis: 'NILM - Bình thường',
      khuyenNghi: 'Tái khám định kỳ sau 12 tháng.',
      daKy: true,
      trangThai: 'da_tra_ket_qua',
      status: 'diagnosed',
    },
  ];

  for (const item of sampleCases) {
    const existing = await CaseModel.findOne({ maSo: item.maSo });
    if (existing) {
      Object.assign(existing, item);
      await existing.save();
      console.log(`[Cập nhật Ca] ${item.maSo} - ${item.hoTen} (${item.trangThai})`);
    } else {
      await CaseModel.create(item);
      console.log(`[Tạo mới Ca] ${item.maSo} - ${item.hoTen} (${item.trangThai})`);
    }
  }

  console.log('--- Hoàn tất khởi tạo dữ liệu mẫu thành công! ---');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Lỗi khi seed dữ liệu:', err);
  process.exit(1);
});
