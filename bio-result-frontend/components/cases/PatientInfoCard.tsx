'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  FlaskConical,
  Clock,
  Send,
  Eye,
  Download,
  RotateCcw,
} from 'lucide-react';
import {
  fetchDoctorsList,
  type DoctorOption,
  DEFAULT_DOCTOR_LIST,
} from '@/lib/doctors';

interface PatientInfoCardProps {
  caseData: any;
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  isSaving?: boolean;
  currentUser?: any;
  onReleaseResult?: () => void;
  onDownloadPdf?: () => void;
  onPreviewPdf?: () => void;
  isReleasing?: boolean;
}

export default function PatientInfoCard({
  caseData,
  onChange,
  onSave,
  isSaving = false,
  currentUser,
  onReleaseResult,
  onDownloadPdf,
  onPreviewPdf,
  isReleasing = false,
}: PatientInfoCardProps) {
  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.username === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin' || isSuperAdmin;
  const isDoctor = currentUser?.role === 'doctor' || currentUser?.role === 'bacsy';

  const [doctorList, setDoctorList] = useState<DoctorOption[]>(DEFAULT_DOCTOR_LIST);

  useEffect(() => {
    fetchDoctorsList().then((docs) => {
      if (docs && docs.length > 0) {
        setDoctorList(docs);
      }
    });
  }, []);

  const inputBaseClass = (disabled: boolean) =>
    `w-full px-3.5 py-2.5 rounded-xl border transition-all ${disabled
      ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed select-none'
      : 'border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 font-medium focus:outline-none focus:border-[#0070f3]'
    }`;

  const nameInputClass = (disabled: boolean) =>
    `w-full px-3.5 py-2.5 rounded-xl border uppercase transition-all ${disabled
      ? 'border-slate-200 bg-slate-100 text-slate-600 font-bold cursor-not-allowed select-none'
      : 'border-slate-200 bg-slate-50/60 focus:bg-white text-slate-900 font-bold focus:outline-none focus:border-[#0070f3]'
    }`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sky-700 font-bold text-base">
          <FileText className="w-5 h-5 text-sky-600" />
          <span>Thông tin hành chính bệnh nhân</span>
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Họ và tên
          </label>
          <input
            type="text"
            disabled={isDoctor}
            value={caseData?.hoTen || ''}
            onChange={(e) => onChange('hoTen', e.target.value)}
            className={nameInputClass(isDoctor)}
            placeholder="NGUYỄN THỊ THỦY"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Năm sinh
          </label>
          <input
            type="number"
            disabled={isDoctor}
            value={caseData?.namSinh || ''}
            onChange={(e) => onChange('namSinh', parseInt(e.target.value) || 0)}
            className={inputBaseClass(isDoctor)}
            placeholder="1992"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Giới tính
          </label>
          <select
            disabled={isDoctor}
            value={caseData?.gioiTinh || 'Nữ'}
            onChange={(e) => onChange('gioiTinh', e.target.value)}
            className={`${inputBaseClass(isDoctor)} ${!isDoctor ? 'cursor-pointer' : ''}`}
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
            disabled={isDoctor}
            value={caseData?.soDienThoai || ''}
            onChange={(e) => onChange('soDienThoai', e.target.value)}
            className={inputBaseClass(isDoctor)}
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
            disabled={isDoctor}
            value={caseData?.diaChi || ''}
            onChange={(e) => onChange('diaChi', e.target.value)}
            className={inputBaseClass(isDoctor)}
            placeholder="Xóm Sơn Đại Bái, Gia Bình, Bắc Ninh"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Loại mẫu
          </label>
          <input
            type="text"
            disabled={isDoctor}
            value={caseData?.loaiMau || 'Dịch phết'}
            onChange={(e) => onChange('loaiMau', e.target.value)}
            className={inputBaseClass(isDoctor)}
            placeholder="Dịch phết"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Đơn vị gửi mẫu
          </label>
          <input
            type="text"
            disabled={isDoctor}
            value={caseData?.donVi || ''}
            onChange={(e) => onChange('donVi', e.target.value)}
            className={inputBaseClass(isDoctor)}
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
            disabled={isDoctor}
            value={caseData?.bacSiChiDinh || ''}
            onChange={(e) => onChange('bacSiChiDinh', e.target.value)}
            className={inputBaseClass(isDoctor)}
            placeholder="Đoàn Xuân Dũng"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Ngày nhận mẫu
          </label>
          <input
            type="date"
            disabled={isDoctor}
            value={caseData?.ngayNhanMau ? caseData.ngayNhanMau.split('T')[0] : ''}
            onChange={(e) => onChange('ngayNhanMau', e.target.value)}
            className={`${inputBaseClass(isDoctor)} ${!isDoctor ? 'cursor-pointer' : ''}`}
          />
        </div>
      </div>

      {/* Row 4: Bác sĩ đọc kết quả (Gán phiếu) */}
      {caseData?.loaiXetNghiem?.toLowerCase()?.startsWith('combo_') ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-sky-700 mb-1 flex items-center justify-between">
              <span>Bác sĩ 1 (Đọc kết quả HPV) *</span>
            </label>
            <select
              disabled={!isAdmin}
              value={caseData?.bacSiDoc || (doctorList.length > 0 ? doctorList[0].fullName : 'TS.BS Nguyễn Sỹ Lãnh')}
              onChange={(e) => onChange('bacSiDoc', e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border font-bold transition-all ${isAdmin
                ? 'border-sky-300 bg-sky-50/50 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0070f3] cursor-pointer'
                : 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed select-none'
                }`}
            >
              {doctorList.map((doc) => (
                <option key={`doc1-${doc.username || doc.fullName}`} value={doc.fullName}>
                  {doc.fullName} ({doc.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-purple-700 mb-1 flex items-center justify-between">
              <span>Bác sĩ 2 (Đọc kết quả Tế bào / ThinPrep) *</span>
            </label>
            <select
              disabled={!isAdmin}
              value={caseData?.bacSiDoc2 || ''}
              onChange={(e) => onChange('bacSiDoc2', e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border font-bold transition-all ${isAdmin
                ? 'border-purple-300 bg-purple-50/50 text-slate-900 focus:bg-white focus:outline-none focus:border-purple-600 cursor-pointer'
                : 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed select-none'
                }`}
            >
              <option value="" disabled>-- Chưa phân công Bác sĩ 2 --</option>
              {doctorList.map((doc) => (
                <option key={`doc2-${doc.username || doc.fullName}`} value={doc.fullName}>
                  {doc.fullName} ({doc.username})
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="text-xs">
          <label className="block text-[11px] font-bold text-sky-700 mb-1 flex items-center justify-between">
            <span>Bác sĩ đọc kết quả (Gán phiếu) *</span>
          </label>
          <select
            disabled={!isAdmin}
            value={caseData?.bacSiDoc || 'TS.BS Nguyễn Sỹ Lãnh'}
            onChange={(e) => onChange('bacSiDoc', e.target.value)}
            className={`w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border font-bold transition-all ${isAdmin
              ? 'border-sky-300 bg-sky-50/50 text-slate-900 focus:bg-white focus:outline-none focus:border-[#0070f3] cursor-pointer'
              : 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed select-none'
              }`}
          >
            {doctorList.map((doc) => (
              <option key={doc.username || doc.fullName} value={doc.fullName}>
                {doc.fullName} ({doc.username})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Card Action Footer */}
      {!isDoctor && (
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
      )}
    </div>
  );
}
