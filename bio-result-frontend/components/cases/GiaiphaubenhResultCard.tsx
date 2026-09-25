'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
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
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/lib/config';

interface GiaiphaubenhResultCardProps {
  caseData: any;
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  onToggleSign?: () => void;
  isSaving?: boolean;
  currentUser?: any;
}

export default function GiaiphaubenhResultCard({
  caseData,
  onChange,
  onSave,
  onToggleSign,
  isSaving = false,
  currentUser,
}: GiaiphaubenhResultCardProps) {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin';
  const [collapsed, setCollapsed] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xóa ảnh khỏi MinIO & CSDL Mongo
  const handleDeleteImage = async (field: string = 'anhTeBao') => {
    if (!caseData?._id) {
      onChange(field, '');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi hệ thống?')) {
      return;
    }

    try {
      setIsUploadingImage(true);
      const res = await fetch(getApiUrl(`/cases/${caseData._id}/delete-image`), {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field }),
      });
      if (res.ok) {
        onChange(field, '');
      } else {
        alert('Không thể xóa ảnh trên máy chủ!');
      }
    } catch (err) {
      console.error('Lỗi xóa ảnh:', err);
      alert('Không thể kết nối máy chủ!');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Upload / Thay ảnh mới lên MinIO & CSDL Mongo (Chỉ cập nhật trường ảnh)
  const handleUploadOrReplaceImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string = 'anhTeBao',
    loaiAnh: string = 'gpb',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (caseData?.[field]) {
      if (!window.confirm('Bạn có muốn thay thế ảnh hiện tại bằng ảnh mới chọn?')) {
        e.target.value = '';
        return;
      }
    }

    // Nếu ca chưa tạo trên DB thì đọc base64 tạm
    if (!caseData?._id) {
      const reader = new FileReader();
      reader.onload = () => {
        onChange(field, reader.result as string);
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('field', field);
      formData.append('loaiAnh', loaiAnh);

      const headers = getAuthHeaders();
      delete (headers as any)['Content-Type'];

      const res = await fetch(getApiUrl(`/cases/${caseData._id}/upload-image`), {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          onChange(field, data.url);
        }
      } else {
        alert('Có lỗi khi tải ảnh lên MinIO!');
      }
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      alert('Không thể kết nối máy chủ!');
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-0">
      {/* Card Header */}
      <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5 text-amber-700 font-black text-sm uppercase tracking-tight">
          <FileText className="w-5 h-5 text-amber-600" />
          <span>KẾT QUẢ XÉT NGHIỆM GIẢI PHẪU BỆNH</span>
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
          {/* Field 1 & 2: Vị trí bệnh phẩm & Chẩn đoán lâm sàng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                VỊ TRÍ LẤY BỆNH PHẨM
              </label>
              <input
                type="text"
                value={caseData?.viTriBenhPham || ''}
                onChange={(e) => onChange('viTriBenhPham', e.target.value)}
                placeholder="Cổ tử cung, Niêm mạc tử cung..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                CHẨN ĐOÁN LÂM SÀNG
              </label>
              <input
                type="text"
                value={caseData?.chanDoanLamSang || ''}
                onChange={(e) => onChange('chanDoanLamSang', e.target.value)}
                placeholder="Chẩn đoán từ bác sĩ chỉ định..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Field 3: Mô tả Đại thể */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Mô tả Đại thể (ĐẠI THỂ)</span>
            </label>
            <textarea
              rows={4}
              value={caseData?.daiThe || ''}
              onChange={(e) => onChange('daiThe', e.target.value)}
              placeholder="Nhập mô tả đại thể..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Field 4: Mô tả Vi thể */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Mô tả Vi thể (VI THỂ)</span>
            </label>
            <textarea
              rows={5}
              value={caseData?.viThe || ''}
              onChange={(e) => onChange('viThe', e.target.value)}
              placeholder="Nhập mô tả vi thể..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Field 5: Ảnh tiêu bản giải phẫu bệnh */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-amber-600" />
              <span>Ảnh tiêu bản giải phẫu bệnh (Kính hiển vi)</span>
            </label>

            {caseData?.anhTeBao ? (
              <div className="flex flex-col items-center gap-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
                <img
                  src={caseData.anhTeBao}
                  alt="Tiêu bản giải phẫu bệnh"
                  className="max-h-56 rounded-xl shadow-md border border-slate-200 object-contain mx-auto bg-white"
                />

                {/* 2 Nút bấm riêng biệt */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => handleDeleteImage('anhTeBao')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Xóa ảnh</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isUploadingImage ? 'animate-spin' : ''}`} />
                    <span>Thay ảnh mới</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => handleUploadOrReplaceImage(e, 'anhTeBao', 'gpb')}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-amber-200 hover:border-amber-400 bg-amber-50/20 hover:bg-amber-50/50 rounded-2xl p-6 transition-all text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadOrReplaceImage(e, 'anhTeBao', 'gpb')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center gap-2 py-3">
                  <div className="p-3 bg-amber-100/80 text-amber-600 rounded-full">
                    {isUploadingImage ? (
                      <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
                    ) : (
                      <UploadCloud className="w-7 h-7" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    {isUploadingImage ? 'Đang tải ảnh lên MinIO...' : 'Nhấp hoặc kéo thả file vào đây'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Định dạng hỗ trợ: image/*
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Field 6: KẾT LUẬN & KHUYẾN NGHỊ */}
          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="font-bold text-amber-800 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span>KẾT LUẬN *</span>
              </label>
              <textarea
                rows={3}
                value={caseData?.ketLuan || ''}
                onChange={(e) => onChange('ketLuan', e.target.value)}
                placeholder="Nhập kết luận giải phẫu bệnh..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs font-bold text-amber-900 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
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
                placeholder="Nhập khuyến nghị nếu có..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Field 7: Bác sĩ đọc kết quả & Ký duyệt (Thùng màu amber nhạt chuẩn GenHD) */}
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs">
              <div>
                <span className="text-xs text-amber-900 font-bold block mb-1">
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
                      ? 'text-amber-900 border-amber-300 bg-white focus:outline-none focus:border-amber-500 cursor-pointer'
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
                <span className="text-xs text-amber-900 font-bold block mb-1">
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
                  className="text-xs py-1 px-2.5 font-bold text-slate-800 rounded-lg border-amber-300 bg-white shadow-2xs w-44 cursor-pointer"
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
                <span>Lưu Giải Phẫu Bệnh</span>
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
