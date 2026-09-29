import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserRole = 'superadmin' | 'admin' | 'doctor' | 'bacsy' | 'lab';

@Schema({ timestamps: true, collection: 'users' })
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
    enum: ['superadmin', 'admin', 'doctor', 'bacsy', 'lab'],
    default: 'doctor',
  })
  role!: UserRole;

  @Prop({ default: '' })
  donVi!: string; // Tên bệnh viện / phòng khám nếu là tài khoản lab/đơn vị gửi mẫu

  @Prop({ default: '' })
  title?: string; // Chức danh / Đơn vị

  @Prop({ default: '' })
  signatureUrl?: string; // Link ảnh chữ ký số lưu trên MinIO

  @Prop({ default: '' })
  soDienThoai?: string;

  @Prop({ default: '' })
  email?: string;

  @Prop({ default: '' })
  chungChiHanhNghe?: string;

  @Prop({ default: '' })
  diaChi?: string;

  @Prop({ type: [String], default: [] })
  allowedCategories!: string[];

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: '' })
  passwordHint?: string; // Gợi ý mật khẩu plain-text

  @Prop({ type: Types.ObjectId, ref: 'Doctor', default: null })
  doctorId?: Types.ObjectId; // Liên kết tới hồ sơ bác sĩ (nếu là tài khoản bác sĩ)

  @Prop({ type: Types.ObjectId, ref: 'Source', default: null })
  sourceId?: Types.ObjectId; // Liên kết tới hồ sơ nguồn gửi mẫu (nếu là tài khoản lab)
}

export const UserSchema = SchemaFactory.createForClass(User);
