import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SettingDocument = HydratedDocument<Setting>;

@Schema({ timestamps: true, collection: 'settings', strict: false })
export class Setting {
  @Prop({ required: true, unique: true, index: true })
  key!: string; // ví dụ: 'turnaround_time', 'doctors', 'sources'

  @Prop({ type: Object, default: {} })
  value!: Record<string, any>;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
