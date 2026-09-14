'use client';

import React from 'react';
import { FileText, Save, Loader2 } from 'lucide-react';

interface PatientInfoCardProps {
  caseData: any;
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export default function PatientInfoCard({
  caseData,
  onChange,
  onSave,
  isSaving = false,
}: PatientInfoCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
      {/* Card Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-sky-700 font-bold text-base">
        <FileText className="w-5 h-5 text-sky-600" />
        <span>Thông tin hành chính bệnh nhân</span>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Họ và tên
          </label>
          <input
            type="text"
            value={caseData?.hoTen || ''}
            onChange={(e) => onChange('hoTen', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 font-bold uppercase focus:outline-none focus:border-[#0070f3] transition-all"
            placeholder="NGUYỄN THỊ THỦY"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Năm sinh
          </label>
          <input
            type="number"
            value={caseData?.namSinh || ''}
            onChange={(e) => onChange('namSinh', parseInt(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 font-medium focus:outline-none focus:border-[#0070f3] transition-all"
            placeholder="1992"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Giới tính
          </label>
          <select
            value={caseData?.gioiTinh || 'Nữ'}
            onChange={(e) => onChange('gioiTinh', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 font-medium focus:outline-none focus:border-[#0070f3] transition-all cursor-pointer"
          >
            <option value="Nữ">Nữ</option>
            <option value="Nam">Nam</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Số điện thoại
          </label>
          <input
            type="text"
            value={caseData?.soDienThoai || ''}
            onChange={(e) => onChange('soDienThoai', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 font-medium focus:outline-none focus:border-[#0070f3] transition-all"
            placeholder="0978870036"
          />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Địa chỉ
          </label>
          <input
            type="text"
            value={caseData?.diaChi || ''}
            onChange={(e) => onChange('diaChi', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 font-medium focus:outline-none focus:border-[#0070f3] transition-all"
            placeholder="Xóm Sơn Đại Bái, Gia Bình, Bắc Ninh"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Loại mẫu
          </label>
          <input
            type="text"
            value={caseData?.loaiMau || 'Dịch phết'}
            onChange={(e) => onChange('loaiMau', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 font-medium focus:outline-none focus:border-[#0070f3] transition-all"
            placeholder="Dịch phết"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Đơn vị gửi mẫu
          </label>
          <input
            type="text"
            value={caseData?.donVi || ''}
            onChange={(e) => onChange('donVi', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 font-medium focus:outline-none focus:border-[#0070f3] transition-all"
            placeholder="BVĐK Ngã Tư Hồ"
          />
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Bác sĩ chỉ định
          </label>
          <input
            type="text"
            value={caseData?.bacSiChiDinh || ''}
            onChange={(e) => onChange('bacSiChiDinh', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 font-medium focus:outline-none focus:border-[#0070f3] transition-all"
            placeholder="Đoàn Xuân Dũng"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Ngày nhận mẫu
          </label>
          <input
            type="date"
            value={caseData?.ngayNhanMau ? caseData.ngayNhanMau.split('T')[0] : ''}
            onChange={(e) => onChange('ngayNhanMau', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 font-medium focus:outline-none focus:border-[#0070f3] transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* Row 4: Bác sĩ đọc kết quả (Gán phiếu) */}
      <div className="text-xs">
        <label className="block text-[11px] font-bold text-sky-700 mb-1">
          Bác sĩ đọc kết quả (Gán phiếu) *
        </label>
        <select
          value={caseData?.bacSiDoc || 'TS . BS Nguyễn Khánh Dương'}
          onChange={(e) => onChange('bacSiDoc', e.target.value)}
          className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border border-sky-300 bg-sky-50/50 text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-[#0070f3] transition-all cursor-pointer"
        >
          <option value="TS . BS Nguyễn Khánh Dương">TS . BS Nguyễn Khánh Dương</option>
          <option value="BS CK1 PHẠM THẾ HÙNG">BS CK1 PHẠM THẾ HÙNG</option>
          <option value="BS. Trần Văn Trực">BS. Trần Văn Trực</option>
        </select>
      </div>

      {/* Card Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex justify-end">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0070f3] hover:bg-[#005bb5] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Lưu thông tin phiếu</span>
        </button>
      </div>
    </div>
  );
}
