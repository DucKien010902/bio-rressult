import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const mongoUri =
  process.env.MONGO_URI ||
  'mongodb+srv://DucKien:kien010902@cluster0.4l1lzw3.mongodb.net/bio-result?retryWrites=true&w=majority&appName=Cluster0';

// User Schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, enum: ['admin', 'bacsy', 'lab'], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// BioCase Schema
const bioCaseSchema = new mongoose.Schema(
  {
    patientCode: { type: String, required: true, unique: true },
    patientName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Nam', 'Nữ', 'Khác'], required: true },
    testType: { type: String, required: true },
    sampleDate: { type: String, required: true },
    sampleType: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'tested', 'diagnosed'],
      default: 'pending',
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
    diagnosis: { type: String, default: '' },
    doctorNotes: { type: String, default: '' },
    technicianName: { type: String, default: '' },
    doctorName: { type: String, default: '' },
  },
  { timestamps: true, collection: 'biocases' },
);

const UserModel = mongoose.model('User', userSchema, 'users');
const CaseModel = mongoose.model('BioCase', bioCaseSchema, 'biocases');

async function seed() {
  console.log('--- Bắt đầu khởi tạo dữ liệu mẫu (Seed Data) ---');
  console.log(`Kết nối MongoDB: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);

  await mongoose.connect(mongoUri);
  console.log('Kết nối MongoDB thành công!');

  // 1. Seed Users
  const defaultPassword = await bcrypt.hash('123456', 10);
  const initialUsers: Array<{
    username: string;
    password: string;
    fullName: string;
    role: 'admin' | 'bacsy' | 'lab';
    isActive: boolean;
  }> = [
    {
      username: 'admin',
      password: defaultPassword,
      fullName: 'Quản trị viên Hệ thống',
      role: 'admin',
      isActive: true,
    },
    {
      username: 'bacsy',
      password: defaultPassword,
      fullName: 'BS. Nguyễn Văn A (Chẩn đoán lâm sàng)',
      role: 'bacsy',
      isActive: true,
    },
    {
      username: 'lab',
      password: defaultPassword,
      fullName: 'KTV. Trần Thị B (Phòng Xét nghiệm Sinh học)',
      role: 'lab',
      isActive: true,
    },
  ];

  for (const item of initialUsers) {
    const existing = await UserModel.findOne({ username: item.username });
    if (existing) {
      existing.fullName = item.fullName;
      existing.password = item.password;
      existing.role = item.role;
      existing.isActive = item.isActive;
      await existing.save();
      console.log(`[Cập nhật User] ${item.username} (${item.role})`);
    } else {
      await UserModel.create(item);
      console.log(`[Tạo mới User] ${item.username} (${item.role})`);
    }
  }

  // 2. Seed Bio Cases
  const sampleCases: any[] = [
    {
      patientCode: 'BN-2026-001',
      patientName: 'Lê Hoàng Nam',
      age: 48,
      gender: 'Nam',
      testType: 'Giải trình tự gen EGFR (Ung thư phổi không tế bào nhỏ)',
      sampleDate: '2026-09-07',
      sampleType: 'Mô sinh thiết khối u',
      status: 'tested', // Lab đã có kết quả, chờ bác sĩ kết luận
      labMetrics: [
        {
          name: 'Exon 19 Deletion',
          value: 'Dương tính (Tỉ lệ 34.2%)',
          unit: '%',
          referenceRange: 'Âm tính',
          alert: 'danger',
        },
        {
          name: 'Exon 20 T790M',
          value: 'Âm tính (< 0.1%)',
          unit: '%',
          referenceRange: 'Âm tính',
          alert: 'normal',
        },
        {
          name: 'Exon 21 L858R',
          value: 'Âm tính',
          unit: '%',
          referenceRange: 'Âm tính',
          alert: 'normal',
        },
        {
          name: 'Độ bao phủ trình tự gen (Coverage)',
          value: '1500x',
          unit: 'depth',
          referenceRange: '> 500x',
          alert: 'normal',
        },
      ],
      diagnosis: '',
      doctorNotes: '',
      technicianName: 'KTV. Trần Thị B',
      doctorName: '',
    },
    {
      patientCode: 'BN-2026-002',
      patientName: 'Trần Thị Thu Thảo',
      age: 29,
      gender: 'Nữ',
      testType: 'Sàng lọc dị tật thai nhi không xâm lấn (NIPT 23 cặp NST)',
      sampleDate: '2026-09-05',
      sampleType: 'Máu ngoại vi mẹ (10ml EDTA)',
      status: 'diagnosed', // Đã chẩn đoán hoàn tất
      labMetrics: [
        {
          name: 'Tỷ lệ cffDNA (ADN tự do thai nhi)',
          value: '9.8%',
          unit: '%',
          referenceRange: '> 4.0%',
          alert: 'normal',
        },
        {
          name: 'Trisomy 21 (Hội chứng Down)',
          value: 'Nguy cơ rất thấp (Z-score: -0.12)',
          unit: 'Z-score',
          referenceRange: 'Z < 3.0',
          alert: 'normal',
        },
        {
          name: 'Trisomy 18 (Hội chứng Edwards)',
          value: 'Nguy cơ rất thấp (Z-score: 0.24)',
          unit: 'Z-score',
          referenceRange: 'Z < 3.0',
          alert: 'normal',
        },
        {
          name: 'Trisomy 13 (Hội chứng Patau)',
          value: 'Nguy cơ rất thấp (Z-score: 0.15)',
          unit: 'Z-score',
          referenceRange: 'Z < 3.0',
          alert: 'normal',
        },
      ],
      diagnosis:
        'Thai nhi nguy cơ rất thấp đối với các hội chứng lệch bội phổ biến (Down, Edwards, Patau). Các cặp nhiễm sắc thể còn lại không phát hiện bất thường số lượng lớn.',
      doctorNotes:
        'Khám thai định kỳ theo lịch của bác sĩ sản khoa. Thực hiện siêu âm hình thái thai ở tuần thai 20-22.',
      technicianName: 'KTV. Trần Thị B',
      doctorName: 'BS. Nguyễn Văn A',
    },
    {
      patientCode: 'BN-2026-003',
      patientName: 'Vũ Quốc Anh',
      age: 7,
      gender: 'Nam',
      testType: 'Đột biến gen Tan máu bẩm sinh (Thalassemia alpha & beta)',
      sampleDate: '2026-09-08',
      sampleType: 'Máu toàn phần',
      status: 'pending', // Mới tiếp nhận, chờ lab nhập chỉ số
      labMetrics: [],
      diagnosis: '',
      doctorNotes: '',
      technicianName: '',
      doctorName: '',
    },
    {
      patientCode: 'BN-2026-004',
      patientName: 'Phạm Hồng Nhung',
      age: 35,
      gender: 'Nữ',
      testType: 'Sàng lọc gen di truyền nguy cơ ung thư vú/buồng trứng (BRCA1/BRCA2)',
      sampleDate: '2026-09-06',
      sampleType: 'Máu ngoại vi',
      status: 'tested', // Chờ bác sĩ đọc kết luận
      labMetrics: [
        {
          name: 'BRCA1 (c.68_69delAG)',
          value: 'Không phát hiện đột biến gây bệnh',
          unit: '',
          referenceRange: 'Âm tính',
          alert: 'normal',
        },
        {
          name: 'BRCA2 (c.5946delT)',
          value: 'Phát hiện biến thể ý nghĩa không chắc chắn (VUS)',
          unit: '',
          referenceRange: 'Âm tính',
          alert: 'warning',
        },
      ],
      diagnosis: '',
      doctorNotes: '',
      technicianName: 'KTV. Trần Thị B',
      doctorName: '',
    },
  ];

  for (const c of sampleCases) {
    const existing = await CaseModel.findOne({ patientCode: c.patientCode });
    if (existing) {
      Object.assign(existing, c);
      await existing.save();
      console.log(`[Cập nhật Ca] ${c.patientCode} - ${c.patientName} (${c.status})`);
    } else {
      await CaseModel.create(c);
      console.log(`[Tạo mới Ca] ${c.patientCode} - ${c.patientName} (${c.status})`);
    }
  }

  console.log('--- Hoàn tất Seed dữ liệu ca xét nghiệm & người dùng! ---');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Lỗi khi chạy seed:', err);
  process.exit(1);
});
