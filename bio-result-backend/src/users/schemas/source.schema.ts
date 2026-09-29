import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'sources' })
export class Source extends Document {
  @Prop({ required: true, unique: true })
  code!: string; // Mã đơn vị đối tác / nguồn gửi mẫu

  @Prop({ required: true })
  fullName!: string; // Tên hiển thị đầy đủ của Bệnh viện / Phòng khám đối tác

  @Prop({ default: '' })
  donVi?: string; // Tên viết tắt hoặc định danh đơn vị gửi mẫu

  @Prop({ default: '' })
  soDienThoai?: string;

  @Prop({ default: '' })
  email?: string;

  @Prop({ default: '' })
  diaChi?: string; // Địa chỉ cơ sở gửi mẫu

  @Prop({ type: [String], default: [] })
  allowedCategories!: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId?: Types.ObjectId; // Liên kết tới tài khoản đăng nhập (nếu đã cấp)
}

export const SourceSchema = SchemaFactory.createForClass(Source);
