import { Injectable, OnModuleInit, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schemas/user.schema.js';
import { Doctor } from './schemas/doctor.schema.js';
import { Source } from './schemas/source.schema.js';
import { MinioService } from '../minio/minio.service.js';
import * as bcrypt from 'bcrypt';

export const STANDARD_DOCTORS = [
  {
    code: 'bacsi_lanh',
    username: 'bacsi_lanh',
    fullName: 'TS.BS Nguyễn Sỹ Lánh',
    donVi: 'Khoa GPB & Tế Bào',
    title: 'Trưởng khoa Giải phẫu bệnh BV Việt Đức',
  },
  {
    code: 'bacsi_duong',
    username: 'bacsi_duong',
    fullName: 'TS . BS Nguyễn Khánh Dương',
    donVi: 'Khoa Tế Bào Học',
    title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
  },
  {
    code: 'bacsi_hung',
    username: 'bacsi_hung',
    fullName: 'BS CK1 PHẠM THẾ HÙNG',
    donVi: 'Khoa Xét Nghiệm - GPB',
    title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
  },
  {
    code: 'bacsi_truc',
    username: 'bacsi_truc',
    fullName: 'BSCK1 . Nguyễn Trung Trực',
    donVi: 'Khoa Tế Bào Học',
    title: '(Bệnh viện K Trung Ương)',
  },
  {
    code: 'bacsi_son',
    username: 'bacsi_son',
    fullName: 'ThS.BSNT Trịnh Ngọc Sơn',
    donVi: 'Khoa Giải Phẫu Bệnh',
    title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
  },
];

export const STANDARD_SOURCES = [
  {
    code: 'lab_phusan',
    username: 'lab_phusan',
    fullName: 'Bệnh Viện Phụ Sản Hà Nội',
    donVi: 'Bệnh Viện Phụ Sản Hà Nội',
    soDienThoai: '0243.8343.181',
    email: 'phusanhanoi@gmail.com',
    diaChi: '929 Đ. La Thành, Ba Đình, Hà Nội',
  },
  {
    code: 'lab_thienduc',
    username: 'lab_thienduc',
    fullName: 'Phòng Khám Thiên Đức',
    donVi: 'Phòng Khám Thiên Đức',
    soDienThoai: '0243.8567.890',
    email: 'pkthienduc@gmail.com',
    diaChi: 'Tô Hiệu, Cầu Giấy, Hà Nội',
  },
  {
    code: 'lab_medilab',
    username: 'lab_medilab',
    fullName: 'Phòng Khám Medilab Hà Nội',
    donVi: 'medilab',
    soDienThoai: '0983.597.928',
    email: 'medilabhanoi@gmail.com',
    diaChi: 'Hai Bà Trưng, Hà Nội',
  },
  {
    code: 'lab_dhqy',
    username: 'lab_dhqy',
    fullName: 'Bệnh Viện Đại Học Y Hà Nội',
    donVi: 'Bệnh Viện Đại Học Y Hà Nội',
    soDienThoai: '0243.5747.788',
    email: 'benhvientrunguong@dhyhn.edu.vn',
    diaChi: '1 Tôn Thất Tùng, Đống Đa, Hà Nội',
  },
  {
    code: 'lab_ngatuho',
    username: 'lab_ngatuho',
    fullName: 'Bệnh Viện Đa Khoa Ngã Tư Hồ',
    donVi: 'Bệnh Viện Đa Khoa Ngã Tư Hồ',
    soDienThoai: '0222.3876.543',
    email: 'bvdangatuho@gmail.com',
    diaChi: 'Thị trấn Hồ, Thuận Thành, Bắc Ninh',
  },
  {
    code: 'lab_sannhibacninh',
    username: 'lab_sannhibacninh',
    fullName: 'Bệnh Viện Sản Nhi Bắc Ninh',
    donVi: 'Bệnh Viện Sản Nhi Bắc Ninh',
    soDienThoai: '0222.3822.115',
    email: 'sannhibacninh@gmail.com',
    diaChi: 'TP. Bắc Ninh, Bắc Ninh',
  },
];

const DEFAULT_CATEGORIES = [
  'cell',
  'thinprep',
  'hpv40',
  'hpv20',
  'hpv23',
  'hpv24',
  'soituoi',
  'giaiphaubenh',
  'combo_hpv20_cell',
  'combo_hpv40_cell',
  'combo_hpv23_cell',
  'combo_hpv20_thinprep',
  'combo_hpv40_thinprep',
  'combo_hpv23_thinprep',
];

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    @InjectModel(Source.name) private sourceModel: Model<Source>,
    private minioService: MinioService,
  ) {}

  async onModuleInit() {
    try {
      // 1. Dọn dẹp tài khoản dư thừa / trùng lặp cũ
      await this.userModel.deleteMany({
        $or: [
          { username: 'bacsi_theduong' },
          { fullName: /THẾ ĐƯƠNG/i },
          { username: 'bacsy' },
          { username: 'bacsi_hùng' },
          { username: 'bacsi_đương' },
          { username: 'bacsi_trực' },
          { fullName: /Văn Trực/i },
        ],
      });
      await this.doctorModel.deleteMany({
        $or: [
          { code: 'bacsi_theduong' },
          { fullName: /THẾ ĐƯƠNG/i },
          { code: 'bacsy' },
          { code: 'bacsi_hùng' },
          { code: 'bacsi_đương' },
          { code: 'bacsi_trực' },
        ],
      });

      // 2. Khởi tạo tài khoản Super Admin riêng biệt và các tài khoản Admin thường
      const pass210577 = await bcrypt.hash('210577', 10);
      const pass123456 = await bcrypt.hash('123456', 10);

      // Superadmin duy nhất có quyền Cài đặt & Quản trị tài khoản
      let superAdmin = await this.userModel.findOne({ username: 'superadmin' });
      if (!superAdmin) {
        await this.userModel.create({
          username: 'superadmin',
          password: pass210577,
          passwordHint: '210577',
          fullName: 'Super Administrator',
          role: 'superadmin',
          donVi: 'Ban Giám Đốc GenHD',
          allowedCategories: DEFAULT_CATEGORIES,
          isActive: true,
        });
      } else {
        superAdmin.role = 'superadmin';
        superAdmin.passwordHint = '210577';
        superAdmin.isActive = true;
        await superAdmin.save();
      }

      // Admin phòng Lab (role: admin thường - KHÔNG CÓ QUYỀN CÀI ĐẶT)
      let adminLab = await this.userModel.findOne({ username: 'admin_lab' });
      if (!adminLab) {
        await this.userModel.create({
          username: 'admin_lab',
          password: pass210577,
          passwordHint: '210577',
          fullName: 'Admin phòng Lab GenHD',
          role: 'admin',
          donVi: 'Trung tâm GenHD',
          allowedCategories: DEFAULT_CATEGORIES,
          isActive: true,
        });
      } else {
        adminLab.role = 'admin';
        adminLab.passwordHint = '210577';
        adminLab.isActive = true;
        await adminLab.save();
      }

      // Admin hệ thống (role: admin thường - KHÔNG CÓ QUYỀN CÀI ĐẶT)
      let normalAdmin = await this.userModel.findOne({ username: 'admin' });
      if (!normalAdmin) {
        await this.userModel.create({
          username: 'admin',
          password: pass123456,
          passwordHint: '123456',
          fullName: 'Admin Hệ Thống',
          role: 'admin',
          donVi: 'Quản trị Lab',
          allowedCategories: DEFAULT_CATEGORIES,
          isActive: true,
        });
      } else {
        normalAdmin.role = 'admin';
        normalAdmin.passwordHint = '123456';
        normalAdmin.isActive = true;
        await normalAdmin.save();
      }

      // 3. Đồng bộ 5 Bác sĩ chuẩn vào DoctorModel và liên kết UserModel
      for (const stdDoc of STANDARD_DOCTORS) {
        let doctor = await this.doctorModel.findOne({ code: stdDoc.code });
        // Kiểm tra xem đã có user tương ứng chưa
        let user = await this.userModel.findOne({ username: stdDoc.username });

        if (!doctor) {
          doctor = await this.doctorModel.create({
            code: stdDoc.code,
            fullName: stdDoc.fullName,
            title: stdDoc.title,
            donVi: stdDoc.donVi,
            allowedCategories: DEFAULT_CATEGORIES,
            signatureUrl: user?.signatureUrl || '',
          });
        } else {
          doctor.fullName = stdDoc.fullName;
          doctor.title = stdDoc.title;
          doctor.donVi = stdDoc.donVi;
          if (user?.signatureUrl && !doctor.signatureUrl) {
            doctor.signatureUrl = user.signatureUrl;
          }
          await doctor.save();
        }

        // Đảm bảo user tương ứng tồn tại và có liên kết 2 chiều
        if (!user) {
          user = await this.userModel.create({
            username: stdDoc.username,
            password: pass123456,
            passwordHint: '123456',
            fullName: stdDoc.fullName,
            role: 'doctor',
            title: stdDoc.title,
            donVi: stdDoc.donVi,
            signatureUrl: doctor.signatureUrl || '',
            allowedCategories: DEFAULT_CATEGORIES,
            isActive: true,
            doctorId: doctor._id as any,
          });
        } else {
          user.doctorId = doctor._id as any;
          user.role = 'doctor';
          user.title = stdDoc.title;
          user.donVi = stdDoc.donVi;
          if (!user.passwordHint) user.passwordHint = '123456';
          await user.save();
        }

        doctor.userId = user._id as any;
        await doctor.save();
      }

      // 4. Đồng bộ các Nguồn chuẩn vào SourceModel và liên kết UserModel
      for (const stdSrc of STANDARD_SOURCES) {
        let source = await this.sourceModel.findOne({ code: stdSrc.code });
        let user = await this.userModel.findOne({ username: stdSrc.username });

        if (!source) {
          source = await this.sourceModel.create({
            code: stdSrc.code,
            fullName: stdSrc.fullName,
            donVi: stdSrc.donVi,
            soDienThoai: stdSrc.soDienThoai,
            email: stdSrc.email,
            diaChi: stdSrc.diaChi,
            allowedCategories: DEFAULT_CATEGORIES,
          });
        }

        if (!user) {
          user = await this.userModel.create({
            username: stdSrc.username,
            password: pass123456,
            passwordHint: '123456',
            fullName: stdSrc.fullName,
            role: 'lab',
            donVi: stdSrc.donVi,
            soDienThoai: stdSrc.soDienThoai,
            email: stdSrc.email,
            diaChi: stdSrc.diaChi,
            allowedCategories: DEFAULT_CATEGORIES,
            isActive: true,
            sourceId: source._id as any,
          });
        } else {
          user.sourceId = source._id as any;
          user.role = 'lab';
          if (!user.passwordHint) user.passwordHint = '123456';
          await user.save();
        }

        source.userId = user._id as any;
        await source.save();
      }

      // 5. TỰ ĐỘNG ĐỒNG BỘ 100% (SELF-HEALING): TẤT CẢ USER ROLE DOCTOR -> DOCTOR MASTER DATA
      const allDoctorUsers = await this.userModel.find({ role: { $in: ['doctor', 'bacsy'] } }).exec();
      for (const uDoc of allDoctorUsers) {
        let doctor = uDoc.doctorId ? await this.doctorModel.findById(uDoc.doctorId) : null;
        if (!doctor) {
          doctor = await this.doctorModel.findOne({ code: uDoc.username });
        }
        if (!doctor) {
          doctor = await this.doctorModel.create({
            code: uDoc.username,
            fullName: uDoc.fullName || uDoc.username,
            title: uDoc.title || '',
            donVi: uDoc.donVi || '',
            soDienThoai: uDoc.soDienThoai || '',
            email: uDoc.email || '',
            signatureUrl: uDoc.signatureUrl || '',
            allowedCategories: uDoc.allowedCategories || DEFAULT_CATEGORIES,
            userId: uDoc._id as any,
          });
          console.log(`[UsersService] Tự động tạo hồ sơ Bác sĩ '${doctor.fullName}' (${doctor.code}) từ tài khoản User!`);
        }
        if (!uDoc.doctorId || String(uDoc.doctorId) !== String(doctor._id)) {
          uDoc.doctorId = doctor._id as any;
          await uDoc.save();
        }
        if (!doctor.userId || String(doctor.userId) !== String(uDoc._id)) {
          doctor.userId = uDoc._id as any;
          await doctor.save();
        }
      }

      // 6. TỰ ĐỘNG ĐỒNG BỘ 100% (SELF-HEALING): TẤT CẢ USER ROLE LAB -> SOURCE MASTER DATA
      const allSourceUsers = await this.userModel.find({ role: 'lab' }).exec();
      for (const uSrc of allSourceUsers) {
        let source = uSrc.sourceId ? await this.sourceModel.findById(uSrc.sourceId) : null;
        if (!source) {
          source = await this.sourceModel.findOne({ code: uSrc.username });
        }
        if (!source) {
          source = await this.sourceModel.create({
            code: uSrc.username,
            fullName: uSrc.fullName || uSrc.username,
            donVi: uSrc.donVi || uSrc.fullName || uSrc.username,
            soDienThoai: uSrc.soDienThoai || '',
            email: uSrc.email || '',
            diaChi: uSrc.diaChi || '',
            allowedCategories: uSrc.allowedCategories || DEFAULT_CATEGORIES,
            userId: uSrc._id as any,
          });
          console.log(`[UsersService] Tự động tạo hồ sơ Nguồn/Đơn vị '${source.fullName}' (${source.code}) từ tài khoản User!`);
        }
        if (!uSrc.sourceId || String(uSrc.sourceId) !== String(source._id)) {
          uSrc.sourceId = source._id as any;
          await uSrc.save();
        }
        if (!source.userId || String(source.userId) !== String(uSrc._id)) {
          source.userId = uSrc._id as any;
          await source.save();
        }
      }

      // Đảm bảo 100% tất cả Bác sĩ, Nguồn và User trong CSDL đều có dịch vụ 'hpv24'
      await Promise.all([
        this.doctorModel.updateMany({}, { $addToSet: { allowedCategories: 'hpv24' } }),
        this.sourceModel.updateMany({}, { $addToSet: { allowedCategories: 'hpv24' } }),
        this.userModel.updateMany({}, { $addToSet: { allowedCategories: 'hpv24' } }),
      ]);

      console.log('[UsersService] Tự động đồng bộ 100% thành công Bác sĩ, Nguồn & Tài khoản trong CSDL!');
    } catch (err) {
      console.error('[UsersService] Lỗi khởi tạo onModuleInit:', err);
    }
  }

  // ==========================================
  // AUTH HELPER METHODS
  // ==========================================
  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  // ==========================================
  // 1. QUẢN LÝ DANH SÁCH BÁC SĨ (DOCTOR MASTER DATA)
  // ==========================================
  async getAllDoctors(): Promise<any[]> {
    const doctors = await this.doctorModel.find().sort({ createdAt: 1 }).lean().exec();
    const doctorIds = doctors.map((d) => d._id);
    const users = await this.userModel.find({ doctorId: { $in: doctorIds } }).lean().exec();
    const userMap = new Map<string, any>();
    users.forEach((u) => {
      if (u.doctorId) userMap.set(String(u.doctorId), u);
    });

    return doctors.map((d) => {
      const linkedUser = userMap.get(String(d._id));
      return {
        ...d,
        hasAccount: !!linkedUser,
        username: linkedUser?.username || d.code || '',
        accountActive: linkedUser ? linkedUser.isActive !== false : false,
        passwordHint: linkedUser?.passwordHint || '123456',
      };
    });
  }

  async findDoctors(): Promise<any[]> {
    // Dành cho việc hiển thị dropdown chọn bác sĩ đọc trên ca bệnh
    return this.doctorModel.find().sort({ fullName: 1 }).lean().exec();
  }

  async getDoctorInfo(doctorNameOrCode: string): Promise<{ fullName: string; title: string; signatureUrl: string | null } | null> {
    if (!doctorNameOrCode) return null;
    const cleanName = doctorNameOrCode.trim();
    if (!cleanName || cleanName === 'Chưa phân loại') return null;

    // 1. Tìm chính xác theo code hoặc fullName trong DoctorModel
    let doctor = await this.doctorModel
      .findOne({
        $or: [
          { code: cleanName },
          { fullName: cleanName },
          { fullName: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        ],
      })
      .lean()
      .exec();

    // 2. Fuzzy match
    if (!doctor) {
      const coreName = cleanName
        .replace(/^(BSCK\d+|BSCKI|BSCKII|TS|BS|ThS|BSNT|PGS|GS|[.\s])+/gi, '')
        .trim();
      if (coreName.length >= 3) {
        doctor = await this.doctorModel
          .findOne({
            fullName: new RegExp(coreName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
          })
          .lean()
          .exec();
      }
    }

    if (!doctor) {
      // 3. Fallback match against STANDARD_DOCTORS
      const matchStd = STANDARD_DOCTORS.find(
        (d) =>
          d.code === cleanName ||
          d.username === cleanName ||
          d.fullName.toLowerCase() === cleanName.toLowerCase() ||
          cleanName.toLowerCase().includes(d.fullName.toLowerCase().replace(/^(ts|bs|bsck\d+|ths|bsnt|[.\s])+/gi, '').trim()),
      );
      if (matchStd) {
        return {
          fullName: matchStd.fullName,
          title: matchStd.title,
          signatureUrl: null,
        };
      }
      return null;
    }

    return {
      fullName: doctor.fullName || cleanName,
      title: doctor.title || '',
      signatureUrl: doctor.signatureUrl || null,
    };
  }

  async getDoctorSignature(doctorNameOrCode: string): Promise<string | null> {
    const info = await this.getDoctorInfo(doctorNameOrCode);
    return info?.signatureUrl || null;
  }

  async createDoctor(data: any): Promise<Doctor> {
    const code = (data.code || data.username || `bacsi_${Date.now()}`).trim();
    const existingDoc = await this.doctorModel.findOne({ code });
    if (existingDoc) {
      throw new BadRequestException(`Mã bác sĩ hoặc tên đăng nhập '${code}' đã tồn tại!`);
    }

    const doctor = await this.doctorModel.create({
      code,
      fullName: data.fullName,
      title: data.title || '',
      donVi: data.donVi || '',
      soDienThoai: data.soDienThoai || '',
      email: data.email || '',
      chungChiHanhNghe: data.chungChiHanhNghe || '',
      allowedCategories: data.allowedCategories || DEFAULT_CATEGORIES,
      signatureUrl: data.signatureUrl || '',
    });

    // TỰ ĐỘNG CẤP TÀI KHOẢN ĐĂNG NHẬP MẶC ĐỊNH
    const existingUser = await this.userModel.findOne({ username: code });
    if (!existingUser) {
      const defaultPass = await bcrypt.hash('123456', 10);
      const newUser = await this.userModel.create({
        username: code,
        password: defaultPass,
        passwordHint: '123456',
        fullName: doctor.fullName,
        role: 'doctor',
        title: doctor.title,
        donVi: doctor.donVi,
        signatureUrl: doctor.signatureUrl,
        allowedCategories: doctor.allowedCategories,
        isActive: true,
        doctorId: doctor._id as any,
      });
      doctor.userId = newUser._id as any;
      await doctor.save();
    } else {
      existingUser.doctorId = doctor._id as any;
      await existingUser.save();
      doctor.userId = existingUser._id as any;
      await doctor.save();
    }

    return doctor;
  }

  async updateDoctor(id: string, data: any): Promise<Doctor | null> {
    const doctor = await this.doctorModel.findById(id);
    if (!doctor) return null;

    if (data.fullName) doctor.fullName = data.fullName;
    if (data.title !== undefined) doctor.title = data.title;
    if (data.donVi !== undefined) doctor.donVi = data.donVi;
    if (data.soDienThoai !== undefined) doctor.soDienThoai = data.soDienThoai;
    if (data.email !== undefined) doctor.email = data.email;
    if (data.chungChiHanhNghe !== undefined) doctor.chungChiHanhNghe = data.chungChiHanhNghe;
    if (data.allowedCategories) doctor.allowedCategories = data.allowedCategories;
    if (data.signatureUrl !== undefined) doctor.signatureUrl = data.signatureUrl;

    await doctor.save();

    // Đồng bộ sang tài khoản đăng nhập nếu có liên kết
    if (doctor.userId) {
      await this.userModel.findByIdAndUpdate(doctor.userId, {
        $set: {
          fullName: doctor.fullName,
          title: doctor.title,
          donVi: doctor.donVi,
          signatureUrl: doctor.signatureUrl,
          allowedCategories: doctor.allowedCategories,
        },
      });
    }

    return doctor;
  }

  async uploadSignature(id: string, fileBuffer: Buffer, mimeType: string, ext: string): Promise<Doctor | null> {
    const doctor = await this.doctorModel.findById(id);
    if (!doctor) return null;

    if (doctor.signatureUrl) {
      try {
        await this.minioService.deleteFile(doctor.signatureUrl);
      } catch (e) {}
    }

    const objectKey = `signatures/doctor_${doctor.code}_${Date.now()}.${ext}`;
    const signatureUrl = await this.minioService.uploadFile(fileBuffer, objectKey, mimeType);

    doctor.signatureUrl = signatureUrl;
    await doctor.save();

    // Cập nhật cả user nếu có liên kết
    if (doctor.userId) {
      await this.userModel.findByIdAndUpdate(doctor.userId, { $set: { signatureUrl } });
    }

    return doctor;
  }

  async deleteSignature(id: string): Promise<Doctor | null> {
    const doctor = await this.doctorModel.findById(id);
    if (!doctor) return null;

    if (doctor.signatureUrl) {
      try {
        await this.minioService.deleteFile(doctor.signatureUrl);
      } catch (e) {}
    }

    doctor.signatureUrl = '';
    await doctor.save();

    if (doctor.userId) {
      await this.userModel.findByIdAndUpdate(doctor.userId, { $set: { signatureUrl: '' } });
    }

    return doctor;
  }

  async deleteDoctor(id: string): Promise<boolean> {
    const doctor = await this.doctorModel.findById(id);
    if (!doctor) return false;

    // QUY TẮC XÓA 1 CHIỀU: Xóa bác sĩ -> Tự động xóa luôn tài khoản đăng nhập tương ứng!
    await this.userModel.deleteMany({
      $or: [{ doctorId: doctor._id }, { username: doctor.code }],
    });

    if (doctor.signatureUrl) {
      try {
        await this.minioService.deleteFile(doctor.signatureUrl);
      } catch (e) {}
    }

    await this.doctorModel.findByIdAndDelete(id);
    return true;
  }

  // ==========================================
  // 2. QUẢN LÝ DANH SÁCH NGUỒN GỬI MẪU (SOURCE MASTER DATA)
  // ==========================================
  async getAllSources(): Promise<any[]> {
    const sources = await this.sourceModel.find().sort({ createdAt: 1 }).lean().exec();
    const sourceIds = sources.map((s) => s._id);
    const users = await this.userModel.find({ sourceId: { $in: sourceIds } }).lean().exec();
    const userMap = new Map<string, any>();
    users.forEach((u) => {
      if (u.sourceId) userMap.set(String(u.sourceId), u);
    });

    return sources.map((s) => {
      const linkedUser = userMap.get(String(s._id));
      return {
        ...s,
        hasAccount: !!linkedUser,
        username: linkedUser?.username || s.code || '',
        accountActive: linkedUser ? linkedUser.isActive !== false : false,
        passwordHint: linkedUser?.passwordHint || '123456',
      };
    });
  }

  async createSource(data: any): Promise<Source> {
    const code = (data.code || data.username || `lab_${Date.now()}`).trim();
    const existingSrc = await this.sourceModel.findOne({ code });
    if (existingSrc) {
      throw new BadRequestException(`Mã đơn vị hoặc tên đăng nhập '${code}' đã tồn tại!`);
    }

    const source = await this.sourceModel.create({
      code,
      fullName: data.fullName,
      donVi: data.donVi || data.fullName,
      soDienThoai: data.soDienThoai || '',
      email: data.email || '',
      diaChi: data.diaChi || '',
      allowedCategories: data.allowedCategories || DEFAULT_CATEGORIES,
    });

    // TỰ ĐỘNG CẤP TÀI KHOẢN ĐĂNG NHẬP MẶC ĐỊNH
    const existingUser = await this.userModel.findOne({ username: code });
    if (!existingUser) {
      const defaultPass = await bcrypt.hash('123456', 10);
      const newUser = await this.userModel.create({
        username: code,
        password: defaultPass,
        passwordHint: '123456',
        fullName: source.fullName,
        role: 'lab',
        donVi: source.donVi,
        soDienThoai: source.soDienThoai,
        email: source.email,
        diaChi: source.diaChi,
        allowedCategories: source.allowedCategories,
        isActive: true,
        sourceId: source._id as any,
      });
      source.userId = newUser._id as any;
      await source.save();
    } else {
      existingUser.sourceId = source._id as any;
      await existingUser.save();
      source.userId = existingUser._id as any;
      await source.save();
    }

    return source;
  }

  async updateSource(id: string, data: any): Promise<Source | null> {
    const source = await this.sourceModel.findById(id);
    if (!source) return null;

    if (data.fullName) source.fullName = data.fullName;
    if (data.donVi !== undefined) source.donVi = data.donVi;
    if (data.soDienThoai !== undefined) source.soDienThoai = data.soDienThoai;
    if (data.email !== undefined) source.email = data.email;
    if (data.diaChi !== undefined) source.diaChi = data.diaChi;
    if (data.allowedCategories) source.allowedCategories = data.allowedCategories;

    await source.save();

    if (source.userId) {
      await this.userModel.findByIdAndUpdate(source.userId, {
        $set: {
          fullName: source.fullName,
          donVi: source.donVi,
          soDienThoai: source.soDienThoai,
          email: source.email,
          diaChi: source.diaChi,
        },
      });
    }

    return source;
  }

  async deleteSource(id: string): Promise<boolean> {
    const source = await this.sourceModel.findById(id);
    if (!source) return false;

    // QUY TẮC XÓA 1 CHIỀU: Xóa nguồn -> Tự động xóa luôn tài khoản tương ứng!
    await this.userModel.deleteMany({
      $or: [{ sourceId: source._id }, { username: source.code }],
    });

    await this.sourceModel.findByIdAndDelete(id);
    return true;
  }

  // ==========================================
  // 3. QUẢN LÝ TÀI KHOẢN ĐĂNG NHẬP (ACCOUNTS - SUPERADMIN)
  // ==========================================
  async getAllAccounts(): Promise<any[]> {
    const users = await this.userModel
      .find()
      .select('-password')
      .populate('doctorId', 'fullName title code signatureUrl')
      .populate('sourceId', 'fullName donVi code')
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    return users.map((u) => ({
      _id: u._id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive !== false,
      passwordHint: u.passwordHint || '123456',
      donVi: u.donVi || '',
      createdAt: (u as any).createdAt,
      doctorId: u.doctorId,
      sourceId: u.sourceId,
    }));
  }

  async createAccount(data: any): Promise<User> {
    const { username, password, role, fullName, doctorId, sourceId } = data;

    if (!username || !username.trim()) {
      throw new BadRequestException('Vui lòng nhập Tên đăng nhập');
    }

    const cleanUsername = username.trim();
    const existing = await this.userModel.findOne({ username: cleanUsername });
    if (existing) {
      throw new BadRequestException(`Tên đăng nhập '${cleanUsername}' đã tồn tại!`);
    }

    const rawPassword = (password && password.trim()) || '123456';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    let docObj: Doctor | null = null;
    let srcObj: Source | null = null;
    let accountFullName = (fullName || '').trim();

    // RÀNG BUỘC CHẶT CHẼ: Chỉ được thêm tài khoản cho Bác sĩ hoặc Nguồn đang có sẵn
    if (role === 'doctor') {
      if (!doctorId) {
        throw new BadRequestException('Vui lòng chọn Bác sĩ trong danh sách để cấp tài khoản!');
      }
      docObj = await this.doctorModel.findById(doctorId);
      if (!docObj) {
        throw new NotFoundException('Không tìm thấy thông tin Bác sĩ được chỉ định!');
      }
      if (docObj.userId) {
        const existingLinked = await this.userModel.findById(docObj.userId);
        if (existingLinked) {
          throw new BadRequestException(`Bác sĩ '${docObj.fullName}' đã có tài khoản (${existingLinked.username})!`);
        }
      }
      accountFullName = docObj.fullName;
    } else if (role === 'lab') {
      if (!sourceId) {
        throw new BadRequestException('Vui lòng chọn Nguồn / Đơn vị trong danh sách để cấp tài khoản!');
      }
      srcObj = await this.sourceModel.findById(sourceId);
      if (!srcObj) {
        throw new NotFoundException('Không tìm thấy thông tin Đơn vị được chỉ định!');
      }
      if (srcObj.userId) {
        const existingLinked = await this.userModel.findById(srcObj.userId);
        if (existingLinked) {
          throw new BadRequestException(`Đơn vị '${srcObj.fullName}' đã có tài khoản (${existingLinked.username})!`);
        }
      }
      accountFullName = srcObj.fullName;
    } else if (role === 'admin') {
      if (!accountFullName) {
        throw new BadRequestException('Vui lòng nhập Họ tên quản trị viên!');
      }
    } else {
      throw new BadRequestException('Vai trò không hợp lệ!');
    }

    const newUser = await this.userModel.create({
      username: cleanUsername,
      password: hashedPassword,
      passwordHint: rawPassword,
      fullName: accountFullName,
      role: role || 'doctor',
      title: docObj?.title || '',
      donVi: docObj?.donVi || srcObj?.donVi || '',
      signatureUrl: docObj?.signatureUrl || '',
      allowedCategories: docObj?.allowedCategories || srcObj?.allowedCategories || DEFAULT_CATEGORIES,
      isActive: true,
      doctorId: docObj ? (docObj._id as any) : null,
      sourceId: srcObj ? (srcObj._id as any) : null,
    });

    if (docObj) {
      docObj.userId = newUser._id as any;
      await docObj.save();
    }
    if (srcObj) {
      srcObj.userId = newUser._id as any;
      await srcObj.save();
    }

    return newUser;
  }

  async toggleAccountActive(id: string): Promise<boolean> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản');
    }
    if (user.role === 'superadmin' && user.isActive) {
      throw new BadRequestException('Không thể tạm khóa tài khoản Super Admin!');
    }

    user.isActive = !user.isActive;
    await user.save();
    return user.isActive;
  }

  async updateAccount(id: string, data: any): Promise<User | null> {
    const user = await this.userModel.findById(id);
    if (!user) return null;

    // 1. Cập nhật username (nếu đổi)
    if (data.username && data.username.trim() && data.username.trim() !== user.username) {
      const cleanUsername = data.username.trim();
      const existing = await this.userModel.findOne({ username: cleanUsername });
      if (existing) {
        throw new BadRequestException(`Tên đăng nhập '${cleanUsername}' đã tồn tại!`);
      }
      user.username = cleanUsername;

      // Đồng bộ code sang Doctor hoặc Source nếu có
      if (user.doctorId) {
        await this.doctorModel.findByIdAndUpdate(user.doctorId, { $set: { code: cleanUsername } });
      }
      if (user.sourceId) {
        await this.sourceModel.findByIdAndUpdate(user.sourceId, { $set: { code: cleanUsername } });
      }
    }

    // 2. Cập nhật FullName / Tên người dùng / Tên Đơn vị
    if (data.fullName && data.fullName.trim()) {
      user.fullName = data.fullName.trim();
      // Đồng bộ sang Doctor hoặc Source nếu có
      if (user.doctorId) {
        await this.doctorModel.findByIdAndUpdate(user.doctorId, { $set: { fullName: user.fullName } });
      }
      if (user.sourceId) {
        await this.sourceModel.findByIdAndUpdate(user.sourceId, { $set: { fullName: user.fullName } });
      }
    }

    // 3. Cập nhật Vai trò
    if (data.role && data.role !== user.role) {
      if (user.role === 'superadmin') {
        throw new BadRequestException('Không thể thay đổi vai trò của tài khoản Super Admin!');
      }
      user.role = data.role;
    }

    // 4. Cập nhật Trạng thái hoạt động
    if (data.isActive !== undefined) {
      if (user.role === 'superadmin' && !data.isActive) {
        throw new BadRequestException('Không thể khóa tài khoản Super Admin!');
      }
      user.isActive = data.isActive;
    }

    // 5. Cập nhật Mật khẩu
    if (data.password && data.password.trim()) {
      user.password = await bcrypt.hash(data.password.trim(), 10);
      user.passwordHint = data.password.trim();
    }

    await user.save();
    return user;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const user = await this.userModel.findById(id);
    if (!user) return false;

    if (user.role === 'superadmin') {
      throw new BadRequestException('Không thể xóa tài khoản Super Admin!');
    }

    // QUY TẮC XÓA 1 CHIỀU:
    // Xóa bên Quản lý Tài khoản thì danh sách Bác sĩ / Nguồn KHÔNG BỊ ẢNH HƯỞNG!
    // Chỉ hủy liên kết userId trên Bác sĩ hoặc Nguồn
    if (user.doctorId) {
      await this.doctorModel.findByIdAndUpdate(user.doctorId, { $set: { userId: null } });
    }
    if (user.sourceId) {
      await this.sourceModel.findByIdAndUpdate(user.sourceId, { $set: { userId: null } });
    }

    await this.userModel.findByIdAndDelete(id);
    return true;
  }
}
