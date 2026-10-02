import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const mongoUri =
  process.env.MONGO_URI ||
  'mongodb+srv://DucKien:kien010902@cluster0.4l1lzw3.mongodb.net/bio-result?retryWrites=true&w=majority&appName=Cluster0';

// User Schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    passwordHint: { type: String, default: '' },
    fullName: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'doctor', 'bacsy', 'lab'],
      required: true,
    },
    title: { type: String, default: '' },
    donVi: { type: String, default: '' },
    signatureUrl: { type: String, default: '' },
    allowedCategories: { type: [String], default: [] },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false },
);

// BioCase Schema with strict: false so no property is ever lost
const bioCaseSchema = new mongoose.Schema(
  {
    maSo: { type: String, required: true },
    loaiXetNghiem: { type: String, default: '' },
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

    anhTeBao: { type: String, default: '' },
    anhGpb: { type: String, default: '' },

    soiTuoiBachCau: { type: String, default: '' },
    soiTuoiNam: { type: String, default: '' },
    soiTuoiTapKhuan: { type: String, default: '' },
    soiTuoiTeBaoBieuMo: { type: String, default: '' },
    soiTuoiTrichomonas: { type: String, default: '' },
    soiTuoiGhiChuBachCau: { type: String, default: '' },
    soiTuoiGhiChuNam: { type: String, default: '' },
    soiTuoiGhiChuTapKhuan: { type: String, default: '' },
    soiTuoiGhiChuTeBaoBieuMo: { type: String, default: '' },
    soiTuoiGhiChuTrichomonas: { type: String, default: '' },

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
    bacSiDocUsername: { type: String, default: '', index: true },
    bacSiDocId: { type: String, default: '' },
    bacSiDoc2: { type: String, default: '' },
    bacSiDoc2Username: { type: String, default: '', index: true },
    bacSiDoc2Id: { type: String, default: '' },
    daKy: { type: Boolean, default: false },
    daKy2: { type: Boolean, default: false },

    trangThai: { type: String, default: 'nhap_thong_tin' },
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
  { timestamps: true, collection: 'biocases', strict: false },
);

const doctorSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    title: { type: String, default: '' },
    donVi: { type: String, default: '' },
    signatureUrl: { type: String, default: '' },
    soDienThoai: { type: String, default: '' },
    email: { type: String, default: '' },
    chungChiHanhNghe: { type: String, default: '' },
    allowedCategories: { type: [String], default: [] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'doctors', strict: false },
);

const UserModel = mongoose.model('User', userSchema, 'users');
const DoctorModel = mongoose.model('Doctor', doctorSchema, 'doctors');
const CaseModel = mongoose.model('BioCase', bioCaseSchema, 'biocases');

const ALL_CATEGORIES = [
  'cell',
  'thinprep',
  'hpv40',
  'hpv20',
  'hpv23',
  'hpv24',
  'soituoi',
  'giaiphaubenh',
  'giaiphaubenh_mobenh',
  'giaiphaubenh_tebaohoc',
  'combo_hpv20_cell',
  'combo_hpv40_cell',
  'combo_hpv23_cell',
  'combo_hpv20_thinprep',
  'combo_hpv40_thinprep',
  'combo_hpv23_thinprep',
];

const VIETNAMESE_NAMES = [
  'NGUYỄN THỊ MAI', 'TRẦN THỊ HỒNG', 'LÊ THỊ BÍCH NGỌC', 'HOÀNG THỊ THU',
  'PHẠM THỊ HUYỀN', 'VŨ THỊ LAN', 'ĐỖ THỊ QUỲNH', 'BÙI THỊ DIỆP',
  'NGUYỄN THỊ THU HÀ', 'PHAN THỊ TƠ', 'ĐẶNG THỊ LOAN', 'DƯƠNG THỊ NGA',
  'NGÔ THỊ BÍCH', 'LÝ THÙY HÀ', 'TRỊNH THỊ KIM ANH', 'ĐINH THỊ HƯƠNG',
  'HÀ THỊ THU TRANG', 'LƯƠNG THỊ NGUYỆT', 'VÕ THỊ HẢO', 'MAI THỊ PHƯƠNG',
  'TRƯƠNG THỊ HẠNH', 'CHU THỊ XUÂN', 'TÔ THỊ MINH', 'TẠ THỊ HUYỀN',
  'ĐOÀN THỊ THẢO', 'PHÙNG THỊ LIÊN', 'LÂM THỊ YẾN', 'HỒ THỊ THUỶ',
  'CAO THỊ NGỌC ÁNH', 'NGUYỄN HOÀNG ANH'
];

const VIETNAMESE_ADDRESSES = [
  'Số 15 ngõ 42 Bồ Đề, Long Biên, Hà Nội',
  'Khu đô thị Việt Hưng, Long Biên, Hà Nội',
  'Số 88 Trần Duy Hưng, Cầu Giấy, Hà Nội',
  'Phố Huế, Hai Bà Trưng, Hà Nội',
  'Xã Cổ Bi, Gia Lâm, Hà Nội',
  'Phường Tiền An, TP. Bắc Ninh',
  'Thị trấn Lim, Tiên Du, Bắc Ninh',
  'Phường Đằng Giang, Ngô Quyền, Hải Phòng',
  'Đại lộ Lê Lợi, TP. Thanh Hóa',
  'Phường Quang Trung, TP. Nam Định',
  'Xã Chiềng An, TP. Sơn La',
  'Phường Phan Đình Phùng, TP. Thái Nguyên',
  'Đường Hùng Vương, TP. Việt Trì, Phú Thọ',
  'Phường Hồng Hà, TP. Hạ Long, Quảng Ninh',
  'Số 120 Hoàng Hoa Thám, Ba Đình, Hà Nội'
];

const LAB_FACILITIES = [
  'Bệnh Viện Phụ Sản Hà Nội',
  'Phòng Khám Thiên Đức',
  'Bệnh Viện Đại Học Y Hà Nội',
  'Phòng Khám Medlatec Long Biên',
  'Bệnh Viện Đa Khoa Ngã Tư Hồ',
  'Phòng Khám Sản Phụ Khoa BS Thoa',
  'Bệnh Viện Sản Nhi Bắc Ninh',
  'Trung Tâm Chẩn Đoán Y Khoa GenHD'
];

const DOCTOR_NAMES = [
  'BS CK1 PHẠM THẾ HÙNG',
  'TS . BS Nguyễn Khánh Dương',
  'BSCK1 . Nguyễn Trung Trực',
  'TS.BS Nguyễn Sỹ Lãnh',
  'ThS.BSNT Trịnh Ngọc Sơn',
];

async function seed() {
  console.log('--- Bắt đầu khởi tạo dữ liệu mẫu GenHD & Bio-Result ---');
  console.log(`Kết nối MongoDB: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);

  await mongoose.connect(mongoUri);
  console.log('Kết nối MongoDB thành công!');

  // ==========================================
  // 1. Cập nhật Tài khoản người dùng (Users)
  // ==========================================
  // Xóa các tài khoản bác sĩ trùng lặp hoặc không thuộc danh sách 6 bác sĩ chuẩn
  const redundantDoctors = ['bacsi_hùng', 'bacsy', 'bacsi_đương', 'bacsi_trực', 'bacsi_theduong'];
  const delUsersResult = await UserModel.deleteMany({
    $or: [
      { username: { $in: redundantDoctors } },
      { fullName: /THẾ ĐƯƠNG/i },
      { role: 'doctor', username: { $nin: ['bacsi_lanh', 'bacsi_lanh2', 'bacsi_duong', 'bacsi_hung', 'bacsi_truc', 'bacsi_son'] } },
    ],
  });
  if (delUsersResult.deletedCount > 0) {
    console.log(`Đã xóa ${delUsersResult.deletedCount} tài khoản bác sĩ dư thừa/trùng lặp trong CSDL.`);
  }

  const pass210577 = await bcrypt.hash('210577', 10);
  const pass123456 = await bcrypt.hash('123456', 10);

  const initialUsers = [
    {
      username: 'admin_lab',
      password: pass210577,
      passwordHint: '210577',
      fullName: 'Admin phòng Lab GenHD',
      role: 'admin',
      donVi: 'Trung tâm GenHD',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    {
      username: 'admin',
      password: pass123456,
      passwordHint: '123456',
      fullName: 'Admin Hệ Thống',
      role: 'admin',
      donVi: 'Quản trị Lab',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    // 6 Bác sĩ đọc & ký duyệt kết quả (Định danh bằng username/code duy nhất)
    {
      username: 'bacsi_lanh',
      password: pass123456,
      passwordHint: '123456',
      fullName: 'TS.BS Nguyễn Sỹ Lánh',
      role: 'doctor',
      title: 'Trưởng khoa Giải phẫu bệnh BV Việt Đức',
      donVi: 'Khoa GPB & Tế Bào',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    {
      username: 'bacsi_lanh2',
      password: pass123456,
      passwordHint: '123456',
      fullName: 'TS.BS NGUYỄN SỸ LÁNH',
      role: 'doctor',
      title: 'Trưởng khoa Giải phẫu bệnh BV Việt Đức',
      donVi: 'Khoa Xét Nghiệm & Tế Bào',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    {
      username: 'bacsi_duong',
      password: pass123456,
      passwordHint: '123456',
      fullName: 'TS . BS Nguyễn Khánh Dương',
      role: 'doctor',
      title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
      donVi: 'Khoa Tế Bào Học',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    {
      username: 'bacsi_hung',
      password: pass123456,
      passwordHint: '123456',
      fullName: 'BS CK1 PHẠM THẾ HÙNG',
      role: 'doctor',
      title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
      donVi: 'Khoa Xét Nghiệm - GPB',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    {
      username: 'bacsi_truc',
      password: pass123456,
      passwordHint: '123456',
      fullName: 'BSCK1 . Nguyễn Trung Trực',
      role: 'doctor',
      title: '(Bệnh viện K Trung Ương)',
      donVi: 'Khoa Tế Bào Học',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    {
      username: 'bacsi_son',
      password: pass123456,
      passwordHint: '123456',
      fullName: 'ThS.BSNT Trịnh Ngọc Sơn',
      role: 'doctor',
      title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
      donVi: 'Khoa Giải Phẫu Bệnh',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    // Tài khoản Lab / Tiếp nhận & Đơn vị gửi mẫu
    {
      username: 'lab',
      password: pass123456,
      passwordHint: '123456',
      fullName: 'Kỹ Thuật Viên Tiếp Nhận',
      role: 'lab',
      donVi: 'Phòng Tiếp Nhận Mẫu',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    {
      username: 'lab_phusan',
      password: pass123456,
      passwordHint: '123456',
      fullName: 'Bệnh Viện Phụ Sản Hà Nội',
      role: 'lab',
      donVi: 'Bệnh Viện Phụ Sản Hà Nội',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
    {
      username: 'lab_thienduc',
      password: pass123456,
      passwordHint: '123456',
      fullName: 'Phòng Khám Thiên Đức',
      role: 'lab',
      donVi: 'Phòng Khám Thiên Đức',
      allowedCategories: ALL_CATEGORIES,
      isActive: true,
    },
  ];

  for (const item of initialUsers) {
    const existing = await UserModel.findOne({ username: item.username });
    if (existing) {
      existing.fullName = item.fullName;
      existing.password = item.password;
      (existing as any).passwordHint = (item as any).passwordHint || '123456';
      existing.role = item.role as any;
      (existing as any).title = (item as any).title || '';
      existing.donVi = item.donVi;
      existing.allowedCategories = item.allowedCategories;
      existing.isActive = item.isActive;
      await existing.save();
    } else {
      await UserModel.create(item as any);
    }
  }
  console.log(`Đã cập nhật ${initialUsers.length} tài khoản người dùng!`);

  // ==========================================
  // 1b. Cập nhật Bác sĩ Master (Doctor Collection)
  // ==========================================
  const initialDoctors = [
    {
      code: 'bacsi_lanh',
      fullName: 'TS.BS Nguyễn Sỹ Lánh',
      title: 'Trưởng khoa Giải phẫu bệnh BV Việt Đức',
      donVi: 'Khoa GPB & Tế Bào',
      signatureUrl: 'https://file.gennovax.vn/genhd/signatures/doctor_bacsi_lanh_1790558821165.png',
      allowedCategories: ALL_CATEGORIES,
    },
    {
      code: 'bacsi_lanh2',
      fullName: 'TS.BS NGUYỄN SỸ LÁNH',
      title: 'Trưởng khoa Giải phẫu bệnh BV Việt Đức',
      donVi: 'Khoa Xét Nghiệm & Tế Bào',
      signatureUrl: 'https://file.gennovax.vn/genhd/signatures/doctor_bacsi_lanh2_1790649780007.jpg',
      allowedCategories: ALL_CATEGORIES,
    },
    {
      code: 'bacsi_duong',
      fullName: 'TS . BS Nguyễn Khánh Dương',
      title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
      donVi: 'Khoa Tế Bào Học',
      signatureUrl: 'https://file.gennovax.vn/genhd/signatures/doctor_bacsi_duong_1790559222197.png',
      allowedCategories: ALL_CATEGORIES,
    },
    {
      code: 'bacsi_hung',
      fullName: 'BS CK1 PHẠM THẾ HÙNG',
      title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
      donVi: 'Khoa Xét Nghiệm - GPB',
      signatureUrl: 'https://file.gennovax.vn/genhd/signatures/doctor_bacsi_hung_1790559324405.png',
      allowedCategories: ALL_CATEGORIES,
    },
    {
      code: 'bacsi_truc',
      fullName: 'BSCK1 . Nguyễn Trung Trực',
      title: '(Bệnh viện K Trung Ương)',
      donVi: 'Khoa Tế Bào Học',
      signatureUrl: 'https://file.gennovax.vn/genhd/signatures/doctor_bacsi_truc_1790559441491.png',
      allowedCategories: ALL_CATEGORIES,
    },
    {
      code: 'bacsi_son',
      fullName: 'ThS.BSNT Trịnh Ngọc Sơn',
      title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
      donVi: 'Khoa Giải Phẫu Bệnh',
      signatureUrl: 'https://file.gennovax.vn/genhd/signatures/doctor_bacsi_son_1790523210101.png',
      allowedCategories: ALL_CATEGORIES,
    },
  ];

  const doctorsMap: Record<string, any> = {};
  for (const docItem of initialDoctors) {
    let doc = await DoctorModel.findOne({ code: docItem.code });
    const user = await UserModel.findOne({ username: docItem.code });
    if (doc) {
      doc.fullName = docItem.fullName;
      doc.title = docItem.title;
      doc.donVi = docItem.donVi;
      if (docItem.signatureUrl) doc.signatureUrl = docItem.signatureUrl;
      doc.allowedCategories = docItem.allowedCategories;
      if (user) {
        doc.userId = user._id as any;
        (user as any).doctorId = doc._id as any;
        await user.save();
      }
      await doc.save();
    } else {
      doc = await DoctorModel.create({
        ...docItem,
        userId: user?._id,
      });
      if (user) {
        (user as any).doctorId = doc._id as any;
        await user.save();
      }
    }
    doctorsMap[docItem.code] = doc;
  }
  console.log(`Đã cập nhật ${initialDoctors.length} bác sĩ trong danh mục bác sĩ (Doctor Master)!`);

  // ==========================================
  // 2. Xóa sạch toàn bộ Ca xét nghiệm cũ & Xóa Index cũ nếu có
  // ==========================================
  try {
    await CaseModel.collection.dropIndexes();
  } catch (e) {
    // bỏ qua nếu chưa có index
  }
  const deleteResult = await CaseModel.deleteMany({});
  console.log(`Đã xóa sạch ${deleteResult.deletedCount} ca xét nghiệm cũ trong CSDL!`);

  // Chuẩn bị ảnh mô học / tế bào học (data URI base64)
  let imgDataUri = '';
  const imgPath = path.join(process.cwd(), 'templates', 'sample_histology.jpg');
  if (fs.existsSync(imgPath)) {
    const imgBuf = fs.readFileSync(imgPath);
    imgDataUri = `data:image/jpeg;base64,${imgBuf.toString('base64')}`;
    console.log(`Đã nạp ảnh mẫu tế bào học (${imgDataUri.length} ký tự base64)`);
  }

  // ==========================================
  // 3. Khởi tạo 30 ca cho mỗi loại trong 13 danh mục (390 ca tổng cộng)
  // ==========================================
  const newCases: any[] = [];

  for (const cat of ALL_CATEGORIES) {
    console.log(`Đang sinh 30 ca cho danh mục: [${cat}]...`);

    for (let i = 0; i < 30; i++) {
      const idxStr = String(i + 1).padStart(3, '0');
      const maCode = `GTHD-${cat.toUpperCase().replace(/_/g, '')}-${idxStr}`;
      const hoTen = VIETNAMESE_NAMES[i % VIETNAMESE_NAMES.length];
      const namSinh = 1965 + ((i * 3) % 36); // 1965 đến 2001
      const diaChi = VIETNAMESE_ADDRESSES[i % VIETNAMESE_ADDRESSES.length];
      const donVi = LAB_FACILITIES[i % LAB_FACILITIES.length];

      // Phân bổ Bác sĩ đọc kết quả theo chuyên môn và mã định danh duy nhất (Username / ID)
      let doc1Obj = doctorsMap['bacsi_lanh2'] || { fullName: 'TS.BS NGUYỄN SỸ LÁNH', code: 'bacsi_lanh2', _id: '' };
      let doc2Obj = doc1Obj;

      if (cat === 'giaiphaubenh' || cat === 'giaiphaubenh_mobenh' || cat === 'giaiphaubenh_tebaohoc') {
        doc1Obj = (i % 2 === 0) ? doctorsMap['bacsi_lanh'] : doctorsMap['bacsi_son'];
        doc2Obj = doc1Obj;
      } else if (cat.startsWith('combo_')) {
        doc1Obj = doctorsMap['bacsi_hung']; // BS 1 đọc HPV
        doc2Obj = doctorsMap['bacsi_lanh2']; // BS 2 đọc Tế bào / ThinPrep
      } else if (cat === 'cell' || cat === 'thinprep' || cat === 'soituoi') {
        const cellDocs = [doctorsMap['bacsi_lanh2'], doctorsMap['bacsi_duong'], doctorsMap['bacsi_truc']];
        doc1Obj = cellDocs[i % cellDocs.length] || doc1Obj;
        doc2Obj = doc1Obj;
      } else {
        // HPV đơn lẻ
        const hpvDocs = [doctorsMap['bacsi_hung'], doctorsMap['bacsi_lanh2'], doctorsMap['bacsi_duong']];
        doc1Obj = hpvDocs[i % hpvDocs.length] || doc1Obj;
        doc2Obj = doc1Obj;
      }

      const soDienThoai = `09${Math.floor(10000000 + Math.random() * 89999999)}`;
      const ngayNhan = '2026-09-15';
      const ngayTra = '2026-09-17';

      // 25 ca đã trả kết quả (đã ký), 3 ca đang chạy kết quả, 2 ca mới nhập
      let trangThai = 'da_tra_ket_qua';
      let daKy = true;
      if (i === 28) {
        trangThai = 'chay_ket_qua';
        daKy = false;
      } else if (i === 29) {
        trangThai = 'nhap_thong_tin';
        daKy = false;
      }

      // Ca cơ bản
      const baseCase: any = {
        maSo: maCode,
        patientCode: maCode,
        patientName: hoTen,
        age: 2026 - namSinh,
        gender: 'Nữ',
        loaiXetNghiem: cat,
        testType: cat,
        hoTen,
        namSinh,
        gioiTinh: 'Nữ',
        diaChi,
        soDienThoai,
        donVi,
        bacSiChiDinh: 'BS. Lê Thị Loan',
        chanDoanLamSang: 'Khám phụ khoa định kỳ, tầm soát ung thư',
        nguoiNhap: 'admin_lab',
        ngayNhanMau: ngayNhan,
        ngayDuKienTra: ngayTra,
        ngayTraKetQua: ngayTra,
        ngayXetNghiem: ngayNhan,
        loaiMau: 'Dịch phết cổ tử cung',
        sampleType: 'Dịch phết cổ tử cung',
        bacSiDoc: doc1Obj.fullName,
        bacSiDocUsername: doc1Obj.code,
        bacSiDocId: String(doc1Obj._id || ''),
        bacSiDoc2: doc2Obj.fullName,
        bacSiDoc2Username: doc2Obj.code,
        bacSiDoc2Id: String(doc2Obj._id || ''),
        doctorName: doc1Obj.fullName,
        trangThai,
        status: trangThai,
        daKy,
        pdfTemplate: `${cat}_default`,
      };

      // A. CELL & THINPREP
      if (cat === 'cell' || cat === 'thinprep') {
        baseCase.anhTeBao = imgDataUri;
        baseCase.tinhChatBenhPham = 'Đạt yêu cầu';

        if (i < 5) {
          baseCase.khongTonThuong = 'true';
          baseCase.ketLuan = 'KHÔNG TỔN THƯƠNG TRONG BIỂU MÔ HAY ÁC TÍNH (NILM).';
          baseCase.khuyenNghi = 'Khám phụ khoa và làm lại xét nghiệm sau 1 - 3 năm.';
        } else if (i < 12) {
          const vsList = ['trichomonas', 'candida', 'tapKhuan', 'actinomyces', 'gardnerella', 'hpv', 'candida, tapKhuan'];
          baseCase.bienDoiViSinh = vsList[i - 5];
          baseCase.ketLuan = `TẾ BÀO BIẾN ĐỔI DO VI SINH VẬT (${baseCase.bienDoiViSinh.toUpperCase()}).`;
          baseCase.khuyenNghi = 'Điều trị viêm nhiễm theo phác đồ phụ khoa.';
        } else if (i < 17) {
          const khacList = ['viem', 'teo', 'iud', 'xaTri', 'viem, teo'];
          baseCase.bienDoiKhac = khacList[i - 12];
          baseCase.ketLuan = `TẾ BÀO BIẾN ĐỔI PHẢN ỨNG (${baseCase.bienDoiKhac.toUpperCase()}).`;
          baseCase.khuyenNghi = 'Kiểm tra lại sau đợt điều trị chống viêm.';
        } else if (i < 24) {
          const vayList = ['ascUs', 'ascH', 'lsil', 'lsilHpv', 'hsil', 'carcinomaVay', 'ascUs'];
          baseCase.batThuongVay = vayList[i - 17];
          const titles: Record<string, string> = {
            ascUs: 'TẾ BÀO VẢY KHÔNG ĐIỂN HÌNH Ý NGHĨA KHÔNG XÁC ĐỊNH (ASC-US).',
            ascH: 'TẾ BÀO VẢY KHÔNG ĐIỂN HÌNH, CHƯA LOẠI TRỪ HSIL (ASC-H).',
            lsil: 'TỔN THƯƠNG TRONG BIỂU MÔ VẢY GRADE THẤP (LSIL).',
            lsilHpv: 'TỔN THƯƠNG TRONG BIỂU MÔ VẢY GRADE THẤP (LSIL) + HPV.',
            hsil: 'TỔN THƯƠNG TRONG BIỂU MÔ VẢY GRADE CAO (HSIL / CIN II - III).',
            carcinomaVay: 'CARCINOMA TẾ BÀO BIỂU MÔ VẢY.',
          };
          baseCase.ketLuan = titles[baseCase.batThuongVay] || 'BẤT THƯỜNG BIỂU MÔ VẢY.';
          baseCase.khuyenNghi = 'Chỉ định soi cổ tử cung, sinh thiết nếu cần.';
        } else if (i < 28) {
          const tuyenList = ['agc', 'agcKCtc', 'carcinomaTaiCho', 'carcinomaCtc'];
          baseCase.batThuongTuyen = tuyenList[i - 24];
          baseCase.ketLuan = `BẤT THƯỜNG BIỂU MÔ TUYẾN (${baseCase.batThuongTuyen.toUpperCase()}).`;
          baseCase.khuyenNghi = 'Hội chẩn chuyên khoa và nạo sinh thiết kênh cổ tử cung.';
        } else {
          baseCase.tinhChatBenhPham = 'Không đạt yêu cầu';
          baseCase.lyDoKhongDat = 'Số lượng tế bào biểu mô không đủ (dưới 5000 tế bào)';
          baseCase.ketLuan = 'MẪU BỆNH PHẨM KHÔNG ĐẠT YÊU CẦU ĐÁNH GIÁ.';
          baseCase.khuyenNghi = 'Đề nghị lấy lại mẫu bệnh phẩm mới sau 2 - 4 tuần.';
        }
      }

      // B. HPV (hpv20, hpv23, hpv24, hpv40)
      else if (cat === 'hpv20' || cat === 'hpv23' || cat === 'hpv24' || cat === 'hpv40') {
        baseCase.hienBieuDo = true;

        if (i < 8) {
          baseCase.hpvHighRiskResult = 'Âm tính';
          baseCase.hpvHighRiskOtherResult = 'Âm tính';
          baseCase.hpvLowRiskResult = 'Âm tính';
          baseCase.ketLuan = `ÂM TÍNH VỚI VIRUS HPV (${cat === 'hpv40' ? '40' : cat === 'hpv24' ? '24' : cat === 'hpv23' ? '23' : '20'} TYPE KHẢO SÁT) TRÊN MẪU NHẬN ĐƯỢC.`;
          baseCase.khuyenNghi = 'Khám phụ khoa và tầm soát định kỳ sau 3 năm.';
        } else if (i < 13) {
          baseCase.hpvHighRiskResult = 'Dương tính với type 16';
          baseCase.hpvHighRiskOtherResult = 'Âm tính';
          baseCase.hpvLowRiskResult = 'Âm tính';
          baseCase.ketLuan = 'DƯƠNG TÍNH VỚI HPV TYPE 16 (NHÓM NGUY CƠ CAO).';
          baseCase.khuyenNghi = 'Chỉ định soi cổ tử cung và làm xét nghiệm tế bào học Pap/ThinPrep.';
        } else if (i < 17) {
          baseCase.hpvHighRiskResult = 'Dương tính với type 18';
          baseCase.hpvHighRiskOtherResult = 'Âm tính';
          baseCase.hpvLowRiskResult = 'Âm tính';
          baseCase.ketLuan = 'DƯƠNG TÍNH VỚI HPV TYPE 18 (NHÓM NGUY CƠ CAO).';
          baseCase.khuyenNghi = 'Chỉ định soi cổ tử cung và làm xét nghiệm tế bào học.';
        } else if (i < 20) {
          baseCase.hpvHighRiskResult = 'Dương tính với type 16, 18';
          baseCase.hpvHighRiskOtherResult = 'Âm tính';
          baseCase.hpvLowRiskResult = 'Âm tính';
          baseCase.ketLuan = 'ĐỒNG NHIỄM HPV TYPE 16 VÀ 18 (NGUY CƠ CAO).';
          baseCase.khuyenNghi = 'Hội chẩn chuyên khoa Phụ sản, soi CTC và sinh thiết.';
        } else if (i < 25) {
          const otherTypes = ['58', '52', '31, 33', '45', '39, 51, 56'];
          baseCase.hpvHighRiskResult = 'Âm tính';
          baseCase.hpvHighRiskOtherResult = `Dương tính với type ${otherTypes[i - 20]}`;
          baseCase.hpvLowRiskResult = 'Âm tính';
          baseCase.ketLuan = `DƯƠNG TÍNH VỚI HPV TYPE ${otherTypes[i - 20]} (NGUY CƠ CAO).`;
          baseCase.khuyenNghi = 'Theo dõi sát và kết hợp xét nghiệm tế bào học.';
        } else if (i < 28) {
          const lowTypes = ['6', '11', '6, 11'];
          baseCase.hpvHighRiskResult = 'Âm tính';
          baseCase.hpvHighRiskOtherResult = 'Âm tính';
          baseCase.hpvLowRiskResult = `Dương tính với type ${lowTypes[i - 25]}`;
          baseCase.ketLuan = `DƯƠNG TÍNH VỚI HPV TYPE ${lowTypes[i - 25]} (NGUY CƠ THẤP).`;
          baseCase.khuyenNghi = 'Khám lâm sàng đánh giá tổn thương sùi mào gà sinh dục.';
        } else {
          baseCase.hpvHighRiskResult = 'Dương tính với type 16';
          baseCase.hpvHighRiskOtherResult = 'Dương tính với type 52, 58';
          baseCase.hpvLowRiskResult = 'Dương tính với type 6';
          baseCase.ketLuan = 'ĐA NHIỄM NHIỀU TUÝP HPV NGUY CƠ CAO VÀ NGUY CƠ THẤP.';
          baseCase.khuyenNghi = 'Can thiệp chuyên sâu theo hướng dẫn điều trị ung thư phụ khoa.';
        }
      }

      // C. SOI TƯƠI
      else if (cat === 'soituoi') {
        baseCase.loaiMau = 'Dịch âm đạo';
        baseCase.sampleType = 'Dịch âm đạo';

        if (i < 6) {
          baseCase.soiTuoiBachCau = '-';
          baseCase.soiTuoiNam = '-';
          baseCase.soiTuoiTapKhuan = '-';
          baseCase.soiTuoiTeBaoBieuMo = '++';
          baseCase.soiTuoiTrichomonas = '-';
          baseCase.ketLuan = 'HỆ VI SINH VẬT TRONG GIỚI HẠN BÌNH THƯỜNG';
          baseCase.khuyenNghi = 'Vệ sinh phụ khoa đúng cách, tái khám định kỳ.';
        } else if (i < 12) {
          baseCase.soiTuoiBachCau = '++';
          baseCase.soiTuoiNam = '++';
          baseCase.soiTuoiTapKhuan = '-';
          baseCase.soiTuoiTeBaoBieuMo = '++';
          baseCase.soiTuoiTrichomonas = '-';
          baseCase.soiTuoiGhiChuNam = 'Nhiều tế bào nấm men & sợi tơ nấm giả';
          baseCase.ketLuan = 'VIÊM ÂM ĐẠO DO NẤM (CANDIDA SPP)';
          baseCase.khuyenNghi = 'Đặt thuốc chống nấm và rửa dung dịch vệ sinh chuyên dụng.';
        } else if (i < 18) {
          baseCase.soiTuoiBachCau = '++';
          baseCase.soiTuoiNam = '-';
          baseCase.soiTuoiTapKhuan = '+++';
          baseCase.soiTuoiTeBaoBieuMo = '+';
          baseCase.soiTuoiTrichomonas = '-';
          baseCase.soiTuoiGhiChuTapKhuan = 'Nhiều trực khuẩn Gram âm';
          baseCase.ketLuan = 'VIÊM ÂM ĐẠO DO TẠP KHUẨN (BACTERIAL VAGINOSIS)';
          baseCase.khuyenNghi = 'Điều trị kháng sinh đặc hiệu đường uống hoặc đặt âm đạo.';
        } else if (i < 23) {
          baseCase.soiTuoiBachCau = '+++';
          baseCase.soiTuoiNam = '-';
          baseCase.soiTuoiTapKhuan = '++';
          baseCase.soiTuoiTeBaoBieuMo = '+';
          baseCase.soiTuoiTrichomonas = '+';
          baseCase.soiTuoiGhiChuTrichomonas = 'Phát hiện trùng roi hoạt động';
          baseCase.ketLuan = 'VIÊM ÂM ĐẠO DO TRÙNG ROI (TRICHOMONAS VAGINALIS)';
          baseCase.khuyenNghi = 'Điều trị đồng thời cả bạn tình để tránh tái nhiễm.';
        } else if (i < 28) {
          baseCase.soiTuoiBachCau = '+++';
          baseCase.soiTuoiNam = '++';
          baseCase.soiTuoiTapKhuan = '+++';
          baseCase.soiTuoiTeBaoBieuMo = '++';
          baseCase.soiTuoiTrichomonas = '-';
          baseCase.ketLuan = 'VIÊM ÂM ĐẠO HỖN HỢP DO NẤM VÀ TẠP KHUẨN';
          baseCase.khuyenNghi = 'Điều trị phối hợp kháng nấm và kháng khuẩn.';
        } else {
          baseCase.soiTuoiBachCau = '+';
          baseCase.soiTuoiNam = '-';
          baseCase.soiTuoiTapKhuan = '-';
          baseCase.soiTuoiTeBaoBieuMo = 'Ít';
          baseCase.soiTuoiTrichomonas = '-';
          baseCase.ketLuan = 'HÌNH ẢNH VIÊM TEO NIÊM MẠC ÂM ĐẠO';
          baseCase.khuyenNghi = 'Bổ sung nội tiết tại chỗ theo chỉ định bác sĩ.';
        }
      }

      // D. GIẢI PHẪU BỆNH (GPB), MÔ BỆNH & TẾ BÀO HỌC
      else if (cat === 'giaiphaubenh' || cat === 'giaiphaubenh_mobenh' || cat === 'giaiphaubenh_tebaohoc') {
        baseCase.loaiMau = 'Bệnh phẩm sinh thiết / Phẫu thuật';
        baseCase.sampleType = 'Bệnh phẩm sinh thiết / Phẫu thuật';
        baseCase.anhGpb = imgDataUri;
        baseCase.anhTeBao = imgDataUri;

        const gpbScenarios = [
          {
            viTri: 'Cổ tử cung',
            daiThe: '01 mảnh mô màu trắng xám, kích thước 0.3 x 0.2 x 0.2 cm.',
            viThe: 'Niêm mạc cổ tử cung phủ biểu mô lát tầng có hiện tượng tăng sinh tế bào vảy lành tính, mô đệm thâm nhiễm tế bào viêm mạn tính.',
            ketLuan: 'Viêm cổ tử cung mạn tính, tăng sinh biểu mô lành tính.',
          },
          {
            viTri: 'Thực quản',
            daiThe: '02 mảnh sinh thiết màu hồng nhạt, đường kính mỗi mảnh khoảng 0.2 cm.',
            viThe: 'Niêm mạc thực quản có u tạo bởi các cấu trúc nhú phủ biểu mô vảy nhân nhỏ, đều. Không thấy loạn sản hay ác tính.',
            ketLuan: 'U nhú biểu mô vảy lành tính thực quản.',
          },
          {
            viTri: 'Dạ dày',
            daiThe: '03 mảnh sinh thiết hang vị dạ dày, màu nâu xám.',
            viThe: 'Niêm mạc hang vị dạ dày có hiện tượng teo tuyến nhẹ, thâm nhiễm lympho bào ở lớp đệm, vi khuẩn Helicobacter pylori (+).',
            ketLuan: 'Viêm teo niêm mạc dạ dày mạn tính, HP dương tính.',
          },
          {
            viTri: 'Đại tràng',
            daiThe: '01 bệnh phẩm polyp có cuống, kích thước 0.8 x 0.6 x 0.5 cm.',
            viThe: 'Polyp cấu tạo bởi các ống tuyến tăng sinh ngoằn ngoèo, nhân tế bào dài phân cực, tăng sắc nhẹ ở đáy.',
            ketLuan: 'Polyp tuyến ống đại tràng nghịch sản grade thấp.',
          },
          {
            viTri: 'Cổ tử cung (Khoét chóp)',
            daiThe: 'Bệnh phẩm khoét chóp cổ tử cung hình nón, đường kính 2.0 cm.',
            viThe: 'Tế bào biểu mô vảy nhân quái, tăng sắc chiếm 2/3 dưới chiều dày biểu mô. Màng đáy còn nguyên vẹn.',
            ketLuan: 'Tổn thương nội mô vảy grade cao (HSIL / CIN II), diện cắt an toàn.',
          },
          {
            viTri: 'Tuyến vú',
            daiThe: '01 khối u ranh giới rõ màu trắng đục, kích thước 2.5 x 2.0 cm.',
            viThe: 'U cấu tạo bởi sự tăng sinh hỗn hợp của thành phần biểu mô tuyến vú và mô đệm sợi collagen.',
            ketLuan: 'U xơ tuyến vú lành tính (Fibroadenoma).',
          },
        ];

        const sc = gpbScenarios[i % gpbScenarios.length];
        baseCase.viTriBenhPham = sc.viTri;
        baseCase.daiThe = sc.daiThe;
        baseCase.viThe = sc.viThe;
        baseCase.ketLuan = sc.ketLuan;
        baseCase.khuyenNghi = 'Khám lại và theo dõi theo lịch hẹn chuyên khoa.';
      }

      // E. CÁC GÓI COMBO
      else if (cat.startsWith('combo_')) {
        baseCase.anhTeBao = imgDataUri;
        baseCase.hienBieuDo = true;
        baseCase.bacSiDoc = doc1Obj.fullName;
        baseCase.bacSiDocUsername = doc1Obj.code;
        baseCase.bacSiDocId = String(doc1Obj._id || '');
        baseCase.bacSiDoc2 = doc2Obj.fullName;
        baseCase.bacSiDoc2Username = doc2Obj.code;
        baseCase.bacSiDoc2Id = String(doc2Obj._id || '');
        baseCase.doctorName = doc1Obj.fullName;
        baseCase.daKy2 = daKy;
        baseCase.ngayXetNghiem2 = ngayTra;

        // Trang 1: HPV
        if (i < 10) {
          baseCase.hpvHighRiskResult = 'Âm tính';
          baseCase.hpvHighRiskOtherResult = 'Âm tính';
          baseCase.hpvLowRiskResult = 'Âm tính';
          baseCase.ketLuan = 'ÂM TÍNH VỚI VIRUS HPV TRÊN MẪU KHẢO SÁT.';
        } else if (i < 20) {
          baseCase.hpvHighRiskResult = 'Dương tính với type 16';
          baseCase.hpvHighRiskOtherResult = 'Âm tính';
          baseCase.hpvLowRiskResult = 'Âm tính';
          baseCase.ketLuan = 'DƯƠNG TÍNH VỚI HPV TYPE 16 (NGUY CƠ CAO).';
        } else {
          baseCase.hpvHighRiskResult = 'Dương tính với type 18, 58';
          baseCase.hpvHighRiskOtherResult = 'Âm tính';
          baseCase.hpvLowRiskResult = 'Dương tính với type 6';
          baseCase.ketLuan = 'ĐA NHIỄM HPV NHÓM NGUY CƠ CAO VÀ NGUY CƠ THẤP.';
        }

        // Trang 2: Tế bào học
        if (i < 15) {
          baseCase.khongTonThuong = 'true';
          baseCase.ketLuan2 = 'KHÔNG CÓ TỔN THƯƠNG TRONG BIỂU MÔ HAY ÁC TÍNH (NILM).';
        } else if (i < 23) {
          baseCase.bienDoiKhac = 'viem';
          baseCase.ketLuan2 = 'TẾ BÀO BIẾN ĐỔI DO VIÊM PHỤ KHOA.';
        } else {
          baseCase.batThuongVay = 'lsil';
          baseCase.ketLuan2 = 'TỔN THƯƠNG TRONG BIỂU MÔ VẢY GRADE THẤP (LSIL).';
        }

        baseCase.khuyenNghi = 'Theo dõi chuyên khoa Phụ sản định kỳ 6 tháng.';
      }

      newCases.push(baseCase);
    }
  }

  // Nạp toàn bộ 390 ca vào MongoDB
  console.log(`Đang nạp ${newCases.length} ca vào CSDL MongoDB...`);
  await CaseModel.insertMany(newCases);
  console.log(`Hoàn thành nạp thành công ${newCases.length} ca xét nghiệm chuẩn!`);

  await mongoose.disconnect();
  console.log('--- Hoàn tất quá trình Seed dữ liệu! ---');
}

seed().catch((err) => {
  console.error('Lỗi khi seed dữ liệu:', err);
  process.exit(1);
});
