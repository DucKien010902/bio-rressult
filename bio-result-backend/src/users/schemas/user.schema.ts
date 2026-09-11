import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserRole = 'admin' | 'bacsy' | 'lab';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, enum: ['admin', 'bacsy', 'lab'], default: 'bacsy' })
  role!: UserRole;

  @Prop({ default: true })
  isActive!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
