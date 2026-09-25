'use client';

import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Save,
  PenTool,
  RotateCcw,
  Loader2,
} from 'lucide-react';

interface SoituoiResultCardProps {
  caseData: any;
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  onToggleSign?: () => void;
  isSaving?: boolean;
  currentUser?: any;
}

export default function SoituoiResultCard({
  caseData,
  onChange,
  onSave,
  onToggleSign,
  isSaving = false,
  currentUser,
}: SoituoiResultCardProps) {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin';
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-0">
      {/* Card Header */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5 text-sky-700 font-black text-sm uppercase tracking-tight">
          <FlaskConical className="w-5 h-5 text-sky-600" />
          <span>KẾT QUẢ XÉT NGHIỆM SOI TƯƠI DỊCH ÂM ĐẠO</span>
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
          {/* Table 5 Chỉ Tiêu Soi Tươi */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-sky-50/80 text-sky-900 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200">STT</th>
                  <th className="py-2.5 px-3 w-40 border-r border-slate-200">TÊN CHỈ TIÊU</th>
                  <th className="py-2.5 px-3 w-48 border-r border-slate-200">KẾT QUẢ</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">Ý NGHĨA</th>
                  <th className="py-2.5 px-3 w-48">GHI CHÚ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {/* Row 1: Bạch cầu */}
                <tr className="divide-x divide-slate-200 bg-slate-50/40 hover:bg-slate-50/80">
                  <td className="py-2 px-3 text-center font-bold text-slate-500">1</td>
                  <td className="py-2 px-3 font-bold text-slate-800">Bạch cầu</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={caseData?.soiTuoiBachCau || 'Âm tính'}
                      onChange={(e) => onChange('soiTuoiBachCau', e.target.value)}
                      placeholder="Âm tính / + / ++..."
                      className="w-full px-3 py-1 text-xs font-bold text-sky-700 bg-sky-50/50 rounded-lg border border-sky-200 focus:outline-none focus:border-sky-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-medium">
                    Đánh giá mức độ viêm nhiễm
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={caseData?.soiTuoiGhiChuBachCau || ''}
                      onChange={(e) => onChange('soiTuoiGhiChuBachCau', e.target.value)}
                      className="w-full px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </td>
                </tr>

                {/* Row 2: Nấm */}
                <tr className="divide-x divide-slate-200 bg-slate-50/40 hover:bg-slate-50/80">
                  <td className="py-2 px-3 text-center font-bold text-slate-500">2</td>
                  <td className="py-2 px-3 font-bold text-slate-800">Nấm</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={caseData?.soiTuoiNam || 'Âm tính'}
                      onChange={(e) => onChange('soiTuoiNam', e.target.value)}
                      placeholder="Âm tính / Phân lập Nấm..."
                      className="w-full px-3 py-1 text-xs font-bold text-sky-700 bg-sky-50/50 rounded-lg border border-sky-200 focus:outline-none focus:border-sky-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-medium">
                    Khảo sát sự hiện diện của Nấm (Candida spp)
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={caseData?.soiTuoiGhiChuNam || ''}
                      onChange={(e) => onChange('soiTuoiGhiChuNam', e.target.value)}
                      className="w-full px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </td>
                </tr>

                {/* Row 3: Tạp khuẩn */}
                <tr className="divide-x divide-slate-200 bg-slate-50/40 hover:bg-slate-50/80">
                  <td className="py-2 px-3 text-center font-bold text-slate-500">3</td>
                  <td className="py-2 px-3 font-bold text-slate-800">Tạp khuẩn</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={caseData?.soiTuoiTapKhuan || 'Âm tính'}
                      onChange={(e) => onChange('soiTuoiTapKhuan', e.target.value)}
                      placeholder="Âm tính / Dương tính..."
                      className="w-full px-3 py-1 text-xs font-bold text-sky-700 bg-sky-50/50 rounded-lg border border-sky-200 focus:outline-none focus:border-sky-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-medium">
                    Đánh giá hệ vi sinh vật
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={caseData?.soiTuoiGhiChuTapKhuan || ''}
                      onChange={(e) => onChange('soiTuoiGhiChuTapKhuan', e.target.value)}
                      className="w-full px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </td>
                </tr>

                {/* Row 4: Tế bào biểu mô */}
                <tr className="divide-x divide-slate-200 bg-slate-50/40 hover:bg-slate-50/80">
                  <td className="py-2 px-3 text-center font-bold text-slate-500">4</td>
                  <td className="py-2 px-3 font-bold text-slate-800">Tế bào biểu mô</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={caseData?.soiTuoiTeBaoBieuMo || 'Ít'}
                      onChange={(e) => onChange('soiTuoiTeBaoBieuMo', e.target.value)}
                      placeholder="Ít / Vừa / Nhiều..."
                      className="w-full px-3 py-1 text-xs font-bold text-sky-700 bg-sky-50/50 rounded-lg border border-sky-200 focus:outline-none focus:border-sky-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-medium">
                    Khảo sát số lượng tế bào
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={caseData?.soiTuoiGhiChuTeBaoBieuMo || ''}
                      onChange={(e) => onChange('soiTuoiGhiChuTeBaoBieuMo', e.target.value)}
                      className="w-full px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </td>
                </tr>

                {/* Row 5: Trichomonas */}
                <tr className="divide-x divide-slate-200 bg-slate-50/40 hover:bg-slate-50/80">
                  <td className="py-2 px-3 text-center font-bold text-slate-500">5</td>
                  <td className="py-2 px-3 font-bold text-slate-800">Trichomonas</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={caseData?.soiTuoiTrichomonas || 'Âm tính'}
                      onChange={(e) => onChange('soiTuoiTrichomonas', e.target.value)}
                      placeholder="Âm tính / Dương tính..."
                      className="w-full px-3 py-1 text-xs font-bold text-sky-700 bg-sky-50/50 rounded-lg border border-sky-200 focus:outline-none focus:border-sky-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-medium">
                    Khảo sát sự hiện diện của Trùng roi
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={caseData?.soiTuoiGhiChuTrichomonas || ''}
                      onChange={(e) => onChange('soiTuoiGhiChuTrichomonas', e.target.value)}
                      className="w-full px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section: Kết luận & Khuyến nghị */}
          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-sky-800 mb-1.5 uppercase">
                KẾT LUẬN XÉT NGHIỆM SOI TƯƠI *
              </label>
              <textarea
                rows={2}
                value={
                  caseData?.ketLuan ||
                  'HỆ VI SINH VẬT TRONG GIỚI HẠN BÌNH THƯỜNG.'
                }
                onChange={(e) => onChange('ketLuan', e.target.value)}
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

          {/* Section: Bác sĩ đọc kết quả & Ký duyệt */}
          <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs">
              <div>
                <span className="text-xs text-sky-800 font-bold block mb-1">
                  Bác sĩ đọc kết quả:
                  {!isAdmin && (
                    <span className="text-[10px] text-amber-600 font-normal ml-2">
                      (Chỉ Admin đổi)
                    </span>
                  )}
                </span>
                <select
                  disabled={!isAdmin}
                  value={caseData?.bacSiDoc || 'BS CK1 PHẠM THẾ HÙNG'}
                  onChange={(e) => onChange('bacSiDoc', e.target.value)}
                  className={`form-select text-xs py-1.5 px-3 font-bold rounded-lg border shadow-2xs ${
                    isAdmin
                      ? 'text-sky-700 border-sky-300 bg-white focus:outline-none focus:border-sky-500 cursor-pointer'
                      : 'text-slate-600 border-slate-200 bg-slate-100 cursor-not-allowed select-none'
                  }`}
                >
                  <option value="TS.BS Nguyễn Sỹ Lãnh">TS.BS Nguyễn Sỹ Lãnh</option>
                  <option value="TS . BS Nguyễn Khánh Dương">TS . BS Nguyễn Khánh Dương</option>
                  <option value="BS CK1 PHẠM THẾ HÙNG">BS CK1 PHẠM THẾ HÙNG</option>
                  <option value="BS CK1 NGUYỄN VĂN TRỰC">BS CK1 NGUYỄN VĂN TRỰC</option>
                  <option value="BS PHẠM THẾ ĐƯƠNG">BS PHẠM THẾ ĐƯƠNG</option>
                </select>
              </div>

              <div>
                <span className="text-xs text-sky-800 font-bold block mb-1">
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
                  className="text-xs py-1 px-2.5 font-bold text-slate-800 rounded-lg border-sky-300 bg-white shadow-2xs w-44 cursor-pointer"
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
                <span>Lưu kết quả Soi tươi</span>
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
                    <span>Lưu & Ký duyệt</span>
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
