import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CaseStatus = 'pending' | 'tested' | 'diagnosed';

@Schema({ _id: false })
export class LabMetric {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  value!: string;

  @Prop({ default: '' })
  unit!: string;

  @Prop({ default: '' })
  referenceRange!: string;

  @Prop({ default: 'normal', enum: ['normal', 'warning', 'danger'] })
  alert!: 'normal' | 'warning' | 'danger';
}

export const LabMetricSchema = SchemaFactory.createForClass(LabMetric);

@Schema({ timestamps: true, collection: 'biocases' })
export class BioCase extends Document {
  @Prop({ required: true, unique: true })
  patientCode!: string;

  @Prop({ required: true })
  patientName!: string;

  @Prop({ required: true })
  age!: number;

  @Prop({ required: true, enum: ['Nam', 'Nữ', 'Khác'] })
  gender!: string;

  @Prop({ required: true })
  testType!: string;

  @Prop({ required: true })
  sampleDate!: string;

  @Prop({ required: true })
  sampleType!: string;

  @Prop({
    required: true,
    enum: ['pending', 'tested', 'diagnosed'],
    default: 'pending',
  })
  status!: CaseStatus;

  @Prop({ type: [LabMetricSchema], default: [] })
  labMetrics!: LabMetric[];

  @Prop({ default: '' })
  diagnosis!: string;

  @Prop({ default: '' })
  doctorNotes!: string;

  @Prop({ default: '' })
  technicianName!: string;

  @Prop({ default: '' })
  doctorName!: string;
}

export const BioCaseSchema = SchemaFactory.createForClass(BioCase);
