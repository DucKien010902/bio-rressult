import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ default: '' })
  testResultId?: string;

  @Prop({ default: '' })
  caseCode?: string;

  @Prop({ default: '' })
  patientName?: string;

  @Prop({ default: '' })
  doctorName?: string;

  @Prop({ default: '' })
  recipientRole?: string;

  @Prop({ default: false })
  isRead!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
