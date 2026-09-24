'use client';

import React, { useState } from 'react';
import {
  Dna,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Save,
  PenTool,
  RotateCcw,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';

interface HpvResultCardProps {
  caseData: any;
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  onToggleSign?: (part?: number) => void;
  isSaving?: boolean;
  isCombo?: boolean;
}

export default function HpvResultCard({
  caseData,
  onChange,
  onSave,
  onToggleSign,
  isSaving = false,
  isCombo = false,
}: HpvResultCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  const cat = (caseData?.loaiXetNghiem || 'hpv40').toLowerCase();
  const isHpv40 = cat === 'hpv40' || cat === 'combo_hpv40_cell' || cat === 'combo_hpv40_thinprep';
  const isHpv23 = cat === 'hpv23' || cat === 'combo_hpv23_cell' || cat === 'combo_hpv23_thinprep';
  const isHpv20 = !isHpv40 && !isHpv23;

  const testTitle = isHpv40
    ? 'KẾT QUẢ XÉT NGHIỆM HPV 40 TYPES (REAL-TIME PCR)'
    : isHpv23
    ? 'KẾT QUẢ XÉT NGHIỆM HPV 23 TYPES (REAL-TIME PCR)'
    : 'KẾT QUẢ XÉT NGHIỆM HPV 20 TYPES (REAL-TIME PCR)';

  // Upload handler for HPV Graph
  const handleGraphUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange('anhHpv', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-0">
      {/* Card Header */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-tight">
          <Dna className="w-5 h-5 text-indigo-600" />
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
          {/* HPV Risk Groups Section */}
          <div className="space-y-4">
            {/* Group 1: HPV Nguy cơ cao 16, 18 (All types) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-red-700 uppercase block">
                  1. NHÓM HPV NGUY CƠ CAO (TYPE 16, 18)
                </span>
                <span className="text-xs text-slate-500">
                  Khảo sát 2 chủng nguy cơ cao nhất: 16, 18
                </span>
              </div>
              <input
                type="text"
                value={caseData?.hpvHighRiskResult || 'Âm tính'}
                onChange={(e) => onChange('hpvHighRiskResult', e.target.value)}
                placeholder="Âm tính / Dương tính..."
                className="w-full sm:w-48 px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50/50 font-bold text-xs text-red-700 focus:outline-none focus:border-red-400 text-center"
              />
            </div>

            {/* Group 2: HPV Nguy cơ cao khác */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-red-700 uppercase block">
                  2. NHÓM HPV NGUY CƠ CAO KHÁC ({isHpv23 ? '10 TYPES' : '16 TYPES'})
                </span>
                <span className="text-xs text-slate-500">
                  {isHpv23
                    ? 'Khảo sát 10 chủng: 31, 33, 35, 39, 45, 51, 52, 56, 58, 59'
                    : 'Khảo sát 16 chủng: 26, 31, 33, 35, 39, 45, 51, 52, 53, 56, 58, 59, 66, 68, 73, 82'}
                </span>
              </div>
              <input
                type="text"
                value={caseData?.hpvHighRiskOtherResult || 'Âm tính'}
                onChange={(e) => onChange('hpvHighRiskOtherResult', e.target.value)}
                placeholder="Âm tính / Dương tính..."
                className="w-full sm:w-48 px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50/50 font-bold text-xs text-red-700 focus:outline-none focus:border-red-400 text-center"
              />
            </div>

            {/* HPV 23 Specific Group 3: Các type HPV khác (9 types) */}
            {isHpv23 && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-red-700 uppercase block">
                    3. CÁC TYPE HPV KHÁC (9 TYPES)
                  </span>
                  <span className="text-xs text-slate-500">
                    Khảo sát 9 chủng: 66, 68, 42, 43, 44, 53, 81, 82, 73
                  </span>
                </div>
                <input
                  type="text"
                  value={caseData?.hpvOtherTypesResult || 'Âm tính'}
                  onChange={(e) => onChange('hpvOtherTypesResult', e.target.value)}
                  placeholder="Âm tính / Dương tính..."
                  className="w-full sm:w-48 px-3.5 py-1.5 rounded-lg border border-red-200 bg-red-50/50 font-bold text-xs text-red-700 focus:outline-none focus:border-red-400 text-center"
                />
              </div>
            )}

            {/* Low Risk Group (Group 3 for HPV40/20, Group 4 for HPV23) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-sky-700 uppercase block">
                  {isHpv23 ? '4. NHÓM HPV NGUY CƠ THẤP (2 TYPES)' : '3. NHÓM HPV NGUY CƠ THẤP (2 TYPES)'}
                </span>
                <span className="text-xs text-slate-500">
                  Khảo sát 2 chủng: 6, 11
                </span>
              </div>
              <input
                type="text"
                value={caseData?.hpvLowRiskResult || 'Âm tính'}
                onChange={(e) => onChange('hpvLowRiskResult', e.target.value)}
                placeholder="Âm tính / Dương tính..."
                className="w-full sm:w-48 px-3.5 py-1.5 rounded-lg border border-sky-200 bg-sky-50/50 font-bold text-xs text-sky-700 focus:outline-none focus:border-sky-400 text-center"
              />
            </div>

            {/* HPV 40 Specific Group 4: Các type HPV khác (20 types) */}
            {isHpv40 && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase block">
                    4. CÁC TYPE HPV KHÁC (20 TYPES)
                  </span>
                  <span className="text-xs text-slate-500">
                    Khảo sát 20 chủng: 30, 32, 34, 40, 42, 43, 44, 54, 55, 61, 62, 67, 71, 72, 74, 81, 83, 84, 87, 90
                  </span>
                </div>
                <input
                  type="text"
                  value={caseData?.hpvOtherTypesResult || 'Âm tính'}
                  onChange={(e) => onChange('hpvOtherTypesResult', e.target.value)}
                  placeholder="Âm tính / Dương tính..."
                  className="w-full sm:w-48 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-700 focus:outline-none focus:border-slate-400 text-center"
                />
              </div>
            )}
          </div>

          {/* Section: Biểu đồ Real-time PCR */}
          <div className="mt-2 mb-4 space-y-3">
            <div className="flex items-center gap-2 p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
              <input
                type="checkbox"
                id="hienBieuDo"
                checked={!!caseData?.hienBieuDo}
                onChange={(e) => onChange('hienBieuDo', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="hienBieuDo"
                className="text-xs font-bold text-indigo-900 cursor-pointer select-none"
              >
                Đính kèm / Tải lên biểu đồ HPV (Real-time PCR)
              </label>
            </div>

            {caseData?.hienBieuDo && (
              <div className="p-4 bg-white rounded-xl border-2 border-dashed border-sky-400 shadow-2xs transition-all space-y-3">
                <div className="text-xs font-bold text-sky-800 tracking-wide pb-2 border-b border-sky-100 flex items-center justify-between">
                  <span>BIỂU ĐỒ TÍN HIỆU TẢI LƯỢNG KẾT QUẢ (REAL-TIME PCR)</span>
                </div>

                <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200 text-center min-h-[140px] flex flex-col items-center justify-center relative">
                  {caseData?.anhHpv ? (
                    <div className="relative inline-block group w-full">
                      <img
                        src={caseData.anhHpv}
                        alt="Biểu đồ HPV"
                        className="max-h-56 rounded-lg shadow-sm border border-slate-200 object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => onChange('anhHpv', '')}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md cursor-pointer transition-all"
                        title="Xóa ảnh biểu đồ"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs italic text-slate-400 block">
                        [ Khung hiển thị đồ thị tín hiệu huỳnh quang Real-time PCR / Đồ thị điện di ]
                      </span>
                      <label className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-all">
                        <UploadCloud className="w-4 h-4 text-sky-600" />
                        <span>Tải ảnh biểu đồ HPV</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleGraphUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section: Kết luận & Khuyến nghị */}
          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-indigo-800 mb-1.5 uppercase">
                KẾT LUẬN XÉT NGHIỆM HPV *
              </label>
              <textarea
                rows={2}
                value={
                  caseData?.ketLuan ||
                  `ÂM TÍNH VỚI VIRUS HPV (${isHpv40 ? '40' : isHpv23 ? '23' : '20'} TYPE TRÊN) TRÊN MẪU NHẬN ĐƯỢC.`
                }
                onChange={(e) => onChange('ketLuan', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 text-xs font-bold text-indigo-950 focus:bg-white focus:outline-none focus:border-[#0070f3] transition-all"
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

          {/* Section: Bác sĩ đọc kết quả & Ký duyệt (Thùng màu indigo nhạt chuẩn GenHD) */}
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs">
              <div>
                <span className="text-xs text-indigo-800 font-bold block mb-1">
                  {isCombo ? 'Bác sĩ đọc HPV (Phần 1):' : 'Bác sĩ đọc kết quả:'}
                </span>
                <select
                  value={caseData?.bacSiDoc || 'TS . BS Nguyễn Khánh Dương'}
                  onChange={(e) => onChange('bacSiDoc', e.target.value)}
                  className="form-select text-xs py-1.5 px-3 font-bold text-sky-700 rounded-lg border-sky-300 bg-white shadow-2xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="TS . BS Nguyễn Khánh Dương">TS . BS Nguyễn Khánh Dương</option>
                  <option value="BS CK1 PHẠM THẾ HÙNG">BS CK1 PHẠM THẾ HÙNG</option>
                  <option value="BS. Trần Văn Trực">BS. Trần Văn Trực</option>
                </select>
              </div>

              <div>
                <span className="text-xs text-indigo-800 font-bold block mb-1">
                  Ngày ký:
                </span>
                <input
                  type="date"
                  value={
                    caseData?.ngayTraKetQua
                      ? caseData.ngayTraKetQua.split('T')[0]
                      : new Date().toISOString().split('T')[0]
                  }
                  onChange={(e) => onChange('ngayTraKetQua', e.target.value)}
                  className="text-xs py-1 px-2.5 font-bold text-slate-800 rounded-lg border-indigo-300 bg-white shadow-2xs w-44 cursor-pointer"
                />
              </div>

              <div className="pt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{caseData?.daKy ? 'ĐÃ KÝ DUYỆT' : 'CHƯA KÝ'}</span>
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
                <span>Lưu kết quả HPV</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleSign && onToggleSign(1)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
                  caseData?.daKy
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {caseData?.daKy ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isCombo ? 'Hủy chữ ký P1' : 'Hủy chữ ký'}</span>
                  </>
                ) : (
                  <>
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{isCombo ? 'Lưu & Ký duyệt P1 (HPV)' : 'Lưu & Ký duyệt'}</span>
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
