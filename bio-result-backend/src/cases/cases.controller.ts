import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { CasesService } from './cases.service.js';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.casesService.findAll(status, keyword);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.casesService.create(data);
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
