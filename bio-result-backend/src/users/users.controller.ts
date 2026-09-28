import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Endpoint công khai — trả về danh sách tài khoản để hiển thị trong modal Quick Login
  @Get('accounts')
  async getAccounts() {
    const [doctors, sources] = await Promise.all([
      this.usersService.getAllDoctors(),
      this.usersService.getAllSources(),
    ]);
    return {
      doctors: doctors.map((d: any) => ({
        _id: d._id,
        fullName: d.fullName,
        username: d.username,
        passwordHint: d.passwordHint || '123456',
        isActive: d.isActive,
      })),
      sources: sources.map((s: any) => ({
        _id: s._id,
        fullName: s.fullName,
        username: s.username,
        passwordHint: s.passwordHint || '123456',
        donVi: s.donVi,
        isActive: s.isActive,
      })),
    };
  }

  @Get('doctors')
  async getDoctors() {
    return this.usersService.getAllDoctors();
  }

  @Post('doctors')
  async createDoctor(@Body() body: any) {
    if (!body.username || !body.fullName) {
      throw new BadRequestException('Vui lòng nhập Tên đăng nhập và Họ tên bác sĩ');
    }
    const existing = await this.usersService.findByUsername(body.username);
    if (existing) {
      throw new BadRequestException('Tên đăng nhập đã tồn tại trong hệ thống');
    }
    return this.usersService.createDoctor(body);
  }

  @Put('doctors/:id')
  async updateDoctor(@Param('id') id: string, @Body() body: any) {
    const updated = await this.usersService.updateDoctor(id, body);
    if (!updated) {
      throw new NotFoundException('Không tìm thấy tài khoản bác sĩ');
    }
    return updated;
  }

  @Post('doctors/:id/signature')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSignature(
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Vui lòng chọn file ảnh chữ ký hợp lệ');
    }
    const ext = file.originalname ? file.originalname.split('.').pop()?.toLowerCase() || 'png' : 'png';
    const mimeType = file.mimetype || 'image/png';

    const updated = await this.usersService.uploadSignature(id, file.buffer, mimeType, ext);
    if (!updated) {
      throw new NotFoundException('Không tìm thấy tài khoản bác sĩ');
    }
    return {
      success: true,
      signatureUrl: updated.signatureUrl,
      doctor: updated,
    };
  }

  @Delete('doctors/:id/signature')
  async deleteSignature(@Param('id') id: string) {
    const updated = await this.usersService.deleteSignature(id);
    if (!updated) {
      throw new NotFoundException('Không tìm thấy tài khoản bác sĩ');
    }
    return { success: true, doctor: updated };
  }

  @Delete('doctors/:id')
  async deleteDoctor(@Param('id') id: string) {
    const success = await this.usersService.deleteDoctor(id);
    if (!success) {
      throw new NotFoundException('Không tìm thấy bác sĩ');
    }
    return { success: true };
  }

  // ==========================================
  // API QUẢN LÝ NGUỒN / ĐƠN VỊ GỬI MẪU (ROLE: LAB)
  // ==========================================
  @Get('sources')
  async getSources() {
    return this.usersService.getAllSources();
  }

  @Post('sources')
  async createSource(@Body() body: any) {
    if (!body.username || !body.fullName) {
      throw new BadRequestException('Vui lòng nhập Tên đăng nhập và Tên đơn vị đối tác');
    }
    const existing = await this.usersService.findByUsername(body.username);
    if (existing) {
      throw new BadRequestException('Tên đăng nhập đã tồn tại trong hệ thống');
    }
    return this.usersService.createSource(body);
  }

  @Put('sources/:id')
  async updateSource(@Param('id') id: string, @Body() body: any) {
    const updated = await this.usersService.updateSource(id, body);
    if (!updated) {
      throw new NotFoundException('Không tìm thấy tài khoản nguồn/đơn vị');
    }
    return updated;
  }

  @Delete('sources/:id')
  async deleteSource(@Param('id') id: string) {
    const success = await this.usersService.deleteSource(id);
    if (!success) {
      throw new NotFoundException('Không tìm thấy nguồn/đơn vị');
    }
    return { success: true };
  }
}
