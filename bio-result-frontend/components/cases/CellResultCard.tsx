'use client';

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Save,
  PenTool,
  RotateCcw,
  Loader2,
  ImageIcon,
  UploadCloud,
  X,
} from 'lucide-react';

interface CellResultCardProps {
  caseData: any;
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  onToggleSign?: (part?: number) => void;
  isSaving?: boolean;
  isCombo?: boolean;
}

// 1. BIẾN ĐỔI TẾ BÀO DO VI SINH VẬT
const BIEN_DOI_VI_SINH_OPTIONS = [
  { value: 'trichomonas', label: 'Trichomonas vaginalis' },
  { value: 'candida', label: 'Candida spp' },
  { value: 'tapKhuan', label: 'Tạp khuẩn' },
  { value: 'actinomyces', label: 'Actinomyces spp' },
  { value: 'gardnerella', label: 'Gardnerella vaginalis' },
  { value: 'hpv', label: 'HPV' },
];

// 2. BIẾN ĐỔI TẾ BÀO KHÁC
const BIEN_DOI_KHAC_OPTIONS = [
  { value: 'viem', label: 'Tế bào biến đổi do viêm' },
  { value: 'xaTri', label: 'Tế bào biến đổi do xạ trị' },
  { value: 'iud', label: 'Tế bào biến đổi do vòng tránh thai (IUD)' },
  { value: 'teo', label: 'Tế bào biểu mô teo' },
];

// 3. BẤT THƯỜNG TẾ BÀO VẢY
const BAT_THUONG_VAY_OPTIONS = [
  { value: 'ascUs', label: 'Tế bào vảy không điển hình ý nghĩa không xác định (ASC-US)' },
  { value: 'ascH', label: 'Tế bào vảy không điển hình, chưa loại trừ HSIL (ASC-H)' },
  { value: 'lsil', label: 'Tổn thương trong biểu mô vảy grade thấp (LSIL)' },
  { value: 'lsilHpv', label: 'Tổn thương trong biểu mô vảy grade thấp (LSIL) + HPV' },
  { value: 'hsil', label: 'Tổn thương trong biểu mô vảy grade cao (HSIL)' },
  { value: 'carcinomaVay', label: 'Carcinoma tế bào vảy' },
];

// 4. BẤT THƯỜNG TẾ BÀO TUYẾN
const BAT_THUONG_TUYEN_OPTIONS = [
  { value: 'agc', label: 'Tế bào tuyến không điển hình (AGC)' },
  { value: 'agcKdh', label: 'AGC, loại không đặc hiệu' },
  { value: 'agcKCtc', label: 'AGC, hướng về K tuyến CTC' },
  { value: 'agcKTuyen', label: 'AGC, hướng về K tuyến' },
  { value: 'carcinomaTaiCho', label: 'Carcinoma tuyến tại chỗ' },
  { value: 'carcinomaCtc', label: 'Carcinoma tuyến cổ trong CTC' },
  { value: 'carcinomaNoiMac', label: 'Carcinoma tuyến nội mạc tử cung' },
  { value: 'carcinomaKdh', label: 'Carcinoma tuyến, loại không đặc hiệu' },
];

export default function CellResultCard({
  caseData,
  onChange,
  onSave,
  onToggleSign,
  isSaving = false,
  isCombo = false,
}: CellResultCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Check if an option is selected
  const isChecked = (field: string, itemValue: string, itemLabel: string) => {
    const val = caseData?.[field];
    if (typeof val === 'boolean') return val;
    if (Array.isArray(val)) {
      return val.includes(itemValue) || val.includes(itemLabel);
    }
    if (typeof val === 'string') {
      const list = val.split(',').map((s) => s.trim());
      return list.includes(itemValue) || list.includes(itemLabel);
    }
    return false;
  };

  // Toggle item in array
  const toggleArrayItem = (field: string, itemValue: string) => {
    const val = caseData?.[field];
    let list: string[] = [];
    if (Array.isArray(val)) {
      list = [...val];
    } else if (typeof val === 'string' && val.length > 0) {
      list = val.split(',').map((s) => s.trim()).filter(Boolean);
    }

    if (list.includes(itemValue)) {
      list = list.filter((i) => i !== itemValue);
    } else {
      list.push(itemValue);
    }
    onChange(field, list);
  };

  // Upload handler for cell image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange('anhTeBao', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const isThinprep =
    caseData?.loaiXetNghiem === 'thinprep' ||
    caseData?.loaiXetNghiem?.endsWith('_thinprep');

  const testTitle = isThinprep
    ? 'KẾT QUẢ TẾ BÀO HỌC CỔ TỬ CUNG (THINPREP)'
    : 'KẾT QUẢ TẾ BÀO HỌC CỔ TỬ CUNG (BETHESDA 2014)';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-0">
      {/* Card Header */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5 text-[#0070f3] font-black text-sm uppercase tracking-tight">
          <Activity className="w-5 h-5 text-[#0070f3]" />
          <span>{testTitle}</span>
        </div>

        <div className="flex items-center gap-3">
          {caseData?.trangThai === 'da_tra_ket_qua' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ĐÃ TRẢ KẾT QUẢ</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <span>{collapsed ? 'Mở rộng' : 'Thu gọn'}</span>
            {collapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Section 1: TÍNH CHẤT BỆNH PHẨM */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
              TÍNH CHẤT BỆNH PHẨM
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 cursor-pointer font-semibold text-slate-800">
                <input
                  type="radio"
                  name="tinhChatBenhPham"
                  value="dat"
                  checked={(caseData?.tinhChatBenhPham || 'dat') === 'dat'}
                  onChange={() => onChange('tinhChatBenhPham', 'dat')}
                  className="w-4 h-4 text-[#0070f3] focus:ring-[#0070f3]"
                />
                <span>Đạt tiêu chuẩn đánh giá</span>
              </label>

              <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 cursor-pointer font-semibold text-slate-800">
                <input
                  type="radio"
                  name="tinhChatBenhPham"
                  value="khong_dat"
                  checked={caseData?.tinhChatBenhPham === 'khong_dat'}
                  onChange={() => onChange('tinhChatBenhPham', 'khong_dat')}
                  className="w-4 h-4 text-[#0070f3] focus:ring-[#0070f3]"
                />
                <span>Không đạt tiêu chuẩn</span>
              </label>
            </div>
          </div>

          {/* Section 2: NILM & Tế bào bất thường khác */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label
              className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                caseData?.khongTonThuong
                  ? 'border-[#0070f3] bg-blue-50/50 font-bold text-[#0070f3]'
                  : 'border-slate-200 bg-slate-50/40 text-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={!!caseData?.khongTonThuong}
                onChange={(e) => onChange('khongTonThuong', e.target.checked)}
                className="w-4 h-4 rounded text-[#0070f3] focus:ring-[#0070f3]"
              />
              <span>Không tổn thương trong biểu mô hay ác tính</span>
            </label>

            <label
              className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                caseData?.batThuongKhac
                  ? 'border-[#0070f3] bg-blue-50/50 font-bold text-[#0070f3]'
                  : 'border-slate-200 bg-slate-50/40 text-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={!!caseData?.batThuongKhac}
                onChange={(e) => onChange('batThuongKhac', e.target.checked)}
                className="w-4 h-4 rounded text-[#0070f3] focus:ring-[#0070f3]"
              />
              <span>Tế bào bất thường khác</span>
            </label>

            <label
              className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                caseData?.teBaoNoiMac
                  ? 'border-[#0070f3] bg-blue-50/50 font-bold text-[#0070f3]'
                  : 'border-slate-200 bg-slate-50/40 text-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={!!caseData?.teBaoNoiMac}
                onChange={(e) => onChange('teBaoNoiMac', e.target.checked)}
                className="w-4 h-4 rounded text-[#0070f3] focus:ring-[#0070f3]"
              />
              <span>Tế bào nội mạc tử cung ở phụ nữ ≥ 45 tuổi</span>
            </label>
          </div>

          {/* Section 3: BIẾN ĐỔI TẾ BÀO DO VI SINH VẬT */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-sky-800 uppercase tracking-wider">
              BIẾN ĐỔI TẾ BÀO DO VI SINH VẬT
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {BIEN_DOI_VI_SINH_OPTIONS.map((item) => {
                const checked = isChecked('bienDoiViSinh', item.value, item.label);
                return (
                  <label
                    key={item.value}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      checked
                        ? 'border-[#0070f3] bg-blue-50/50 font-bold text-[#0070f3]'
                        : 'border-slate-200 bg-slate-50/30 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayItem('bienDoiViSinh', item.value)}
                      className="w-4 h-4 rounded text-[#0070f3] focus:ring-[#0070f3]"
                    />
                    <span
                      className={`text-xs ${
                        item.value === 'hpv' || item.value === 'tapKhuan' ? '' : 'italic'
                      }`}
                    >
                      {item.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: BIẾN ĐỔI TẾ BÀO KHÁC */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-sky-800 uppercase tracking-wider">
              BIẾN ĐỔI TẾ BÀO KHÁC
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {BIEN_DOI_KHAC_OPTIONS.map((item) => {
                const checked = isChecked('bienDoiKhac', item.value, item.label);
                return (
                  <label
                    key={item.value}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      checked
                        ? 'border-[#0070f3] bg-blue-50/50 font-bold text-[#0070f3]'
                        : 'border-slate-200 bg-slate-50/30 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayItem('bienDoiKhac', item.value)}
                      className="w-4 h-4 rounded text-[#0070f3] focus:ring-[#0070f3]"
                    />
                    <span className="text-xs">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 5: BẤT THƯỜNG TẾ BÀO VẢY */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-sky-800 uppercase tracking-wider">
              BẤT THƯỜNG TẾ BÀO VẢY
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {BAT_THUONG_VAY_OPTIONS.map((item) => {
                const checked = isChecked('batThuongVay', item.value, item.label);
                return (
                  <label
                    key={item.value}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      checked
                        ? 'border-[#0070f3] bg-blue-50/50 font-bold text-[#0070f3]'
                        : 'border-slate-200 bg-slate-50/30 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayItem('batThuongVay', item.value)}
                      className="w-4 h-4 rounded text-[#0070f3] focus:ring-[#0070f3]"
                    />
                    <span className="text-xs leading-tight">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 6: BẤT THƯỜNG TẾ BÀO TUYẾN */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-sky-800 uppercase tracking-wider">
              BẤT THƯỜNG TẾ BÀO TUYẾN
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {BAT_THUONG_TUYEN_OPTIONS.map((item) => {
                const checked = isChecked('batThuongTuyen', item.value, item.label);
                return (
                  <label
                    key={item.value}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      checked
                        ? 'border-[#0070f3] bg-blue-50/50 font-bold text-[#0070f3]'
                        : 'border-slate-200 bg-slate-50/30 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayItem('batThuongTuyen', item.value)}
                      className="w-4 h-4 rounded text-[#0070f3] focus:ring-[#0070f3]"
                    />
                    <span className="text-xs leading-tight">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 7: KẾT LUẬN TẾ BÀO HỌC */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-sky-800 mb-1.5 uppercase">
                KẾT LUẬN TẾ BÀO HỌC *
              </label>
              <textarea
                rows={3}
                value={
                  (isCombo ? caseData?.ketLuan2 : caseData?.ketLuan) ||
                  'KHÔNG THẤY TẾ BÀO BẤT THƯỜNG TRÊN PHIẾN ĐỒ'
                }
                onChange={(e) => onChange(isCombo ? 'ketLuan2' : 'ketLuan', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 bg-sky-50/30 text-xs font-bold text-sky-900 focus:bg-white focus:outline-none focus:border-[#0070f3] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                KHUYẾN NGHỊ / ĐỀ NGHỊ
              </label>
              <textarea
                rows={2}
                value={caseData?.khuyenNghi || ''}
                onChange={(e) => onChange('khuyenNghi', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#0070f3] transition-all"
              />
            </div>
          </div>

          {/* Section 8: Ảnh tiêu bản tế bào học (Kính hiển vi / ThinPrep) - CHUẨN GENHD */}
          <div className="space-y-2 pt-2">
            <label className="font-bold text-slate-700 text-xs block flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-sky-600" />
              <span>Ảnh tiêu bản tế bào học (Kính hiển vi / ThinPrep)</span>
            </label>
            <p className="text-[11px] text-slate-500 font-medium">Tải ảnh tiêu bản tế bào</p>

            <div className="relative border-2 border-dashed border-sky-200 hover:border-sky-400 bg-sky-50/20 hover:bg-sky-50/50 rounded-2xl p-6 transition-all text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {caseData?.anhTeBao ? (
                <div className="relative inline-block group">
                  {/* Image Preview */}
                  <img
                    src={caseData.anhTeBao}
                    alt="Tiêu bản tế bào"
                    className="max-h-56 rounded-xl shadow-md border border-slate-200 object-contain mx-auto"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange('anhTeBao', '');
                    }}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md z-20 cursor-pointer transition-all"
                    title="Xóa ảnh"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-3">
                  <div className="p-3 bg-sky-100/80 text-sky-600 rounded-full">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Nhấp hoặc kéo thả file vào đây
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Định dạng hỗ trợ: image/*
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 9: Bác sĩ đọc kết quả & Ký duyệt (Thùng màu tím nhạt chuẩn GenHD) */}
          <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs">
              <div>
                <span className="text-xs text-purple-800 font-bold block mb-1">
                  {isCombo ? 'Bác sĩ đọc Tế bào (Phần 2):' : 'Bác sĩ đọc kết quả:'}
                </span>
                <select
                  value={(isCombo ? caseData?.bacSiDoc2 : caseData?.bacSiDoc) || 'BS CK1 PHẠM THẾ HÙNG'}
                  onChange={(e) => onChange(isCombo ? 'bacSiDoc2' : 'bacSiDoc', e.target.value)}
                  className="form-select text-xs py-1.5 px-3 font-bold text-purple-700 rounded-lg border-purple-300 bg-white shadow-2xs focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="BS CK1 PHẠM THẾ HÙNG">BS CK1 PHẠM THẾ HÙNG</option>
                  <option value="TS . BS Nguyễn Khánh Dương">TS . BS Nguyễn Khánh Dương</option>
                  <option value="BS. Trần Văn Trực">BS. Trần Văn Trực</option>
                </select>
              </div>

              <div>
                <span className="text-xs text-purple-800 font-bold block mb-1">
                  Ngày ký:
                </span>
                <input
                  type="date"
                  value={
                    (isCombo ? caseData?.ngayXetNghiem2 : caseData?.ngayTraKetQua)
                      ? (isCombo ? caseData.ngayXetNghiem2 : caseData.ngayTraKetQua).split('T')[0]
                      : new Date().toISOString().split('T')[0]
                  }
                  onChange={(e) => onChange(isCombo ? 'ngayXetNghiem2' : 'ngayTraKetQua', e.target.value)}
                  className="text-xs py-1.5 px-3 font-bold text-purple-700 rounded-lg border-purple-300 bg-white shadow-2xs focus:outline-none focus:border-purple-500 cursor-pointer"
                />
              </div>

              <div className="pt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{(isCombo ? caseData?.daKy2 : caseData?.daKy) ? 'ĐÃ KÝ DUYỆT' : 'CHƯA KÝ'}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Lưu kết quả Tế bào</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleSign && onToggleSign(isCombo ? 2 : 1)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
                  (isCombo ? caseData?.daKy2 : caseData?.daKy)
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {(isCombo ? caseData?.daKy2 : caseData?.daKy) ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isCombo ? 'Hủy chữ ký P2' : 'Hủy chữ ký'}</span>
                  </>
                ) : (
                  <>
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{isCombo ? 'Lưu & Ký duyệt P2 (Tế bào)' : 'Lưu & Ký duyệt'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
