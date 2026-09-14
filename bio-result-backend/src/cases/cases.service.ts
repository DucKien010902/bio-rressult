import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BioCase, CaseStatus } from './schemas/case.schema.js';

@Injectable()
export class CasesService {
  constructor(
    @InjectModel(BioCase.name) private caseModel: Model<BioCase>,
  ) {}

  async findAll(
    status?: string,
    keyword?: string,
    category?: string,
    doctor?: string,
    donVi?: string,
  ): Promise<BioCase[]> {
    const query: any = {};

    // Lọc theo trạng thái
    if (status && status !== 'all') {
      query.$or = [{ status }, { trangThai: status }];
    }

    // Lọc theo danh mục dịch vụ (cell, thinprep, hpv40, combo...)
    if (category && category !== 'all') {
      query.$or = [
        { loaiXetNghiem: category },
        { testType: new RegExp(category, 'i') },
      ];
    }

    // Lọc theo bác sĩ đọc kết quả
    if (doctor && doctor.trim() !== '') {
      query.$or = [
        { bacSiDoc: new RegExp(doctor.trim(), 'i') },
        { doctorName: new RegExp(doctor.trim(), 'i') },
      ];
    }

    // Lọc theo đơn vị gửi mẫu
    if (donVi && donVi.trim() !== '') {
      query.donVi = new RegExp(donVi.trim(), 'i');
    }

    // Tìm kiếm từ khóa (Mã số, tên bệnh nhân, điện thoại...)
    if (keyword && keyword.trim() !== '') {
      const regex = new RegExp(keyword.trim(), 'i');
      query.$or = [
        { hoTen: regex },
        { patientName: regex },
        { maSo: regex },
        { patientCode: regex },
        { soDienThoai: regex },
        { donVi: regex },
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
      trangThai: data.trangThai || 'nhap_thong_tin',
      status: data.status || 'pending',
    });
    return newCase.save();
  }

  async update(id: string, data: Partial<BioCase>): Promise<BioCase> {
    const updated = await this.caseModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm để cập nhật');
    }
    return updated;
  }

  // Tiếp nhận ca xét nghiệm (chuyển trạng thái sang chay_ket_qua)
  async acceptCase(id: string, bacSiDoc?: string): Promise<BioCase> {
    const updatePayload: any = {
      trangThai: 'chay_ket_qua',
      status: 'tested',
    };
    if (bacSiDoc) {
      updatePayload.bacSiDoc = bacSiDoc;
      updatePayload.doctorName = bacSiDoc;
    }
    const updated = await this.caseModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm để tiếp nhận');
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
    return updated;
  }

  // Admin duyệt và Trả kết quả (da_tra_ket_qua)
  async releaseResult(id: string): Promise<BioCase> {
    const updated = await this.caseModel.findByIdAndUpdate(
      id,
      {
        $set: {
          trangThai: 'da_tra_ket_qua',
          status: 'diagnosed',
          ngayTraKetQua: new Date().toISOString().split('T')[0],
        },
      },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Không tìm thấy ca xét nghiệm');
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
}
