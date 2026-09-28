import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema.js';
import { MinioService } from '../minio/minio.service.js';
import * as bcrypt from 'bcrypt';

export const STANDARD_DOCTORS = [
  {
    username: 'bacsi_lanh',
    fullName: 'TS.BS Nguyễn Sỹ Lánh',
    donVi: 'Khoa GPB & Tế Bào',
    title: 'Trưởng khoa Giải phẫu bệnh BV Việt Đức',
    role: 'doctor' as const,
  },
  {
    username: 'bacsi_duong',
    fullName: 'TS . BS Nguyễn Khánh Dương',
    donVi: 'Khoa Tế Bào Học',
    title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
    role: 'doctor' as const,
  },
  {
    username: 'bacsi_hung',
    fullName: 'BS CK1 PHẠM THẾ HÙNG',
    donVi: 'Khoa Xét Nghiệm - GPB',
    title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
    role: 'doctor' as const,
  },
  {
    username: 'bacsi_truc',
    fullName: 'BSCK1 . Nguyễn Trung Trực',
    donVi: 'Khoa Tế Bào Học',
    title: '(Bệnh viện K Trung Ương)',
    role: 'doctor' as const,
  },
  {
    username: 'bacsi_son',
    fullName: 'ThS.BSNT Trịnh Ngọc Sơn',
    donVi: 'Khoa Giải Phẫu Bệnh',
    title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
    role: 'doctor' as const,
  },
];

export const STANDARD_SOURCES = [
  {
    username: 'lab_phusan',
    fullName: 'Bệnh Viện Phụ Sản Hà Nội',
    donVi: 'Bệnh Viện Phụ Sản Hà Nội',
    soDienThoai: '0243.8343.181',
    email: 'phusanhanoi@gmail.com',
    diaChi: '929 Đ. La Thành, Ba Đình, Hà Nội',
    role: 'lab' as const,
  },
  {
    username: 'lab_thienduc',
    fullName: 'Phòng Khám Thiên Đức',
    donVi: 'Phòng Khám Thiên Đức',
    soDienThoai: '0243.8567.890',
    email: 'pkthienduc@gmail.com',
    diaChi: 'Tô Hiệu, Cầu Giấy, Hà Nội',
    role: 'lab' as const,
  },
  {
    username: 'lab_medilab',
    fullName: 'Phòng Khám Medilab Hà Nội',
    donVi: 'medilab',
    soDienThoai: '0983.597.928',
    email: 'medilabhanoi@gmail.com',
    diaChi: 'Hai Bà Trưng, Hà Nội',
    role: 'lab' as const,
  },
  {
    username: 'lab_dhqy',
    fullName: 'Bệnh Viện Đại Học Y Hà Nội',
    donVi: 'Bệnh Viện Đại Học Y Hà Nội',
    soDienThoai: '0243.5747.788',
    email: 'benhvientrunguong@dhyhn.edu.vn',
    diaChi: '1 Tôn Thất Tùng, Đống Đa, Hà Nội',
    role: 'lab' as const,
  },
  {
    username: 'lab_ngatuho',
    fullName: 'Bệnh Viện Đa Khoa Ngã Tư Hồ',
    donVi: 'Bệnh Viện Đa Khoa Ngã Tư Hồ',
    soDienThoai: '0222.3876.543',
    email: 'bvdangatuho@gmail.com',
    diaChi: 'Thị trấn Hồ, Thuận Thành, Bắc Ninh',
    role: 'lab' as const,
  },
  {
    username: 'lab_sannhibacninh',
    fullName: 'Bệnh Viện Sản Nhi Bắc Ninh',
    donVi: 'Bệnh Viện Sản Nhi Bắc Ninh',
    soDienThoai: '0222.3822.115',
    email: 'sannhibacninh@gmail.com',
    diaChi: 'TP. Bắc Ninh, Bắc Ninh',
    role: 'lab' as const,
  },
];

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private minioService: MinioService,
  ) {}

  async onModuleInit() {
    // Tự động kiểm tra và đồng bộ hóa các tài khoản Bác sĩ & Nguồn gửi mẫu chuẩn vào database
    try {
      // 1. Xóa toàn bộ các tài khoản dư thừa cũ (ví dụ bacsi_theduong, bacsy, alias cũ)
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

      const defaultPasswordHash = await bcrypt.hash('123456', 10);
      for (const doc of STANDARD_DOCTORS) {
        const existing = await this.userModel.findOne({ username: doc.username });

        if (!existing) {
          await this.userModel.create({
            username: doc.username,
            password: defaultPasswordHash,
            passwordHint: '123456',
            fullName: doc.fullName,
            role: 'doctor',
            donVi: doc.donVi,
            title: doc.title,
            allowedCategories: ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'soituoi', 'giaiphaubenh'],
            isActive: true,
          });
          console.log(`[UsersService] Đã khởi tạo tài khoản Bác sĩ: ${doc.fullName} (${doc.username})`);
        } else {
          let updated = false;
          if (existing.fullName !== doc.fullName) {
            existing.fullName = doc.fullName;
            updated = true;
          }
          if (!existing.title && doc.title) {
            existing.title = doc.title;
            updated = true;
          }
          // Đồng bộ passwordHint nếu chưa có
          if (!existing.passwordHint) {
            existing.passwordHint = '123456';
            updated = true;
          }
          if (updated) {
            await existing.save();
            console.log(`[UsersService] Đã cập nhật Bác sĩ: ${doc.fullName} (${doc.username})`);
          }
        }
      }

      // 2. Khởi tạo các tài khoản Nguồn / Đơn vị mẫu chuẩn nếu chưa tồn tại
      for (const src of STANDARD_SOURCES) {
        const existing = await this.userModel.findOne({ username: src.username });
        if (!existing) {
          await this.userModel.create({
            username: src.username,
            password: defaultPasswordHash,
            passwordHint: '123456',
            fullName: src.fullName,
            role: 'lab',
            donVi: src.donVi,
            soDienThoai: src.soDienThoai,
            email: src.email,
            diaChi: src.diaChi,
            allowedCategories: ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'soituoi', 'giaiphaubenh'],
            isActive: true,
          });
          console.log(`[UsersService] Đã khởi tạo tài khoản Nguồn/Đơn vị: ${src.fullName} (${src.username})`);
        } else if (!existing.passwordHint) {
          existing.passwordHint = '123456';
          await existing.save();
        }
      }
      // 3. Tự động bổ sung các trường thuộc tính mới (soDienThoai, title, chungChiHanhNghe, passwordHint...) cho tất cả bản ghi cũ trong CSDL
      await this.userModel.updateMany(
        { passwordHint: { $exists: false } },
        { $set: { passwordHint: '123456' } },
      );
      await this.userModel.updateMany(
        { title: { $exists: false } },
        { $set: { title: '' } },
      );
      await this.userModel.updateMany(
        { soDienThoai: { $exists: false } },
        { $set: { soDienThoai: '' } },
      );
      await this.userModel.updateMany(
        { email: { $exists: false } },
        { $set: { email: '' } },
      );
      await this.userModel.updateMany(
        { chungChiHanhNghe: { $exists: false } },
        { $set: { chungChiHanhNghe: '' } },
      );
      await this.userModel.updateMany(
        { diaChi: { $exists: false } },
        { $set: { diaChi: '' } },
      );
    } catch (err) {
      console.error('[UsersService] Lỗi khi đồng bộ tài khoản bác sĩ / nguồn:', err);
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async findDoctors(): Promise<any[]> {
    return this.userModel
      .find({
        role: { $in: ['doctor', 'bacsy'] },
        isActive: { $ne: false },
      })
      .select('-password')
      .sort({ fullName: 1 })
      .lean()
      .exec();
  }

  async getAllDoctors(): Promise<any[]> {
    return this.userModel
      .find({
        role: { $in: ['doctor', 'bacsy'] },
      })
      .select('-password')
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }

  async getDoctorInfo(doctorNameOrUsername: string): Promise<{ fullName: string; title: string; signatureUrl: string | null } | null> {
    if (!doctorNameOrUsername) return null;
    const cleanName = doctorNameOrUsername.trim();
    if (!cleanName || cleanName === 'Chưa phân loại') return null;

    // 1. Direct match by username, fullName (exact or regex)
    let user = await this.userModel
      .findOne({
        $or: [
          { username: cleanName },
          { fullName: cleanName },
          { fullName: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        ],
        role: { $in: ['doctor', 'bacsy'] },
      })
      .select('signatureUrl fullName username title')
      .lean()
      .exec();

    // 2. Fuzzy match: strip common medical prefixes like BSCK1, TS.BS, BS, ThS, BSNT...
    if (!user) {
      const coreName = cleanName
        .replace(/^(BSCK\d+|BSCKI|BSCKII|TS|BS|ThS|BSNT|PGS|GS|[.\s])+/gi, '')
        .trim();
      if (coreName.length >= 3) {
        user = await this.userModel
          .findOne({
            fullName: new RegExp(coreName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
            role: { $in: ['doctor', 'bacsy'] },
          })
          .select('signatureUrl fullName username title')
          .lean()
          .exec();
      }
    }

    if (!user) {
      // 3. Fallback match against STANDARD_DOCTORS
      const matchStd = STANDARD_DOCTORS.find(
        (d) =>
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
      fullName: user.fullName || cleanName,
      title: (user as any).title || '',
      signatureUrl: (user as any).signatureUrl || null,
    };
  }

  async getDoctorSignature(doctorNameOrUsername: string): Promise<string | null> {
    const info = await this.getDoctorInfo(doctorNameOrUsername);
    return info?.signatureUrl || null;
  }

  async updateDoctor(id: string, data: any): Promise<User | null> {
    const updatePayload: any = {
      fullName: data.fullName,
      username: data.username,
      title: data.title,
      donVi: data.donVi,
      soDienThoai: data.soDienThoai,
      email: data.email,
      chungChiHanhNghe: data.chungChiHanhNghe,
      allowedCategories: data.allowedCategories,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };
    if (data.signatureUrl !== undefined) {
      updatePayload.signatureUrl = data.signatureUrl;
    }
    if (data.password && data.password.trim()) {
      updatePayload.password = await bcrypt.hash(data.password.trim(), 10);
      updatePayload.passwordHint = data.password.trim(); // Lưu gợi ý mật khẩu
    }
    return this.userModel
      .findByIdAndUpdate(id, { $set: updatePayload }, { new: true })
      .select('-password')
      .exec();
  }

  async uploadSignature(id: string, fileBuffer: Buffer, mimeType: string, ext: string): Promise<User | null> {
    const user = await this.userModel.findById(id);
    if (!user) return null;

    if (user.signatureUrl) {
      try {
        await this.minioService.deleteFile(user.signatureUrl);
      } catch (e) {}
    }

    const objectKey = `signatures/doctor_${user.username}_${Date.now()}.${ext}`;
    const signatureUrl = await this.minioService.uploadFile(fileBuffer, objectKey, mimeType);

    user.signatureUrl = signatureUrl;
    await user.save();
    return user;
  }

  async deleteSignature(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id);
    if (!user) return null;

    if (user.signatureUrl) {
      try {
        await this.minioService.deleteFile(user.signatureUrl);
      } catch (e) {}
    }
    user.signatureUrl = '';
    await user.save();
    return user;
  }

  async create(userData: Partial<User>): Promise<User> {
    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }

  async createDoctor(data: any): Promise<User> {
    const defaultPassword = data.password && data.password.trim() ? data.password.trim() : '123456';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    return this.userModel.create({
      username: data.username,
      password: passwordHash,
      passwordHint: defaultPassword,
      fullName: data.fullName,
      role: 'doctor',
      title: data.title || '',
      donVi: data.donVi || '',
      soDienThoai: data.soDienThoai || '',
      email: data.email || '',
      chungChiHanhNghe: data.chungChiHanhNghe || '',
      allowedCategories: data.allowedCategories || ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'soituoi', 'giaiphaubenh'],
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
  }

  async deleteDoctor(id: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndDelete(id);
    return !!result;
  }

  // ==========================================
  // QUẢN LÝ NGUỒN / ĐƠN VỊ GỬI MẪU (ROLE: LAB)
  // ==========================================
  async getAllSources(): Promise<User[]> {
    return this.userModel
      .find({ role: 'lab' })
      .select('-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  async createSource(data: any): Promise<User> {
    const defaultPassword = data.password && data.password.trim() ? data.password.trim() : '123456';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    return this.userModel.create({
      username: data.username,
      password: passwordHash,
      passwordHint: defaultPassword,
      fullName: data.fullName,
      role: 'lab',
      donVi: data.donVi || data.fullName,
      soDienThoai: data.soDienThoai || '',
      email: data.email || '',
      diaChi: data.diaChi || '',
      allowedCategories: data.allowedCategories || [
        'cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'soituoi', 'giaiphaubenh',
      ],
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
  }

  async updateSource(id: string, data: any): Promise<User | null> {
    const updatePayload: any = {
      fullName: data.fullName,
      username: data.username,
      donVi: data.donVi || data.fullName,
      soDienThoai: data.soDienThoai,
      email: data.email,
      diaChi: data.diaChi,
      allowedCategories: data.allowedCategories,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };
    if (data.password && data.password.trim()) {
      updatePayload.password = await bcrypt.hash(data.password.trim(), 10);
      updatePayload.passwordHint = data.password.trim();
    }
    return this.userModel
      .findByIdAndUpdate(id, { $set: updatePayload }, { new: true })
      .select('-password')
      .exec();
  }

  async deleteSource(id: string): Promise<boolean> {
    const result = await this.userModel.findOneAndDelete({ _id: id, role: 'lab' });
    return !!result;
  }
}
