import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CaseStatus =
  | 'nhap_thong_tin'
  | 'chay_ket_qua'
  | 'da_tra_ket_qua'
  | 'pending'
  | 'tested'
  | 'diagnosed';

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

@Schema({ _id: false })
export class EditHistory {
  @Prop({ default: '' })
  nguoiSua!: string;

  @Prop({ default: '' })
  thoiGian!: string;

  @Prop({ default: '' })
  noiDung!: string;
}

export const EditHistorySchema = SchemaFactory.createForClass(EditHistory);

@Schema({ timestamps: true, collection: 'biocases' })
export class BioCase extends Document {
  // --- Mã số & Phân loại dịch vụ ---
  @Prop({ required: true, unique: true, index: true })
  maSo!: string; // Barcode / Mã phiếu: ví dụ "GTHD-CB23TP022"

  @Prop({ default: '', index: true })
  loaiXetNghiem!: string; // 'cell', 'thinprep', 'hpv40', 'hpv20', 'combo...', 'soituoi', 'giaiphaubenh'

  // --- Thông tin hành chính bệnh nhân ---
  @Prop({ required: true })
  hoTen!: string;

  @Prop({ default: 0 })
  namSinh!: number;

  @Prop({ default: 'Nữ', enum: ['Nam', 'Nữ', 'Khác'] })
  gioiTinh!: string;

  @Prop({ default: '' })
  soDienThoai!: string;

  @Prop({ default: '' })
  diaChi!: string;

  @Prop({ default: 'Dịch phết' })
  loaiMau!: string;

  @Prop({ default: '' })
  donVi!: string; // Tên đơn vị / Bệnh viện gửi mẫu (VD: BV ĐHQG, BV Sản Nhi Ninh Bình)

  @Prop({ default: '' })
  bacSiChiDinh!: string; // Bác sĩ chỉ định ban đầu

  @Prop({ default: '' })
  chanDoanLamSang!: string; // Chẩn đoán lâm sàng

  // --- Thời gian & Nhân sự phụ trách ---
  @Prop({ default: '' })
  nguoiNhap!: string;

  @Prop({ default: '' })
  ngayNhanMau!: string;

  @Prop({ default: '' })
  ngayXetNghiem!: string;

  @Prop({ default: '' })
  ngayDuKienTra!: string;

  @Prop({ default: '' })
  ngayTraKetQua!: string;

  // --- Chuyên môn: Tế bào học (Cell / ThinPrep / Giải phẫu bệnh) ---
  @Prop({ default: '' })
  viTriBenhPham!: string;

  @Prop({ default: 'Đạt yêu cầu' })
  tinhChatBenhPham!: string;

  @Prop({ default: '' })
  lyDoKhongDat!: string;

  @Prop({ default: '' })
  daiThe!: string; // Mô tả đại thể

  @Prop({ default: '' })
  viThe!: string; // Mô tả vi thể

  @Prop({ default: '' })
  nhanXetDaiThe!: string;

  @Prop({ default: '' })
  khongTonThuong!: string; // Không tổn thương trong biểu mô hay ác tính (NILM)

  @Prop({ default: '' })
  bienDoiViSinh!: string; // Biến đổi do vi sinh (nấm, trùng roi, tạp khuẩn...)

  @Prop({ default: '' })
  bienDoiKhac!: string; // Biến đổi tế bào phản ứng khác

  @Prop({ default: '' })
  batThuongVay!: string; // Tế bào biểu mô vảy (ASC-US, ASC-H, LSIL, HSIL, SCC)

  @Prop({ default: '' })
  batThuongTuyen!: string; // Tế bào biểu mô tuyến (AGC, AIS, Adenocarcinoma)

  @Prop({ default: '' })
  batThuongKhac!: string;

  // --- Chuyên môn: Xét nghiệm HPV (Vi sinh phân tử) ---
  @Prop({ default: '' })
  hpvHighRiskResult!: string; // Kết quả HPV nhóm nguy cơ cao (16, 18...)

  @Prop({ default: '' })
  hpvHighRiskOtherResult!: string; // Các tuýp nguy cơ cao khác

  @Prop({ default: '' })
  hpvLowRiskResult!: string; // Các tuýp nguy cơ thấp (6, 11...)

  @Prop({ default: '' })
  hpvOtherTypesResult!: string;

  @Prop({ default: true })
  hienBieuDo!: boolean; // Bật / Tắt vẽ biểu đồ phân tích trên phiếu PDF

  @Prop({ default: '' })
  anhHpv!: string; // Ảnh biểu đồ chạy máy / Gel PCR

  // --- Kết luận, Khuyến nghị & Ký duyệt Bác sĩ ---
  @Prop({ default: '' })
  ketLuan!: string;

  @Prop({ default: '' })
  ketLuan2!: string;

  @Prop({ default: '' })
  khuyenNghi!: string;

  @Prop({ default: '' })
  bacSiDoc!: string; // Bác sĩ đọc kết quả 1

  @Prop({ default: '' })
  bacSiDoc2!: string; // Bác sĩ đọc kết quả 2

  @Prop({ default: false })
  daKy!: boolean; // Bác sĩ 1 đã ký số / phê duyệt

  @Prop({ default: false })
  daKy2!: boolean;

  // --- Trạng thái vòng đời phiếu ---
  @Prop({
    required: true,
    enum: [
      'nhap_thong_tin',
      'chay_ket_qua',
      'da_tra_ket_qua',
      'pending',
      'tested',
      'diagnosed',
    ],
    default: 'nhap_thong_tin',
    index: true,
  })
  trangThai!: CaseStatus;

  // --- Bảng chỉ số xét nghiệm & Lịch sử sửa ---
  @Prop({ type: [LabMetricSchema], default: [] })
  labMetrics!: LabMetric[];

  @Prop({ type: [EditHistorySchema], default: [] })
  lichSuChinhSua!: EditHistory[];

  // ==========================================
  // Các trường tương thích ngược (Legacy support)
  // ==========================================
  @Prop({ default: '' })
  patientCode!: string;

  @Prop({ default: '' })
  patientName!: string;

  @Prop({ default: 0 })
  age!: number;

  @Prop({ default: '' })
  gender!: string;

  @Prop({ default: '' })
  testType!: string;

  @Prop({ default: '' })
  sampleDate!: string;

  @Prop({ default: '' })
  sampleType!: string;

  @Prop({ default: '' })
  status!: string;

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

// Middleware tự động đồng bộ trường cũ và mới trước khi lưu
BioCaseSchema.pre('save', function () {
  if (!this.patientCode && this.maSo) this.patientCode = this.maSo;
  if (!this.maSo && this.patientCode) this.maSo = this.patientCode;

  if (!this.patientName && this.hoTen) this.patientName = this.hoTen;
  if (!this.hoTen && this.patientName) this.hoTen = this.patientName;

  if (!this.namSinh && this.age) {
    this.namSinh = new Date().getFullYear() - this.age;
  }
  if (!this.age && this.namSinh) {
    this.age = new Date().getFullYear() - this.namSinh;
  }

  if (!this.loaiXetNghiem && this.testType)
    this.loaiXetNghiem = this.testType;
  if (!this.testType && this.loaiXetNghiem)
    this.testType = this.loaiXetNghiem;

  if (!this.loaiMau && this.sampleType) this.loaiMau = this.sampleType;
  if (!this.sampleType && this.loaiMau) this.sampleType = this.loaiMau;

  if (!this.bacSiDoc && this.doctorName) this.bacSiDoc = this.doctorName;
  if (!this.doctorName && this.bacSiDoc) this.doctorName = this.bacSiDoc;

  if (!this.ketLuan && this.diagnosis) this.ketLuan = this.diagnosis;
  if (!this.diagnosis && this.ketLuan) this.diagnosis = this.ketLuan;
});
