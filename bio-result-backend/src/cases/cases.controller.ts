import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { CasesService } from './cases.service.js';
import { PdfService } from './pdf.service.js';

@Controller('cases')
export class CasesController {
  constructor(
    private readonly casesService: CasesService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('doctor') doctor?: string,
    @Query('donVi') donVi?: string,
  ) {
    return this.casesService.findAll(status, keyword, category, doctor, donVi);
  }

  // Thống kê & Báo cáo số liệu Dashboard
  @Get('stats')
  async getStats(
    @Query('doctor') doctor?: string,
    @Query('donVi') donVi?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      return await this.casesService.getStats(doctor, donVi, startDate, endDate);
    } catch (err: any) {
      console.error('LỖI GET /cases/stats:', err);
      return { error: err.message, stack: err.stack };
    }
  }

  // Xuất file Excel (CSV UTF-8 BOM) thống kê hoạt động hoặc bác sĩ
  @Get('stats/export-excel')
  async exportExcel(
    @Query('type') type: 'all' | 'doctor',
    @Query('doctor') doctor: string,
    @Query('donVi') donVi: string,
    @Res() res: Response,
  ) {
    const csvData = await this.casesService.exportExcelData(
      type || 'all',
      doctor,
      donVi,
    );
    const fileName =
      type === 'doctor'
        ? 'Thong_ke_bac_si_GenHD.csv'
        : 'Bao_cao_tong_quan_GenHD.csv';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(csvData);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  // Xuất / Tải kết quả file PDF động theo thông tin bệnh nhân
  @Get(':id/export-pdf')
  async exportPdf(@Param('id') id: string, @Res() res: Response) {
    const caseItem = await this.casesService.findOne(id);
    if (!caseItem) {
      throw new NotFoundException('Không tìm thấy phiếu xét nghiệm');
    }

    const pdfBuffer = await this.pdfService.generateCasePdf(caseItem);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Ket_qua_${caseItem.maSo || id}.pdf"`,
    );
    return res.send(pdfBuffer);
  }

  @Post()
  async create(@Body() data: any) {
    return this.casesService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.casesService.update(id, data);
  }

  // Tiếp nhận phiếu xét nghiệm (chuyển sang chay_ket_qua)
  @Post(':id/accept')
  async acceptCase(
    @Param('id') id: string,
    @Body('bacSiDoc') bacSiDoc?: string,
  ) {
    return this.casesService.acceptCase(id, bacSiDoc);
  }

  // Bác sĩ hoàn thành đọc & ký duyệt
  @Put(':id/sign')
  async signAndDiagnose(
    @Param('id') id: string,
    @Body()
    body: {
      ketLuan: string;
      khuyenNghi?: string;
      bacSiDoc?: string;
      specificResults?: any;
    },
  ) {
    return this.casesService.signAndDiagnose(id, body);
  }

  // Admin duyệt và Trả kết quả (da_tra_ket_qua)
  @Patch(':id/release')
  async releaseResult(@Param('id') id: string) {
    return this.casesService.releaseResult(id);
  }

  @Put(':id/lab-result')
  async updateLabResult(
    @Param('id') id: string,
    @Body() body: { labMetrics: any[]; technicianName: string },
  ) {
    return this.casesService.updateLabResult(
      id,
      body.labMetrics,
      body.technicianName || 'KTV Phòng Lab',
    );
  }

  @Put(':id/diagnosis')
  async updateDiagnosis(
    @Param('id') id: string,
    @Body()
    body: { diagnosis: string; doctorNotes: string; doctorName: string },
  ) {
    return this.casesService.updateDiagnosis(
      id,
      body.diagnosis,
      body.doctorNotes,
      body.doctorName || 'BS Chẩn đoán',
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.casesService.delete(id);
  }
}
