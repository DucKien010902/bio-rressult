import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserRole = 'admin' | 'doctor' | 'bacsy' | 'lab';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  fullName!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['admin', 'doctor', 'bacsy', 'lab'],
    default: 'doctor',
  })
  role!: UserRole;

  @Prop({ default: '' })
  donVi!: string; // Tên bệnh viện / phòng khám nếu là tài khoản lab/đơn vị gửi mẫu

  @Prop({ default: '' })
  title?: string; // Chức danh / Đơn vị (hiển thị dưới tên bác sĩ trên phiếu)

  @Prop({ default: '' })
  signatureUrl?: string; // Link ảnh chữ ký số lưu trên MinIO

  @Prop({ default: '' })
  soDienThoai?: string;

  @Prop({ default: '' })
  email?: string;

  @Prop({ default: '' })
  chungChiHanhNghe?: string; // Số chứng chỉ hành nghề nếu có

  @Prop({ default: '' })
  diaChi?: string; // Địa chỉ đơn vị / cơ sở đối tác gửi mẫu

  @Prop({ type: [String], default: [] })
  allowedCategories!: string[]; // Danh mục dịch vụ được phép thực hiện / đọc KQ

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: '' })
  passwordHint?: string; // Gợi ý mật khẩu plain-text (chỉ dùng cho hiển thị trong admin UI / modal đăng nhập)
}

export const UserSchema = SchemaFactory.createForClass(User);
