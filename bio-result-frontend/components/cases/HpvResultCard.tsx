'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Activity,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Save,
  PenTool,
  RotateCcw,
  Loader2,
  X,
} from 'lucide-react';

interface HpvResultCardProps {
  caseData: any;
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  onToggleSign?: () => void;
  isSaving?: boolean;
}

export default function HpvResultCard({
  caseData,
  onChange,
  onSave,
  onToggleSign,
  isSaving = false,
}: HpvResultCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [attachGraph, setAttachGraph] = useState(true);

  const testTitle =
    caseData?.loaiXetNghiem === 'hpv20'
      ? 'KẾT QUẢ XÉT NGHIỆM HPV 20 TYPES (REAL-TIME PCR)'
      : caseData?.loaiXetNghiem === 'hpv23'
      ? 'KẾT QUẢ XÉT NGHIỆM HPV 23 TYPES (REAL-TIME PCR)'
      : 'KẾT QUẢ XÉT NGHIỆM HPV 40 TYPES (REAL-TIME PCR)';

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
          {/* 4 HPV Risk Group Cards */}
          <div className="space-y-3">
            {/* Group 1: HPV Nguy cơ cao 16, 18 */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-red-200 transition-colors">
              <div>
                <span className="font-bold text-red-700 text-xs uppercase block">
                  1. NHÓM HPV NGUY CƠ CAO (TYPE 16, 18)
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Khảo sát 2 chủng nguy cơ cao nhất: 16, 18
                </span>
              </div>

              <input
                type="text"
                value={caseData?.hpvHighRiskResult || 'Âm tính'}
                onChange={(e) => onChange('hpvHighRiskResult', e.target.value)}
                className="w-full sm:w-44 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:border-red-400 text-center"
              />
            </div>

            {/* Group 2: HPV Nguy cơ cao khác (16 types) */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-red-200 transition-colors">
              <div>
                <span className="font-bold text-red-700 text-xs uppercase block">
                  2. NHÓM HPV NGUY CƠ CAO KHÁC (16 TYPES)
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Khảo sát 16 chủng: 26, 31, 33, 35, 39, 45, 51, 52, 53, 56, 58, 59, 66, 68, 73, 82
                </span>
              </div>

              <input
                type="text"
                value={caseData?.hpvOtherRiskResult || 'Âm tính'}
                onChange={(e) => onChange('hpvOtherRiskResult', e.target.value)}
                className="w-full sm:w-44 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:border-red-400 text-center"
              />
            </div>

            {/* Group 3: HPV Nguy cơ thấp (2 types) */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-200 transition-colors">
              <div>
                <span className="font-bold text-[#0070f3] text-xs uppercase block">
                  3. NHÓM HPV NGUY CƠ THẤP (2 TYPES)
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Khảo sát 2 chủng: 6, 11
                </span>
              </div>

              <input
                type="text"
                value={caseData?.hpvLowRiskResult || 'Âm tính'}
                onChange={(e) => onChange('hpvLowRiskResult', e.target.value)}
                className="w-full sm:w-44 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:border-blue-400 text-center"
              />
            </div>

            {/* Group 4: Các Type khác (20 types) */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors">
              <div>
                <span className="font-bold text-slate-700 text-xs uppercase block">
                  4. CÁC TYPE HPV KHÁC (20 TYPES)
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Khảo sát 20 chủng: 30, 32, 34, 40, 42, 43, 44, 54, 55, 61, 62, 67, 71, 72, 74, 81, 83, 84, 87, 90
                </span>
              </div>

              <input
                type="text"
                value={caseData?.hpvOtherTypesResult || 'Âm tính'}
                onChange={(e) => onChange('hpvOtherTypesResult', e.target.value)}
                className="w-full sm:w-44 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:border-slate-400 text-center"
              />
            </div>
          </div>

          {/* Checkbox: Biểu đồ Real-time PCR */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="attachGraph"
                checked={attachGraph}
                onChange={(e) => setAttachGraph(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor="attachGraph"
                className="text-xs font-bold text-indigo-950 cursor-pointer select-none"
              >
                Đính kèm / Tải lên biểu đồ HPV (Real-time PCR)
              </label>
            </div>

            {attachGraph && (
              <div className="p-4 bg-white rounded-xl border-2 border-dashed border-sky-300 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-800">
                    BIỂU ĐỒ TÍN HIỆU TẢI LƯỢNG KẾT QUẢ (REAL-TIME PCR)
                  </span>
                  <button
                    type="button"
                    onClick={() => alert('Chức năng tải lên / thay ảnh biểu đồ PCR')}
                    className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Xóa ảnh / Thay ảnh khác</span>
                  </button>
                </div>

                {/* Simulated Graph Image Box */}
                <div className="w-full h-44 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center p-2 relative overflow-hidden">
                  <div className="w-full h-full relative flex items-center justify-center">
                    {/* SVG Curve preview */}
                    <svg
                      viewBox="0 0 500 150"
                      className="w-full h-full text-blue-600 stroke-current fill-none"
                    >
                      <line x1="40" y1="20" x2="40" y2="130" stroke="#cbd5e1" strokeWidth="1" />
                      <line x1="40" y1="130" x2="480" y2="130" stroke="#cbd5e1" strokeWidth="1" />
                      {/* Negative baseline */}
                      <path
                        d="M 40 125 Q 250 124 480 123"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4"
                      />
                      {/* Positive amplification sigmoid curve */}
                      <path
                        d="M 40 126 C 200 126, 260 120, 320 60 S 400 30, 480 25"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                      />
                    </svg>
                    <div className="absolute bottom-2 right-4 text-[10px] font-semibold text-slate-400 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                      Đường cong khuếch đại chu kỳ chuẩn Ct
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Kết luận xét nghiệm */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-indigo-900 mb-1.5">
                KẾT LUẬN XÉT NGHIỆM HPV *
              </label>
              <textarea
                rows={2}
                value={
                  caseData?.ketLuan ||
                  'ÂM TÍNH VỚI VIRUS HPV (40 TYPE TRÊN) TRÊN MẪU NHẬN ĐƯỢC.'
                }
                onChange={(e) => onChange('ketLuan', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 text-xs font-bold text-indigo-950 focus:bg-white focus:outline-none focus:border-[#0070f3] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                KHUYẾN NGHỊ / ĐỀ NGHỊ
              </label>
              <textarea
                rows={2}
                value={
                  caseData?.khuyenNghi ||
                  'Đề nghị kiểm tra theo lịch sàng lọc định kỳ.'
                }
                onChange={(e) => onChange('khuyenNghi', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#0070f3] transition-all"
              />
            </div>
          </div>

          {/* Section: Khối Bác sĩ ký duyệt (Tương ứng Ảnh 3) */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Bác sĩ đọc kết quả:
                </label>
                <select
                  value={caseData?.bacSiDoc || 'TS . BS Nguyễn Khánh Dương'}
                  onChange={(e) => onChange('bacSiDoc', e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-[#0070f3]"
                >
                  <option value="TS . BS Nguyễn Khánh Dương">TS . BS Nguyễn Khánh Dương</option>
                  <option value="BS CK1 PHẠM THẾ HÙNG">BS CK1 PHẠM THẾ HÙNG</option>
                  <option value="BS. Trần Văn Trực">BS. Trần Văn Trực</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Ngày ký:
                </label>
                <input
                  type="date"
                  value={
                    caseData?.ngayTraKetQua
                      ? caseData.ngayTraKetQua.split('T')[0]
                      : '2026-09-12'
                  }
                  onChange={(e) => onChange('ngayTraKetQua', e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#0070f3] cursor-pointer"
                />
              </div>

              <div className="pt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                onClick={onToggleSign}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${
                  caseData?.daKy
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {caseData?.daKy ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Hủy chữ ký</span>
                  </>
                ) : (
                  <>
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Lưu & Ký duyệt (HPV)</span>
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
