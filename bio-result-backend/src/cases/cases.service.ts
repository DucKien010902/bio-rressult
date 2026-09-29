import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import ExcelJS from 'exceljs';
import { BioCase, CaseStatus } from './schemas/case.schema.js';
import { UsersService } from '../users/users.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class CasesService {
  constructor(
    @InjectModel(BioCase.name) private caseModel: Model<BioCase>,
    private readonly usersService: UsersService,
    private readonly settingsService: SettingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(
    status?: string,
    keyword?: string,
    category?: string,
    doctor?: string,
    donVi?: string,
  ): Promise<BioCase[]> {
    const conditions: any[] = [];

    // Lọc theo trạng thái
    if (status && status !== 'all') {
      conditions.push({
        $or: [{ status }, { trangThai: status }],
      });
    }

    // Lọc theo danh mục dịch vụ chuẩn xác (cell, thinprep, hpv40, combo_hpv20_cell...)
    if (category && category !== 'all') {
      conditions.push({
        $or: [
          { loaiXetNghiem: category },
          { testType: category },
        ],
      });
    }

    // Lọc theo bác sĩ đọc kết quả (hỗ trợ cả bác sĩ 1 và 2, chuẩn hóa học hàm và khoảng trắng)
    if (doctor && doctor.trim() !== '') {
      const rawName = doctor.trim();
      const escapedRaw = rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
      const coreName = rawName.replace(/^(TS|BS|ThS|BSCK1|BS\s*CK1|BSNT|ThS\.\s*BSNT|\.|\s)+/gi, '').trim();
      const escapedCore = coreName.length >= 3 ? coreName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*') : escapedRaw;
      const docRegex = new RegExp(`(${escapedRaw}|${escapedCore})`, 'i');

      conditions.push({
        $or: [
          { bacSiDoc: docRegex },
          { bacSiDoc2: docRegex },
          { doctorName: docRegex },
        ],
      });
    }

    // Lọc theo đơn vị gửi mẫu
    if (donVi && donVi.trim() !== '') {
      conditions.push({ donVi: new RegExp(donVi.trim(), 'i') });
    }

    // Tìm kiếm từ khóa (Mã số, tên bệnh nhân, điện thoại, tên nguồn/đơn vị, tên bác sĩ...)
    if (keyword && keyword.trim() !== '') {
      const regex = new RegExp(keyword.trim(), 'i');
      conditions.push({
        $or: [
          { hoTen: regex },
          { patientName: regex },
          { maSo: regex },
          { patientCode: regex },
          { soDienThoai: regex },
          { donVi: regex },
          { nguoiNhap: regex },
          { bacSiDoc: regex },
          { bacSiDoc2: regex },
          { doctorName: regex },
          { bacSiChiDinh: regex },
          { chanDoanLamSang: regex },
        ],
      });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};
    const result = await this.caseModel
      .find(query)
      .select('-anhTeBao -anhGpb -anhHpv -pdfBuffer -bieuDoHpv -signatureImage')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return result as any;
  }

  async findOne(id: string): Promise<BioCase> {
    const found = await this.caseModel.findById(id).exec();
    if (!found) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm');
    }
    return found;
  }

  async getSources(): Promise<string[]> {
    const listDonVi = await this.caseModel.distinct('donVi').exec();
    const listNguoiNhap = await this.caseModel.distinct('nguoiNhap').exec();
    const sourcesSet = new Set<string>();
    sourcesSet.add('Quản trị viên (Admin)');
    sourcesSet.add('PK ĐẠI DƯƠNG ĐH');
    sourcesSet.add('BVĐK Ngã Tư Hồ');
    sourcesSet.add('Phòng khám Medilab');
    sourcesSet.add('Phòng Khám Thiên Đức');
    sourcesSet.add('Bệnh Viện Phụ Sản Hà Nội');
    sourcesSet.add('Bệnh Viện ĐHQG');

    listDonVi.forEach((s) => {
      if (s && typeof s === 'string' && s.trim()) sourcesSet.add(s.trim());
    });
    listNguoiNhap.forEach((s) => {
      if (s && typeof s === 'string' && s.trim()) sourcesSet.add(s.trim());
    });
    return Array.from(sourcesSet);
  }

  getCategoryLabel(cat?: string): string {
    if (!cat) return 'Xét nghiệm';
    const c = cat.toLowerCase();
    if (c.includes('combo')) return 'Combo (HPV + Tế bào)';
    if (c.includes('hpv40')) return 'HPV 40 Type';
    if (c.includes('hpv23')) return 'HPV 23 Type';
    if (c.includes('hpv20')) return 'HPV 20 Type';
    if (c.includes('thinprep')) return 'Tế bào học ThinPrep';
    if (c.includes('cell')) return 'Tế bào học âm đạo';
    if (c.includes('soituoi')) return 'Soi tươi dịch âm đạo';
    if (c.includes('giaiphaubenh') || c.includes('gpb')) return 'Giải phẫu bệnh';
    return cat;
  }

  async getDoctors(): Promise<any[]> {
    return this.usersService.findDoctors();
  }

  async create(data: Partial<BioCase>, creatorUser?: any): Promise<BioCase> {
    const newCase = new this.caseModel({
      ...data,
      trangThai: data.trangThai || 'nhap_thong_tin',
      status: data.status || 'pending',
    });
    const saved = await newCase.save();

    // 1. Khi nguồn tạo đơn -> Thông báo tới Admin để còn biết nhận mẫu (nếu chính Admin tạo thì không tự thông báo cho chính mình)
    try {
      const isCreatedByAdmin =
        creatorUser?.role === 'admin' ||
        creatorUser?.role === 'superadmin' ||
        creatorUser?.username === 'admin' ||
        creatorUser?.username === 'superadmin';
      if (!isCreatedByAdmin) {
        const sourceName =
          saved.donVi ||
          (creatorUser?.role === 'lab' ? creatorUser.donVi : '') ||
          saved.nguoiNhap ||
          'Nguồn gửi mẫu';

        await this.notificationsService.createNotification({
          title: `Đơn xét nghiệm mới cần nhận mẫu: ${saved.maSo}`,
          message: `Đơn vị "${sourceName}" vừa tạo đơn xét nghiệm cho bệnh nhân ${saved.hoTen} (${saved.maSo}) - Dịch vụ: ${this.getCategoryLabel(saved.loaiXetNghiem)}. Vui lòng kiểm tra và tiếp nhận mẫu.`,
          testResultId: saved._id.toString(),
          caseCode: saved.maSo,
          patientName: saved.hoTen,
          sourceName: saved.donVi || sourceName,
          recipientRole: 'admin',
          type: 'new_order',
        });
      }

      // Nếu khi tạo đơn đã chỉ định sẵn bác sĩ đọc -> Thông báo tới Bác sĩ đó
      if (saved.bacSiDoc) {
        await this.notificationsService.createNotification({
          title: `Bạn có ca xét nghiệm mới cần đọc KQ: ${saved.maSo}`,
          message: `Bạn được phân công đọc kết quả xét nghiệm cho bệnh nhân ${saved.hoTen} (${saved.maSo}) - Dịch vụ: ${this.getCategoryLabel(saved.loaiXetNghiem)}. Vui lòng kiểm tra và chẩn đoán.`,
          testResultId: saved._id.toString(),
          caseCode: saved.maSo,
          patientName: saved.hoTen,
          doctorName: saved.bacSiDoc,
          recipientRole: 'doctor',
          type: 'doctor_assigned',
        });
      }
    } catch (err) {
      console.error('[CasesService.create] Lỗi tạo thông báo:', err);
    }

    return saved;
  }

  async update(id: string, data: Partial<BioCase>): Promise<BioCase> {
    const existing = await this.caseModel.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm để cập nhật');
    }

    const cleanData = { ...data };
    delete (cleanData as any)._id;
    delete (cleanData as any).createdAt;
    delete (cleanData as any).updatedAt;

    const updated = await this.caseModel.findByIdAndUpdate(
      id,
      { $set: cleanData },
      { returnDocument: 'after' },
    );
    if (!updated) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm để cập nhật');
    }

    // Kiểm tra & gửi thông báo theo các sự kiện cập nhật
    try {
      // 3b. Khi phân Bác sĩ mới qua form cập nhật -> Thông báo tới Bác sĩ
      if (
        data.bacSiDoc &&
        data.bacSiDoc.trim() &&
        data.bacSiDoc.trim() !== (existing.bacSiDoc || '').trim()
      ) {
        await this.notificationsService.createNotification({
          title: `Bạn có ca xét nghiệm mới được phân công: ${updated.maSo}`,
          message: `Bạn được phân công đọc kết quả xét nghiệm cho bệnh nhân ${updated.hoTen} (${updated.maSo}) - Dịch vụ: ${this.getCategoryLabel(updated.loaiXetNghiem)}. Vui lòng kiểm tra và chẩn đoán.`,
          testResultId: updated._id.toString(),
          caseCode: updated.maSo,
          patientName: updated.hoTen,
          doctorName: data.bacSiDoc.trim(),
          recipientRole: 'doctor',
          type: 'doctor_assigned',
        });
      }

      if (
        data.bacSiDoc2 &&
        data.bacSiDoc2.trim() &&
        data.bacSiDoc2.trim() !== (existing.bacSiDoc2 || '').trim()
      ) {
        await this.notificationsService.createNotification({
          title: `Bạn có ca xét nghiệm mới được phân công (Phần 2): ${updated.maSo}`,
          message: `Bạn được phân công đọc kết quả xét nghiệm phần Tế bào cho bệnh nhân ${updated.hoTen} (${updated.maSo}). Vui lòng kiểm tra và chẩn đoán.`,
          testResultId: updated._id.toString(),
          caseCode: updated.maSo,
          patientName: updated.hoTen,
          doctorName: data.bacSiDoc2.trim(),
          recipientRole: 'doctor',
          type: 'doctor_assigned',
        });
      }

      // 4b. Khi Bác sĩ ký duyệt (qua toggle nút Ký duyệt ở trang chi tiết) -> Thông báo lại Admin
      if (data.daKy === true && !existing.daKy) {
        const doc = data.bacSiDoc || updated.bacSiDoc || 'Bác sĩ';
        await this.notificationsService.createNotification({
          title: `Bác sĩ đã ký duyệt kết quả: ${updated.maSo}`,
          message: `Bác sĩ ${doc} đã ký duyệt hoàn tất kết quả xét nghiệm cho bệnh nhân ${updated.hoTen} (${updated.maSo}). Vui lòng kiểm tra và xác nhận trả kết quả.`,
          testResultId: updated._id.toString(),
          caseCode: updated.maSo,
          patientName: updated.hoTen,
          doctorName: doc,
          recipientRole: 'admin',
          type: 'result_signed',
        });
      }

      if (data.daKy2 === true && !existing.daKy2) {
        const doc2 = data.bacSiDoc2 || updated.bacSiDoc2 || 'Bác sĩ phần 2';
        await this.notificationsService.createNotification({
          title: `Bác sĩ đã ký duyệt kết quả Phần 2: ${updated.maSo}`,
          message: `Bác sĩ ${doc2} đã ký duyệt hoàn tất phần 2 cho bệnh nhân ${updated.hoTen} (${updated.maSo}). Vui lòng kiểm tra và xác nhận trả kết quả.`,
          testResultId: updated._id.toString(),
          caseCode: updated.maSo,
          patientName: updated.hoTen,
          doctorName: doc2,
          recipientRole: 'admin',
          type: 'result_signed',
        });
      }
    } catch (err) {
      console.error('[CasesService.update] Lỗi tạo thông báo:', err);
    }

    return updated;
  }

  // Tiếp nhận ca xét nghiệm (chuyển trạng thái sang chay_ket_qua)
  async acceptCase(id: string, bacSiDoc?: string, bacSiDoc2?: string): Promise<BioCase> {
    const existing = await this.caseModel.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm để tiếp nhận');
    }

    const now = new Date();
    const turnaroundMap = await this.settingsService.getTurnaroundTime();
    const hours = turnaroundMap[existing.loaiXetNghiem] || 24;
    const ngayDuKienTraDate = new Date(now.getTime() + hours * 3600 * 1000);

    const updatePayload: any = {
      trangThai: 'chay_ket_qua',
      status: 'tested',
      ngayNhanMau: existing.ngayNhanMau || now.toISOString(),
      ngayDuKienTra: ngayDuKienTraDate.toISOString(),
    };
    if (bacSiDoc) {
      updatePayload.bacSiDoc = bacSiDoc;
      updatePayload.doctorName = bacSiDoc;
    }
    if (bacSiDoc2) {
      updatePayload.bacSiDoc2 = bacSiDoc2;
    } else if (existing.loaiXetNghiem?.toLowerCase()?.startsWith('combo_') && !existing.bacSiDoc2 && bacSiDoc) {
      updatePayload.bacSiDoc2 = bacSiDoc;
    }

    const updated = await this.caseModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm để tiếp nhận');
    }

    // 2. Khi Admin nhận mẫu -> Thông báo lại Nguồn
    try {
      if (updated.donVi) {
        const docMsg = bacSiDoc2 && bacSiDoc2 !== bacSiDoc
          ? ` Bác sĩ phân công: BS1: ${bacSiDoc}, BS2: ${bacSiDoc2}.`
          : (bacSiDoc ? ` Bác sĩ phân công: ${bacSiDoc}.` : '');

        await this.notificationsService.createNotification({
          title: `Phòng Lab đã tiếp nhận mẫu: ${updated.maSo}`,
          message: `Mẫu xét nghiệm của bệnh nhân ${updated.hoTen} (${updated.maSo}) từ đơn vị "${updated.donVi}" đã được phòng Lab tiếp nhận và bắt đầu thực hiện xét nghiệm.${docMsg}`,
          testResultId: updated._id.toString(),
          caseCode: updated.maSo,
          patientName: updated.hoTen,
          sourceName: updated.donVi,
          recipientRole: 'source',
          type: 'sample_accepted',
        });
      }

      // 3. Khi phân Bác sĩ -> Thông báo tới Bác sĩ
      if (bacSiDoc) {
        await this.notificationsService.createNotification({
          title: `Bạn có ca xét nghiệm mới cần đọc KQ: ${updated.maSo}`,
          message: `Bạn được phân công đọc kết quả xét nghiệm cho bệnh nhân ${updated.hoTen} (${updated.maSo}) - Dịch vụ: ${this.getCategoryLabel(updated.loaiXetNghiem)}${updated.loaiXetNghiem?.startsWith('combo_') ? ' (Phần 1: HPV)' : ''}. Vui lòng kiểm tra và chẩn đoán.`,
          testResultId: updated._id.toString(),
          caseCode: updated.maSo,
          patientName: updated.hoTen,
          doctorName: bacSiDoc,
          recipientRole: 'doctor',
          type: 'doctor_assigned',
        });
      }

      if (bacSiDoc2 && bacSiDoc2 !== bacSiDoc) {
        await this.notificationsService.createNotification({
          title: `Bạn có ca xét nghiệm mới cần đọc KQ: ${updated.maSo}`,
          message: `Bạn được phân công đọc kết quả xét nghiệm cho bệnh nhân ${updated.hoTen} (${updated.maSo}) - Dịch vụ: ${this.getCategoryLabel(updated.loaiXetNghiem)} (Phần 2: Tế bào/ThinPrep). Vui lòng kiểm tra và chẩn đoán.`,
          testResultId: updated._id.toString(),
          caseCode: updated.maSo,
          patientName: updated.hoTen,
          doctorName: bacSiDoc2,
          recipientRole: 'doctor',
          type: 'doctor_assigned',
        });
      }
    } catch (err) {
      console.error('[CasesService.acceptCase] Lỗi tạo thông báo:', err);
    }

    return updated;
  }

  // Bác sĩ hoàn tất đọc kết quả & ký duyệt
  async signAndDiagnose(
    id: string,
    payload: {
      ketLuan: string;
      khuyenNghi?: string;
      bacSiDoc?: string;
      specificResults?: Partial<BioCase>;
    },
  ): Promise<BioCase> {
    const updateData: any = {
      ...payload.specificResults,
      ketLuan: payload.ketLuan,
      diagnosis: payload.ketLuan,
      khuyenNghi: payload.khuyenNghi || '',
      bacSiDoc: payload.bacSiDoc || '',
      doctorName: payload.bacSiDoc || '',
      daKy: true,
      trangThai: 'chay_ket_qua',
      status: 'diagnosed',
    };

    const updated = await this.caseModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm để ký duyệt');
    }

    // 4. Bác sĩ đọc và ký -> Thông báo lại Admin
    try {
      const doc = payload.bacSiDoc || updated.bacSiDoc || 'Bác sĩ';
      await this.notificationsService.createNotification({
        title: `Bác sĩ đã ký duyệt kết quả: ${updated.maSo}`,
        message: `Bác sĩ ${doc} đã hoàn tất đọc và ký duyệt kết quả cho bệnh nhân ${updated.hoTen} (${updated.maSo}). Vui lòng kiểm tra và xác nhận trả kết quả.`,
        testResultId: updated._id.toString(),
        caseCode: updated.maSo,
        patientName: updated.hoTen,
        doctorName: doc,
        recipientRole: 'admin',
        type: 'result_signed',
      });
    } catch (err) {
      console.error('[CasesService.signAndDiagnose] Lỗi tạo thông báo:', err);
    }

    return updated;
  }

  // Admin duyệt và Trả kết quả (da_tra_ket_qua) sau khi Bác sĩ đã ký duyệt
  async releaseResult(id: string): Promise<BioCase> {
    const existing = await this.caseModel.findById(id);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm');
    }

    const isReleased = existing.trangThai === 'da_tra_ket_qua';

    // Nếu chưa trả kết quả thì Bác sĩ bắt buộc phải ký duyệt trước
    if (!isReleased) {
      const isCombo = existing.loaiXetNghiem?.startsWith('combo_');
      const isSigned = isCombo
        ? !!(existing.daKy && existing.daKy2)
        : !!existing.daKy;

      if (!isSigned) {
        throw new BadRequestException(
          'Bác sĩ chưa ký duyệt đầy đủ kết quả, không thể xác nhận trả kết quả!',
        );
      }
    }

    const updated = await this.caseModel.findByIdAndUpdate(
      id,
      {
        $set: {
          trangThai: isReleased ? 'chay_ket_qua' : 'da_tra_ket_qua',
          status: isReleased ? 'testing' : 'diagnosed',
          ngayTraKetQua: isReleased
            ? null
            : new Date().toISOString().split('T')[0],
        },
      },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm');
    }

    // 5. Khi Admin trả kết quả -> Thông báo lại Nguồn
    try {
      if (updated.trangThai === 'da_tra_ket_qua' && updated.donVi) {
        await this.notificationsService.createNotification({
          title: `Đã có kết quả chính thức: ${updated.maSo}`,
          message: `Ca xét nghiệm của bệnh nhân ${updated.hoTen} (${updated.maSo}) từ đơn vị "${updated.donVi}" đã có kết quả chính thức và đã được đóng dấu phê duyệt. Bạn có thể xem và tải phiếu kết quả ngay.`,
          testResultId: updated._id.toString(),
          caseCode: updated.maSo,
          patientName: updated.hoTen,
          sourceName: updated.donVi,
          recipientRole: 'source',
          type: 'result_released',
        });
      }
    } catch (err) {
      console.error('[CasesService.releaseResult] Lỗi tạo thông báo:', err);
    }

    return updated;
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
        ketLuan: diagnosis,
        bacSiDoc: doctorName,
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

  // Thống kê số liệu hệ thống cho Dashboard
  async getStats(
    doctor?: string,
    donVi?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const andClauses: any[] = [];

    // Lọc theo bác sĩ (nếu đang ở chế độ xem Bác sĩ)
    if (doctor && doctor.trim() !== '') {
      andClauses.push({
        $or: [
          { bacSiDoc: new RegExp(doctor.trim(), 'i') },
          { doctorName: new RegExp(doctor.trim(), 'i') },
        ],
      });
    }

    // Lọc theo đơn vị gửi mẫu (nếu đang ở chế độ xem Bệnh viện/Lab)
    if (donVi && donVi.trim() !== '') {
      andClauses.push({
        donVi: new RegExp(donVi.trim(), 'i'),
      });
    }

    // Lọc theo khoảng ngày
    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      andClauses.push({ createdAt: dateFilter });
    }

    const buildQuery = (extraClause?: any) => {
      const list = [...andClauses];
      if (extraClause) list.push(extraClause);
      return list.length > 0 ? { $and: list } : {};
    };

    // 1. KPI Cards
    const total = await this.caseModel.countDocuments(buildQuery());
    const nhapThongTin = await this.caseModel.countDocuments(
      buildQuery({
        $or: [{ trangThai: 'nhap_thong_tin' }, { status: 'pending' }],
      }),
    );
    const chayKetQua = await this.caseModel.countDocuments(
      buildQuery({
        $or: [{ trangThai: 'chay_ket_qua' }, { status: 'tested' }],
      }),
    );
    const daTraKetQua = await this.caseModel.countDocuments(
      buildQuery({
        $or: [{ trangThai: 'da_tra_ket_qua' }, { status: 'diagnosed' }],
      }),
    );

    // 2. Chi tiết theo 7 gói dịch vụ chính GenHD
    const serviceConfigs = [
      { key: 'cell', label: 'CELL', color: '#0ea5e9', icon: 'pulse' },
      { key: 'thinprep', label: 'ThinPrep', color: '#a855f7', icon: 'flask' },
      { key: 'hpv40', label: 'HPV 40', color: '#6366f1', icon: 'sparkles' },
      { key: 'hpv20', label: 'HPV 20', color: '#14b8a6', icon: 'testtube' },
      { key: 'hpv23', label: 'HPV 23', color: '#06b6d4', icon: 'testtube2' },
      { key: 'soituoi', label: 'Soi tươi', color: '#10b981', icon: 'microscope' },
      { key: 'giaiphaubenh', label: 'GPB', color: '#f59e0b', icon: 'filetext' },
    ];

    const byCategory = await Promise.all(
      serviceConfigs.map(async (svc) => {
        const count = await this.caseModel.countDocuments(
          buildQuery({
            $or: [
              { loaiXetNghiem: svc.key },
              { testType: new RegExp(svc.key, 'i') },
            ],
          }),
        );
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        return {
          key: svc.key,
          label: svc.label,
          count,
          percentage,
          color: svc.color,
          icon: svc.icon,
        };
      }),
    );

    // 3. Thống kê theo Bác sĩ đọc kết quả (Tổng, Đã hoàn tất, Đang xử lý)
    const matchCriteria = buildQuery();
    const doctorAggregation = await this.caseModel.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            $cond: [
              { $or: [{ $eq: ['$bacSiDoc', ''] }, { $eq: ['$bacSiDoc', null] }] },
              'Chưa phân loại',
              '$bacSiDoc',
            ],
          },
          total: { $sum: 1 },
          daHoanTat: {
            $sum: {
              $cond: [
                { $in: ['$trangThai', ['da_tra_ket_qua', 'diagnosed']] },
                1,
                0,
              ],
            },
          },
          dangXuLy: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$trangThai',
                    ['chay_ket_qua', 'nhap_thong_tin', 'pending', 'tested'],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const byDoctor = doctorAggregation.map((item) => ({
      doctorName: item._id || 'Chưa phân loại',
      total: item.total,
      daHoanTat: item.daHoanTat,
      dangXuLy: item.dangXuLy,
    }));

    return {
      kpi: {
        total,
        nhapThongTin,
        chayKetQua,
        daTraKetQua,
      },
      byCategory,
      byDoctor,
      doctorView: doctor
        ? {
            isDoctor: true,
            doctorName: doctor,
          }
        : null,
    };
  }

  // Tạo nội dung CSV xuất Excel (có UTF-8 BOM chuẩn hiển thị tiếng Việt trên MS Excel)
  async exportExcelData(type: 'all' | 'doctor', doctor?: string, donVi?: string): Promise<string> {
    const stats = await this.getStats(doctor, donVi);
    const bom = '\uFEFF'; // UTF-8 BOM for Excel

    if (type === 'doctor') {
      let csv = `${bom}BÁC SĨ ĐỌC KẾT QUẢ,TỔNG SỐ PHIẾU,ĐÃ HOÀN TẤT,ĐANG XỬ LÝ,TỶ LỆ HOÀN TẤT\n`;
      for (const d of stats.byDoctor) {
        const rate = d.total > 0 ? Math.round((d.daHoanTat / d.total) * 100) : 0;
        csv += `"${d.doctorName}",${d.total},${d.daHoanTat},${d.dangXuLy},${rate}%\n`;
      }
      return csv;
    }

    // type === 'all'
    let csv = `${bom}BÁO CÁO THỐNG KÊ HOẠT ĐỘNG XÉT NGHIỆM GENHD\n`;
    csv += `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}\n\n`;
    csv += `CHỈ SỐ TỔNG QUAN\n`;
    csv += `Tổng số phiếu xét nghiệm,${stats.kpi.total}\n`;
    csv += `Nhập thông tin (Chờ nhận mẫu & xử lý),${stats.kpi.nhapThongTin}\n`;
    csv += `Đang chạy kết quả (Đang đọc mẫu & hoàn thiện),${stats.kpi.chayKetQua}\n`;
    csv += `Đã trả kết quả (Phiếu đã ký & hoàn tất),${stats.kpi.daTraKetQua}\n\n`;

    csv += `CHI TIẾT THEO GÓI DỊCH VỤ\n`;
    csv += `Gói Dịch Vụ,Số lượng phiếu,Tỷ lệ %\n`;
    for (const cat of stats.byCategory) {
      csv += `"${cat.label}",${cat.count},${cat.percentage}%\n`;
    }

    csv += `\nTIẾN ĐỘ THEO BÁC SĨ ĐỌC KẾT QUẢ\n`;
    csv += `Bác sĩ đọc kết quả,Tổng,Đã hoàn tất,Đang xử lý,Tỷ lệ hoàn tất\n`;
    for (const d of stats.byDoctor) {
      const rate = d.total > 0 ? Math.round((d.daHoanTat / d.total) * 100) : 0;
      csv += `"${d.doctorName}",${d.total},${d.daHoanTat},${d.dangXuLy},${rate}%\n`;
    }

    return csv;
  }

  // Xuất danh sách ca xét nghiệm ra file Excel (.xlsx) chuẩn định dạng ô lưới
  async exportCasesExcel(
    category?: string,
    month?: string,
    status?: string,
    doctor?: string,
    donVi?: string,
  ): Promise<Buffer> {
    const conditions: any[] = [];

    // Lọc theo trạng thái
    if (status && status !== 'all') {
      conditions.push({
        $or: [{ status }, { trangThai: status }],
      });
    }

    // Lọc theo danh mục dịch vụ (category)
    if (category && category !== 'all' && category !== 'dashboard') {
      conditions.push({
        $or: [
          { loaiXetNghiem: category },
          { testType: category },
        ],
      });
    }

    // Lọc theo tháng (month format YYYY-MM, e.g., '2026-09')
    if (month && month !== 'all' && /^\d{4}-\d{2}$/.test(month)) {
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(year, m, 0, 23, 59, 59, 999);
      conditions.push({
        createdAt: { $gte: startDate, $lte: endDate },
      });
    }

    // Lọc theo bác sĩ
    if (doctor && doctor.trim() !== '') {
      const regex = new RegExp(doctor.trim(), 'i');
      conditions.push({
        $or: [{ bacSiDoc: regex }, { bacSiDoc2: regex }, { doctorName: regex }],
      });
    }

    // Lọc theo đơn vị
    if (donVi && donVi.trim() !== '') {
      conditions.push({ donVi: new RegExp(donVi.trim(), 'i') });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};
    const cases = await this.caseModel
      .find(query)
      .select('-anhTeBao -anhTeBao2 -anhGpb -anhHpv -pdfBuffer -bieuDoHpv -signatureImage -anhSoiTuoi -anhSoiTuoi1 -anhSoiTuoi2 -anhKy -anhKy2')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GenHD System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Danh sách ca xét nghiệm', {
      views: [{ showGridLines: true }],
    });

    const categoryNamesMap: Record<string, string> = {
      cell: 'Xét nghiệm Cell',
      thinprep: 'Xét nghiệm ThinPrep',
      hpv40: 'Xét nghiệm HPV 40 Types',
      hpv20: 'Xét nghiệm HPV 20 Types',
      hpv23: 'Xét nghiệm HPV 23 Types',
      soituoi: 'Xét nghiệm Soi tươi',
      giaiphaubenh: 'Giải Phẫu Bệnh',
      combo_hpv20_cell: 'Combo HPV 20 + Cell',
      combo_hpv40_cell: 'Combo HPV 40 + Cell',
      combo_hpv23_cell: 'Combo HPV 23 + Cell',
      combo_hpv20_thinprep: 'Combo HPV 20 + ThinPrep',
      combo_hpv40_thinprep: 'Combo HPV 40 + ThinPrep',
      combo_hpv23_thinprep: 'Combo HPV 23 + ThinPrep',
    };

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'MÃ SỐ PHIẾU', key: 'maSo', width: 22 },
      { header: 'DỊCH VỤ XÉT NGHIỆM', key: 'loaiXetNghiem', width: 28 },
      { header: 'HỌ VÀ TÊN BỆNH NHÂN', key: 'hoTen', width: 28 },
      { header: 'NĂM SINH', key: 'namSinh', width: 12 },
      { header: 'GIỚI TÍNH', key: 'gioiTinh', width: 12 },
      { header: 'SỐ ĐIỆN THOẠI', key: 'soDienThoai', width: 18 },
      { header: 'ĐỊA CHỈ', key: 'diaChi', width: 35 },
      { header: 'LOẠI MẪU', key: 'loaiMau', width: 18 },
      { header: 'ĐƠN VỊ GỬI MẪU', key: 'donVi', width: 30 },
      { header: 'BÁC SĨ CHỈ ĐỊNH', key: 'bacSiChiDinh', width: 25 },
      { header: 'BÁC SĨ ĐỌC KẾT QUẢ', key: 'bacSiDoc', width: 30 },
      { header: 'KẾT LUẬN / CHẨN ĐOÁN', key: 'ketLuan', width: 45 },
      { header: 'TRẠNG THÁI', key: 'trangThai', width: 18 },
      { header: 'NGÀY TIẾP NHẬN', key: 'ngayNhanMau', width: 16 },
      { header: 'NGÀY DỰ KIẾN TRẢ', key: 'ngayDuKienTra', width: 16 },
      { header: 'NGÀY TRẢ KẾT QUẢ', key: 'ngayTraKetQua', width: 16 },
    ];

    // Định dạng tiêu đề cột (Header row)
    const headerRow = sheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0070F3' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF003399' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    // Thêm các dòng dữ liệu ca bệnh
    cases.forEach((c: any, index: number) => {
      const catLabel = categoryNamesMap[c.loaiXetNghiem] || c.loaiXetNghiem || '';
      const statusLabel =
        c.trangThai === 'da_tra_ket_qua'
          ? 'Đã trả kết quả'
          : c.trangThai === 'chay_ket_qua'
          ? 'Chạy kết quả'
          : 'Nhập thông tin';

      const doctorText = [c.bacSiDoc, c.bacSiDoc2].filter(Boolean).join(' & ');
      const nguoiNhapText =
        typeof c.nguoiNhap === 'object' ? c.nguoiNhap?.fullName : c.nguoiNhap || c.donVi || '';

      const formatDateStr = (dStr?: string) => {
        if (!dStr) return '';
        try {
          const d = new Date(dStr);
          if (isNaN(d.getTime())) return dStr;
          return d.toLocaleDateString('vi-VN');
        } catch {
          return dStr;
        }
      };

      const row = sheet.addRow({
        stt: index + 1,
        maSo: c.maSo || '',
        loaiXetNghiem: catLabel,
        hoTen: c.hoTen || '',
        namSinh: c.namSinh || '',
        gioiTinh: c.gioiTinh || '',
        soDienThoai: c.soDienThoai || '',
        diaChi: c.diaChi || '',
        loaiMau: c.loaiMau || '',
        donVi: nguoiNhapText,
        bacSiChiDinh: c.bacSiChiDinh || '',
        bacSiDoc: doctorText,
        ketLuan: c.ketLuan || c.chanDoanLamSang || '',
        trangThai: statusLabel,
        ngayNhanMau: formatDateStr(c.ngayNhanMau || c.createdAt),
        ngayDuKienTra: formatDateStr(c.ngayDuKienTra),
        ngayTraKetQua: formatDateStr(c.ngayTraKetQua),
      });

      row.height = 22;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: [1, 5, 6, 7, 14, 15, 16, 17].includes(colNumber) ? 'center' : 'left',
          wrapText: true,
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  async updateImageField(id: string, field: string, imageUrl: string): Promise<BioCase> {
    const allowedFields = [
      'anhTeBao',
      'anhTeBao2',
      'anhHpv',
      'anhGpb',
      'anhSoiTuoi',
      'anhKy',
      'anhSoiTuoi1',
      'anhSoiTuoi2',
      'anhKy2',
    ];
    if (!allowedFields.includes(field)) {
      throw new Error(`Trường ảnh '${field}' không hợp lệ`);
    }

    const updated = await this.caseModel
      .findByIdAndUpdate(id, { $set: { [field]: imageUrl } }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy phiếu xét nghiệm');
    }
    return updated;
  }
}
