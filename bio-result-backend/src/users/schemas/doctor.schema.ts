import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'doctors' })
export class Doctor extends Document {
  @Prop({ required: true, unique: true })
  code!: string; // Mã bác sĩ (hoặc username mặc định của bác sĩ)

  @Prop({ required: true })
  fullName!: string;

  @Prop({ default: '' })
  title?: string; // Chức danh chuyên môn (ví dụ: TS.BS, BSCK1...)

  @Prop({ default: '' })
  donVi?: string; // Khoa / Phòng ban làm việc

  @Prop({ default: '' })
  signatureUrl?: string; // Link ảnh chữ ký số lưu trên MinIO

  @Prop({ default: '' })
  soDienThoai?: string;

  @Prop({ default: '' })
  email?: string;

  @Prop({ default: '' })
  chungChiHanhNghe?: string;

  @Prop({ type: [String], default: [] })
  allowedCategories!: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId?: Types.ObjectId; // Liên kết tới tài khoản đăng nhập (nếu đã cấp)
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
