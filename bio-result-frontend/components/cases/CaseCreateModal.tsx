'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

import { getApiUrl, getAuthHeaders } from '@/lib/config';

interface CaseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activeCategory: string;
  categoryLabel: string;
  currentUser?: any;
}

export default function CaseCreateModal({
  isOpen,
  onClose,
  onSuccess,
  activeCategory,
  categoryLabel,
  currentUser,
}: CaseCreateModalProps) {
  const [formData, setFormData] = useState({
    maSo: `GTHD-40HP${Math.floor(100 + Math.random() * 900)}`,
    hoTen: '',
    namSinh: 1995,
    gioiTinh: 'Nữ',
    soDienThoai: '',
    diaChi: '',
    loaiMau: 'Dịch phết',
    donVi: 'BVĐK Ngã Tư Hồ',
    bacSiChiDinh: 'BS. Đoàn Xuân Dũng',
    bacSiDoc: 'TS . BS Nguyễn Khánh Dương',
    chanDoanLamSang: 'Sàng lọc định kỳ',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        loaiXetNghiem: activeCategory,
        trangThai: 'nhap_thong_tin',
        status: 'pending',
        daKy: false,
        nguoiNhap: currentUser?.fullName || 'Gentech Lab',
        ngayNhanMau: new Date().toISOString().split('T')[0],
      };

      const res = await fetch(getApiUrl('/cases'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error creating case:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-base font-extrabold text-slate-900">
            Tạo mới phiếu xét nghiệm ({categoryLabel})
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Mã phiếu xét nghiệm *
              </label>
              <input
                type="text"
                required
                value={formData.maSo}
                onChange={(e) => setFormData({ ...formData, maSo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Họ và tên bệnh nhân *
              </label>
              <input
                type="text"
                required
                value={formData.hoTen}
                onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                placeholder="NGUYỄN VĂN A"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Năm sinh
              </label>
              <input
                type="number"
                value={formData.namSinh}
                onChange={(e) =>
                  setFormData({ ...formData, namSinh: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Giới tính
              </label>
              <select
                value={formData.gioiTinh}
                onChange={(e) => setFormData({ ...formData, gioiTinh: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
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
                value={formData.soDienThoai}
                onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Địa chỉ
            </label>
            <input
              type="text"
              value={formData.diaChi}
              onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Bác sĩ chỉ định
              </label>
              <input
                type="text"
                value={formData.bacSiChiDinh}
                onChange={(e) => setFormData({ ...formData, bacSiChiDinh: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Đơn vị gửi mẫu
              </label>
              <input
                type="text"
                value={formData.donVi}
                onChange={(e) => setFormData({ ...formData, donVi: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#0070f3] hover:bg-[#005bb5] text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang tạo...' : 'Tạo phiếu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
