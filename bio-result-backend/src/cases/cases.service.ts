import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BioCase, CaseStatus } from './schemas/case.schema.js';

@Injectable()
export class CasesService {
  constructor(
    @InjectModel(BioCase.name) private caseModel: Model<BioCase>,
  ) {}

  async findAll(status?: string, keyword?: string): Promise<BioCase[]> {
    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (keyword && keyword.trim() !== '') {
      const regex = new RegExp(keyword.trim(), 'i');
      query.$or = [
        { patientName: regex },
        { patientCode: regex },
        { testType: regex },
      ];
    }
    return this.caseModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<BioCase> {
    const found = await this.caseModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm');
    }
    return found;
  }

  async create(data: Partial<BioCase>): Promise<BioCase> {
    const newCase = new this.caseModel({
      ...data,
      status: 'pending',
    });
    return newCase.save();
  }

  async updateLabResult(
    id: string,
    labMetrics: any[],
    technicianName: string,
  ): Promise<BioCase> {
    const updated = await this.caseModel.findByIdAndUpdate(
      id,
      {
        labMetrics,
        technicianName,
        status: 'tested' as CaseStatus,
      },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm');
    }
    return updated;
  }

  async updateDiagnosis(
    id: string,
    diagnosis: string,
    doctorNotes: string,
    doctorName: string,
  ): Promise<BioCase> {
    const updated = await this.caseModel.findByIdAndUpdate(
      id,
      {
        diagnosis,
        doctorNotes,
        doctorName,
        status: 'diagnosed' as CaseStatus,
      },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm');
    }
    return updated;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const result = await this.caseModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm để xóa');
    }
    return { success: true };
  }
}
