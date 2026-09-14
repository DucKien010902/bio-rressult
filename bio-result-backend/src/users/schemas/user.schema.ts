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
    required: true,
    enum: ['admin', 'doctor', 'bacsy', 'lab'],
    default: 'doctor',
  })
  role!: UserRole;

  @Prop({ default: '' })
  donVi!: string; // Tên bệnh viện / phòng khám nếu là tài khoản lab/đơn vị gửi mẫu

  @Prop({ type: [String], default: [] })
  allowedCategories!: string[]; // Danh mục dịch vụ được phép thực hiện / đọc KQ

  @Prop({ default: true })
  isActive!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
