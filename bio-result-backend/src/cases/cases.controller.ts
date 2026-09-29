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
  Req,
  NotFoundException,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CasesService } from './cases.service.js';
import { PdfService } from './pdf.service.js';
import { MinioService, generateMinioObjectKey } from '../minio/minio.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CasesController {
  constructor(
    private readonly casesService: CasesService,
    private readonly pdfService: PdfService,
    private readonly minioService: MinioService,
  ) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('doctor') doctor?: string,
    @Query('donVi') donVi?: string,
  ) {
    // If logged in user is a LAB / DON_VI role, enforce data isolation by their donVi
    let effectiveDonVi = donVi;
    if (req.user?.role === 'lab') {
      effectiveDonVi = req.user.donVi || 'Đơn vị không xác định';
    }

    // If logged in user is a DOCTOR, enforce data isolation: doctor only sees their own assigned cases!
    let effectiveDoctor = doctor;
    if (req.user?.role === 'doctor' || req.user?.role === 'bacsy') {
      effectiveDoctor = req.user.fullName || req.user.username;
    }



    try {
      return await this.casesService.findAll(
        status,
        keyword,
        category,
        effectiveDoctor,
        effectiveDonVi,
      );
    } catch (err: any) {
      console.error('LỖI GET /cases findAll:', err);
      throw err;
    }
  }

  // Thống kê & Báo cáo số liệu Dashboard
  @Get('stats')
  async getStats(
    @Req() req: any,
    @Query('doctor') doctor?: string,
    @Query('donVi') donVi?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      let effectiveDonVi = donVi;
      if (req.user?.role === 'lab') {
        effectiveDonVi = req.user.donVi;
      }
      let effectiveDoctor = doctor;
      if (req.user?.role === 'doctor' || req.user?.role === 'bacsy') {
        effectiveDoctor = req.user.fullName || req.user.username;
      }
      return await this.casesService.getStats(
        effectiveDoctor,
        effectiveDonVi,
        startDate,
        endDate,
      );
    } catch (err: any) {
      console.error('LỖI GET /cases/stats:', err);
      return { error: err.message, stack: err.stack };
    }
  }

  // Xuất file Excel danh sách ca xét nghiệm (lọc theo dịch vụ, tháng YYYY-MM, trạng thái, v.v.)
  @Get('export-excel')
  async exportCasesExcelEndpoint(
    @Req() req: any,
    @Query('category') category: string,
    @Query('month') month: string,
    @Query('status') status: string,
    @Query('doctor') doctor: string,
    @Query('donVi') donVi: string,
    @Res() res: Response,
  ) {
    let effectiveDonVi = donVi;
    if (req.user?.role === 'lab') {
      effectiveDonVi = req.user.donVi;
    }
    let effectiveDoctor = doctor;
    if (req.user?.role === 'doctor' || req.user?.role === 'bacsy') {
      effectiveDoctor = req.user.fullName || req.user.username;
    }

    const xlsxBuffer = await this.casesService.exportCasesExcel(
      category,
      month,
      status,
      effectiveDoctor,
      effectiveDonVi,
    );

    const cleanCategory = category || 'all';
    const cleanMonth = month || 'all';
    const fileName = `Danh_sach_ca_${cleanCategory}_${cleanMonth}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(xlsxBuffer);
  }

  // Xuất file Excel (CSV UTF-8 BOM) thống kê hoạt động hoặc bác sĩ
  @Get('stats/export-excel')
  async exportExcel(
    @Req() req: any,
    @Query('type') type: 'all' | 'doctor',
    @Query('doctor') doctor: string,
    @Query('donVi') donVi: string,
    @Res() res: Response,
  ) {
    let effectiveDonVi = donVi;
    if (req.user?.role === 'lab') {
      effectiveDonVi = req.user.donVi;
    }

    const csvData = await this.casesService.exportExcelData(
      type || 'all',
      doctor,
      effectiveDonVi,
    );
    const fileName =
      type === 'doctor'
        ? 'Thong_ke_bac_si_GenHD.csv'
        : 'Bao_cao_tong_quan_GenHD.csv';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(csvData);
  }

  @Get('sources')
  async getSources() {
    return this.casesService.getSources();
  }

  @Get('doctors')
  async getDoctors() {
    return this.casesService.getDoctors();
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const caseItem = await this.casesService.findOne(id);
    if (!caseItem) {
      throw new NotFoundException('Không tìm thấy phiếu xét nghiệm');
    }
    // Check permission for LAB role
    if (
      req.user?.role === 'lab' &&
      caseItem.donVi &&
      req.user.donVi &&
      caseItem.donVi !== req.user.donVi
    ) {
      throw new ForbiddenException(
        'Tài khoản đơn vị của bạn không có quyền truy cập ca này!',
      );
    }

    // Check permission for DOCTOR role: chỉ truy cập ca được phân công cho mình
    if (
      (req.user?.role === 'doctor' || req.user?.role === 'bacsy') &&
      req.user.fullName
    ) {
      const docName = req.user.fullName.trim();
      const isAssigned =
        (caseItem.bacSiDoc && caseItem.bacSiDoc.includes(docName)) ||
        (caseItem.doctorName && caseItem.doctorName.includes(docName)) ||
        (caseItem.bacSiDoc2 && caseItem.bacSiDoc2.includes(docName));
      if (!isAssigned) {
        throw new ForbiddenException(
          'Bác sĩ chỉ có quyền truy cập ca xét nghiệm được phân công cho mình!',
        );
      }
    }

    return caseItem;
  }

  // Lấy danh sách các mẫu biểu mẫu PDF có thể chọn cho ca xét nghiệm
  @Get(':id/pdf-templates')
  async getPdfTemplates(@Param('id') id: string) {
    const caseItem = await this.casesService.findOne(id);
    if (!caseItem) {
      throw new NotFoundException('Không tìm thấy phiếu xét nghiệm');
    }
    const cat = caseItem.loaiXetNghiem || '';
    const templates = this.pdfService.getAvailableTemplates(cat);
    const selectedTemplate =
      caseItem.pdfTemplate ||
      templates.find((t) => t.isDefault)?.id ||
      templates[0]?.id;

    return {
      category: cat,
      selectedTemplate,
      templates,
    };
  }

  @Get(':id/export-pdf')
  async exportPdf(
    @Req() req: any,
    @Param('id') id: string,
    @Query('template') template: string,
    @Query('download') download: string,
    @Res() res: Response,
  ) {
    const caseItem = await this.casesService.findOne(id);
    if (!caseItem) {
      throw new NotFoundException('Không tìm thấy phiếu xét nghiệm');
    }
    // Check permission for LAB role
    if (
      req.user?.role === 'lab' &&
      caseItem.donVi &&
      req.user.donVi &&
      caseItem.donVi !== req.user.donVi
    ) {
      throw new ForbiddenException(
        'Tài khoản đơn vị của bạn không có quyền tải PDF ca này!',
      );
    }

    const pdfBuffer = await this.pdfService.generateCasePdf(caseItem, template);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const disposition = download === '1' || download === 'true' ? 'attachment' : 'inline';
    const safeMaSo = (caseItem.maSo || id).replace(/[/\\?%*:|"<>]/g, '_');
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="Ket_qua_${safeMaSo}.pdf"`,
    );
    return res.send(pdfBuffer);
  }

  @Post()
  async create(@Req() req: any, @Body() data: any) {
    // If LAB role, auto attach their donVi
    if (req.user?.role === 'lab' && req.user.donVi) {
      data.donVi = req.user.donVi;
    }
    // Chỉ có Admin & Super Admin mới có quyền gán bác sĩ đọc KQ khi tạo mới
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
      delete data.bacSiDoc;
      delete data.bacSiDoc2;
      delete data.doctorName;
    }
    return this.casesService.create(data, req.user);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    const role = req.user?.role;
    const existing = await this.casesService.findOne(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy phiếu xét nghiệm');
    }

    // 1. Phân quyền cho tài khoản Đơn vị / Nguồn gửi mẫu (lab):
    // Chỉ được chỉnh sửa thông tin hành chính của bệnh nhân, KHÔNG được sửa kết quả xét nghiệm
    if (role === 'lab') {
      if (
        existing.donVi &&
        req.user.donVi &&
        existing.donVi.trim().toLowerCase() !== req.user.donVi.trim().toLowerCase()
      ) {
        throw new ForbiddenException(
          'Bạn chỉ có quyền cập nhật thông tin ca thuộc đơn vị gửi mẫu của mình!',
        );
      }
      if (existing.trangThai === 'da_tra_ket_qua') {
        throw new ForbiddenException(
          'Phiếu xét nghiệm đã hoàn thành trả kết quả, không thể chỉnh sửa!',
        );
      }

      const allowedLabData: any = {};
      const labFields = [
        'hoTen',
        'patientName',
        'namSinh',
        'gioiTinh',
        'gender',
        'diaChi',
        'address',
        'soDienThoai',
        'phone',
        'bacSiChiDinh',
        'loaiMau',
        'ngayNhanMau',
      ];
      for (const key of labFields) {
        if (data[key] !== undefined) {
          allowedLabData[key] = data[key];
        }
      }
      if (allowedLabData.hoTen) {
        allowedLabData.hoTen = allowedLabData.hoTen.trim().toUpperCase();
        allowedLabData.patientName = allowedLabData.hoTen;
      }
      return this.casesService.update(id, allowedLabData, req.user);
    }

    // 2. Phân quyền cho tài khoản Bác sĩ (doctor / bacsy):
    // Được chỉnh sửa kết quả xét nghiệm chuyên môn, KHÔNG được sửa thông tin cá nhân của bệnh nhân
    if (role === 'doctor' || role === 'bacsy') {
      const docName = (req.user?.fullName || '').trim();
      const docUser = (req.user?.username || '').trim();

      const isDoc1 =
        (docName && existing.bacSiDoc && existing.bacSiDoc.includes(docName)) ||
        (docUser && existing.bacSiDoc && existing.bacSiDoc.includes(docUser)) ||
        (docName && existing.doctorName && existing.doctorName.includes(docName)) ||
        (docUser && existing.doctorName && existing.doctorName.includes(docUser));

      const isDoc2 =
        (docName && existing.bacSiDoc2 && existing.bacSiDoc2.includes(docName)) ||
        (docUser && existing.bacSiDoc2 && existing.bacSiDoc2.includes(docUser));

      if (!isDoc1 && !isDoc2) {
        throw new ForbiddenException(
          'Bạn chỉ có quyền chỉnh sửa ca xét nghiệm được phân công cho mình!',
        );
      }

      // Nếu là ca Combo và 2 bác sĩ khác nhau: BS 1 không được sửa kết quả BS 2 và ngược lại!
      if (existing.loaiXetNghiem?.toLowerCase()?.startsWith('combo_')) {
        const doc1Name = (existing.bacSiDoc || '').trim().toLowerCase();
        const doc2Name = (existing.bacSiDoc2 || '').trim().toLowerCase();
        const isSameDoctor = doc1Name && doc2Name && doc1Name === doc2Name;

        if (!isSameDoctor) {
          if (isDoc1 && !isDoc2) {
            // Bác sĩ 1 (HPV) -> cấm sửa kết quả Phần 2 (Tế bào học / ThinPrep)
            const part2Fields = [
              'viTriBenhPham', 'tinhChatBenhPham', 'lyDoKhongDat', 'daiThe', 'viThe',
              'nhanXetDaiThe', 'khongTonThuong', 'batThuongKhac', 'teBaoNoiMac',
              'bienDoiViSinh', 'bienDoiKhac', 'batThuongVay', 'batThuongTuyen',
              'anhTeBao', 'anhTeBao2', 'ketLuan2', 'daKy2', 'ngayXetNghiem2'
            ];
            for (const f of part2Fields) {
              delete data[f];
            }
          } else if (isDoc2 && !isDoc1) {
            // Bác sĩ 2 (Tế bào học / ThinPrep) -> cấm sửa kết quả Phần 1 (HPV)
            const part1Fields = [
              'hpvHighRiskResult', 'hpvHighRiskOtherResult', 'hpvLowRiskResult',
              'hpvOtherTypesResult', 'anhHpv', 'hienBieuDo', 'ketLuan', 'daKy'
            ];
            for (const f of part1Fields) {
              delete data[f];
            }
          }
        }
      }

      // Xóa bỏ toàn bộ các trường thông tin hành chính bệnh nhân nếu gửi lên
      const patientFields = [
        'hoTen',
        'patientName',
        'namSinh',
        'gioiTinh',
        'gender',
        'diaChi',
        'address',
        'soDienThoai',
        'phone',
        'donVi',
        'bacSiChiDinh',
        'loaiMau',
        'ngayNhanMau',
        'maSo',
        'patientCode',
      ];
      for (const key of patientFields) {
        delete data[key];
      }
    }

    // 3. Chỉ có Admin & Super Admin mới có quyền thay đổi bác sĩ đọc KQ và xác nhận trả kết quả
    if (role !== 'admin' && role !== 'superadmin') {
      delete data.bacSiDoc;
      delete data.bacSiDoc2;
      delete data.doctorName;
      if (data.trangThai === 'da_tra_ket_qua') {
        delete data.trangThai;
      }
    }

    return this.casesService.update(id, data, req.user);
  }

  // Tiếp nhận phiếu xét nghiệm (chuyển sang chay_ket_qua)
  @Post(':id/accept')
  async acceptCase(
    @Req() req: any,
    @Param('id') id: string,
    @Body('bacSiDoc') bacSiDoc?: string,
    @Body('bacSiDoc2') bacSiDoc2?: string,
  ) {
    if (req.user?.role === 'lab') {
      throw new ForbiddenException(
        'Tài khoản đơn vị không có quyền tiếp nhận phiếu!',
      );
    }
    return this.casesService.acceptCase(id, bacSiDoc, bacSiDoc2, req.user);
  }

  // Bác sĩ hoàn thành đọc & ký duyệt
  @Put(':id/sign')
  async signAndDiagnose(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      ketLuan: string;
      khuyenNghi?: string;
      bacSiDoc?: string;
      specificResults?: any;
    },
  ) {
    if (req.user?.role === 'lab') {
      throw new ForbiddenException(
        'Tài khoản đơn vị không có quyền ký duyệt kết quả!',
      );
    }
    return this.casesService.signAndDiagnose(id, body, req.user);
  }

  // Admin / Super Admin duyệt và Trả kết quả (da_tra_ket_qua) sau khi Bác sĩ đã ký
  @Patch(':id/release')
  async releaseResult(@Req() req: any, @Param('id') id: string) {
    const isSuper = req.user?.role === 'superadmin' || req.user?.username === 'superadmin';
    const isAdmin = req.user?.role === 'admin' || req.user?.username === 'admin' || isSuper;
    if (!isAdmin) {
      throw new ForbiddenException(
        'Chỉ tài khoản Quản trị (Admin/Super Admin) mới có quyền xác nhận trả kết quả!',
      );
    }
    return this.casesService.releaseResult(id, req.user);
  }

  // Xem lịch sử thao tác và chỉnh sửa của phiếu
  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.casesService.getHistory(id);
  }

  @Put(':id/lab-result')
  async updateLabResult(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { labMetrics: any[]; technicianName: string },
  ) {
    if (req.user?.role === 'lab') {
      throw new ForbiddenException(
        'Tài khoản đơn vị không có quyền cập nhật chỉ số Lab!',
      );
    }
    return this.casesService.updateLabResult(
      id,
      body.labMetrics,
      body.technicianName || 'KTV Phòng Lab',
    );
  }

  @Put(':id/diagnosis')
  async updateDiagnosis(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    body: { diagnosis: string; doctorNotes: string; doctorName: string },
  ) {
    if (req.user?.role === 'lab') {
      throw new ForbiddenException(
        'Tài khoản đơn vị không có quyền cập nhật chẩn đoán!',
      );
    }
    return this.casesService.updateDiagnosis(
      id,
      body.diagnosis,
      body.doctorNotes,
      body.doctorName || 'BS Chẩn đoán',
    );
  }

  // Tải / Thay thế ảnh xét nghiệm lên MinIO Bucket (genhd)
  @Post(':id/upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body('field') field: string = 'anhTeBao',
    @Body('loaiAnh') loaiAnh: string = 'tieuban',
  ) {
    const caseItem = await this.casesService.findOne(id);
    if (!caseItem) {
      throw new NotFoundException('Không tìm thấy phiếu xét nghiệm');
    }

    const targetField = field || 'anhTeBao';
    const oldUrl = (caseItem as any)[targetField];

    // Xóa file ảnh cũ trên MinIO nếu có
    if (oldUrl && typeof oldUrl === 'string' && oldUrl.startsWith('http')) {
      await this.minioService.deleteFile(oldUrl);
    }

    let fileBuffer: Buffer;
    let mimeType = 'image/jpeg';
    let ext = 'jpg';

    if (file && file.buffer) {
      fileBuffer = file.buffer;
      mimeType = file.mimetype || 'image/jpeg';
      ext = file.originalname ? file.originalname.split('.').pop() || 'jpg' : 'jpg';
    } else {
      throw new NotFoundException('Vui lòng chọn file ảnh để tải lên');
    }

    // Quy tắc đặt tên: {loaiXetNghiem}/{maSo}_{tenBenhNhanKhongDau}_{loaiAnh}.jpg (KHÔNG timestamp)
    const objectKey = generateMinioObjectKey(
      caseItem.loaiXetNghiem,
      caseItem.maSo,
      caseItem.hoTen || caseItem.patientName,
      loaiAnh,
      ext,
    );

    const imageUrl = await this.minioService.uploadFile(fileBuffer, objectKey, mimeType);

    // Cập nhật CHỈ DUY NHẤT trường ảnh đó vào MongoDB
    const updated = await this.casesService.updateImageField(id, targetField, imageUrl);

    return {
      success: true,
      url: imageUrl,
      case: updated,
      message: 'Tải ảnh lên MinIO thành công',
    };
  }

  // Xóa ảnh xét nghiệm khỏi MinIO & cập nhật rỗng trong MongoDB
  @Post(':id/delete-image')
  async deleteImage(
    @Param('id') id: string,
    @Body('field') field: string = 'anhTeBao',
  ) {
    const caseItem = await this.casesService.findOne(id);
    if (!caseItem) {
      throw new NotFoundException('Không tìm thấy phiếu xét nghiệm');
    }

    const targetField = field || 'anhTeBao';
    const oldUrl = (caseItem as any)[targetField];

    if (oldUrl && typeof oldUrl === 'string' && oldUrl.startsWith('http')) {
      await this.minioService.deleteFile(oldUrl);
    }

    // Cập nhật CHỈ DUY NHẤT trường ảnh đó thành rỗng trong MongoDB
    const updated = await this.casesService.updateImageField(id, targetField, '');

    return {
      success: true,
      case: updated,
      message: 'Đã xóa ảnh thành công',
    };
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const isSuper = req.user?.role === 'superadmin' || req.user?.username === 'superadmin';
    const isAdmin = req.user?.role === 'admin' || req.user?.username === 'admin' || isSuper;
    if (!isAdmin) {
      throw new ForbiddenException(
        'Chỉ có Quản trị viên phòng Lab (Admin/Super Admin) mới có quyền xóa phiếu xét nghiệm!',
      );
    }
    return this.casesService.delete(id);
  }
}
