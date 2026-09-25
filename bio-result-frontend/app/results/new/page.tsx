'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LogoutConfirmModal from '@/components/layout/LogoutConfirmModal';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Flame,
  FilePlus,
  User,
  UserPlus,
  Loader2,
  Building2,
} from 'lucide-react';

// Danh sách các dịch vụ đơn lẻ
const SINGLE_SERVICES = [
  { id: 'cell', label: 'Cell' },
  { id: 'thinprep', label: 'ThinPrep' },
  { id: 'hpv40', label: 'HPV 40' },
  { id: 'hpv20', label: 'HPV 20' },
  { id: 'soituoi', label: 'Soi tươi' },
  { id: 'giaiphaubenh', label: 'Giải Phẫu Bệnh' },
];

// Danh sách các gói Combo 2 trong 1
const COMBO_SERVICES = [
  { id: 'combo_hpv20_cell', label: 'Gói Combo: HPV 20 + Cell' },
  { id: 'combo_hpv40_cell', label: 'Gói Combo: HPV 40 + Cell' },
  { id: 'combo_hpv23_cell', label: 'Gói Combo: HPV 23 + Cell' },
  { id: 'combo_hpv20_thinprep', label: 'Gói Combo: HPV 20 + ThinPrep' },
  { id: 'combo_hpv40_thinprep', label: 'Gói Combo: HPV 40 + ThinPrep' },
  { id: 'combo_hpv23_thinprep', label: 'Gói Combo: HPV 23 + ThinPrep' },
];

const DOCTOR_OPTIONS = [
  'Chưa phân loại',
  'TS.BS Nguyễn Sỹ Lãnh',
  'TS . BS NGUYỄN KHÁNH DƯƠNG',
  'BS CK1 PHẠM THẾ HÙNG',
  'BS CK1 NGUYỄN VĂN TRỰC',
  'BS PHẠM THẾ ĐƯƠNG',
];

function NewCaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Layout & session states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Service
  const initialCategory = searchParams?.get('category') || 'cell';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  // Form Fields
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    hoTen: '',
    namSinh: '1994',
    gioiTinh: 'Nữ',
    diaChi: '',
    soDienThoai: '',
    loaiMau: 'Dịch phết',
    donVi: '',
    bacSiChiDinh: '',
    ngayNhanMau: todayStr,
    bacSiDoc: 'Chưa phân loại',
  });

  // Source selection states (Dành riêng cho Admin nhập thay nguồn)
  const [sourcesList, setSourcesList] = useState<string[]>([
    'PK ĐẠI DƯƠNG ĐH',
    'BVĐK Ngã Tư Hồ',
    'Phòng khám Medilab',
    'Phòng Khám Thiên Đức',
    'Bệnh Viện Phụ Sản Hà Nội',
    'Bệnh Viện ĐHQG',
  ]);
  const [selectedSourceOption, setSelectedSourceOption] = useState<string>('default');
  const [customSourceName, setCustomSourceName] = useState<string>('');

  // Check Auth & load sources
  useEffect(() => {
    const userStr = localStorage.getItem('bio_user');
    if (!userStr) {
      router.push('/login');
    } else {
      try {
        const u = JSON.parse(userStr);
        setCurrentUser(u);
        if (u.role === 'lab' && u.donVi) {
          setFormData((prev) => ({ ...prev, donVi: u.donVi }));
        }
      } catch {
        router.push('/login');
      }
    }

    // Tải danh sách nguồn từ máy chủ
    async function fetchSources() {
      try {
        const res = await fetch(getApiUrl('/cases/sources'), {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setSourcesList((prev) => {
              const combined = Array.from(new Set([...prev, ...list]));
              return combined.filter(Boolean);
            });
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh sách nguồn:', err);
      }
    }
    fetchSources();
  }, [router]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSourceOptionChange = (option: string) => {
    setSelectedSourceOption(option);
    if (option === 'default') {
      setFormData((prev) => ({ ...prev, donVi: 'Trung tâm GenHD' }));
    } else if (option === 'custom') {
      setFormData((prev) => ({ ...prev, donVi: customSourceName }));
    } else {
      setFormData((prev) => ({ ...prev, donVi: option }));
    }
  };

  const handleCustomSourceChange = (val: string) => {
    setCustomSourceName(val);
    setFormData((prev) => ({ ...prev, donVi: val }));
  };

  // Generate prefix for MaSo based on category
  const generateMaSo = (cat: string) => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const codeMap: Record<string, string> = {
      cell: `GTHD-CELL-${randomNum}`,
      thinprep: `GTHD-TP-${randomNum}`,
      hpv40: `GTHD-HPV40-${randomNum}`,
      hpv20: `GTHD-HPV20-${randomNum}`,
      hpv23: `GTHD-HPV23-${randomNum}`,
      soituoi: `GTHD-ST-${randomNum}`,
      giaiphaubenh: `GTHD-GPB-${randomNum}`,
      combo_hpv20_cell: `GTHD-CB20CL-${randomNum}`,
      combo_hpv40_cell: `GTHD-CB40CL-${randomNum}`,
      combo_hpv23_cell: `GTHD-CB23CL-${randomNum}`,
      combo_hpv20_thinprep: `GTHD-CB20TP-${randomNum}`,
      combo_hpv40_thinprep: `GTHD-CB40TP-${randomNum}`,
      combo_hpv23_thinprep: `GTHD-CB23TP-${randomNum}`,
    };
    return codeMap[cat] || `GTHD-XN-${randomNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hoTen.trim()) {
      alert('Vui lòng nhập họ và tên bệnh nhân!');
      return;
    }

    if (isAdmin && selectedSourceOption === 'custom' && !customSourceName.trim()) {
      alert('Vui lòng nhập tên nguồn / đơn vị đối tác mới!');
      return;
    }

    setIsSubmitting(true);
    try {
      const maSo = generateMaSo(selectedCategory);

      // Xác định nguồn và người nhập:
      let effectiveDonVi = formData.donVi.trim();
      let effectiveNguoiNhap = currentUser?.fullName || 'Admin phòng Lab';

      if (isAdmin) {
        if (selectedSourceOption === 'custom' && customSourceName.trim()) {
          effectiveDonVi = customSourceName.trim();
          effectiveNguoiNhap = customSourceName.trim();
        } else if (selectedSourceOption !== 'default' && selectedSourceOption) {
          effectiveDonVi = selectedSourceOption;
          effectiveNguoiNhap = selectedSourceOption;
        } else {
          effectiveDonVi = effectiveDonVi || 'Trung tâm GenHD';
          effectiveNguoiNhap = 'Admin phòng Lab';
        }
      } else if (currentUser?.role === 'lab' && currentUser.donVi) {
        effectiveDonVi = currentUser.donVi;
        effectiveNguoiNhap = currentUser.fullName || currentUser.donVi;
      }

      const payload = {
        ...formData,
        donVi: effectiveDonVi,
        nguoiNhap: effectiveNguoiNhap,
        maSo,
        patientCode: maSo,
        hoTen: formData.hoTen.trim().toUpperCase(),
        patientName: formData.hoTen.trim().toUpperCase(),
        namSinh: parseInt(formData.namSinh) || 1994,
        loaiXetNghiem: selectedCategory,
        testType: selectedCategory,
        pdfTemplate: `${selectedCategory}_default`,
        trangThai: 'nhap_thong_tin',
        status: 'nhap_thong_tin',
        daKy: false,
        bacSiDoc: formData.bacSiDoc === 'Chưa phân loại' ? '' : formData.bacSiDoc,
      };

      const res = await fetch(getApiUrl('/cases'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        // Chuyển hướng ngay đến trang chi tiết ca vừa tạo để nhập kết quả / xuất PDF
        router.push(`/results/${created._id}`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Có lỗi khi tạo phiếu xét nghiệm!');
      }
    } catch (err) {
      console.error('Lỗi tạo ca mới:', err);
      alert('Không thể kết nối đến máy chủ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCombo = selectedCategory.startsWith('combo_');
  const selectedObj =
    SINGLE_SERVICES.find((s) => s.id === selectedCategory) ||
    COMBO_SERVICES.find((s) => s.id === selectedCategory);

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden text-slate-800 font-sans">
      {/* 1. SIDEBAR DOCKED ON LEFT */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        activeCategory=""
        onSelectCategory={(catId) => {
          if (catId === 'dashboard') {
            router.push('/');
          } else {
            router.push(`/?category=${catId}`);
          }
        }}
        currentUser={currentUser}
        onLogout={() => setShowLogoutModal(true)}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
          onLogout={() => setShowLogoutModal(true)}
        />

        <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 space-y-6">
          {/* Header Title & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Tạo phiếu xét nghiệm mới
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Chọn 1 hoặc nhiều dịch vụ xét nghiệm đơn lẻ / gói combo & nhập thông tin hành chính bệnh nhân
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Quay lại</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* KHỐI 1: CHỌN DỊCH VỤ / GÓI XÉT NGHIỆM */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <h2 className="text-xs font-black text-slate-800 tracking-wider uppercase">
                  CHỌN DỊCH VỤ / GÓI XÉT NGHIỆM *
                </h2>

                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {isCombo
                      ? `Đã chọn ${selectedObj?.label || 'Gói Combo'}`
                      : `Đã chọn 1 dịch vụ đơn lẻ (${selectedObj?.label || 'Cell'})`}
                  </span>
                </span>
              </div>

              {/* 1. Dịch vụ đơn lẻ */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-600">
                  1. Dịch vụ đơn lẻ (Có thể tích chọn nhiều loại cùng lúc):
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {SINGLE_SERVICES.map((srv) => {
                    const isSelected = selectedCategory === srv.id;
                    return (
                      <button
                        type="button"
                        key={srv.id}
                        onClick={() => setSelectedCategory(srv.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0070f3] text-white shadow-sm ring-2 ring-[#0070f3]/30'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                            isSelected
                              ? 'bg-white text-[#0070f3] border-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span>{srv.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Gói Combo (2 xét nghiệm trong 1 phiếu) */}
              <div className="space-y-2.5 pt-2">
                <label className="block text-xs font-bold text-slate-600">
                  2. Hoặc chọn Gói Combo (2 xét nghiệm trong 1 phiếu):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {COMBO_SERVICES.map((cmb) => {
                    const isSelected = selectedCategory === cmb.id;
                    return (
                      <button
                        type="button"
                        key={cmb.id}
                        onClick={() => setSelectedCategory(cmb.id)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-500 text-orange-900 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs'
                        }`}
                      >
                        <Flame
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-orange-500 fill-orange-500' : 'text-orange-400'
                          }`}
                        />
                        <span className="truncate">{cmb.label}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-orange-600 ml-auto shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* KHỐI 2: THÔNG TIN HÀNH CHÍNH BỆNH NHÂN */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <User className="w-4 h-4 text-[#0070f3]" />
                <h2 className="text-xs font-black text-slate-800 tracking-wider uppercase">
                  THÔNG TIN HÀNH CHÍNH BỆNH NHÂN
                </h2>
              </div>

              {/* Dòng chọn nguồn (1 mình 1 dòng dành riêng cho Admin) */}
              {isAdmin && (
                <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-3.5 space-y-2">
                  <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <span>Chọn nguồn gửi mẫu / Đơn vị tạo phiếu (Nhập thay cho nguồn):</span>
                    </span>
                    <span className="text-[10px] font-extrabold bg-purple-200/80 text-purple-800 px-2 py-0.5 rounded-full">
                      Chỉ Admin
                    </span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <select
                      value={selectedSourceOption}
                      onChange={(e) => handleSourceOptionChange(e.target.value)}
                      className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white font-semibold text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none cursor-pointer"
                    >
                      <option value="default">Quản trị viên (Trung tâm GenHD)</option>
                      <optgroup label="── Danh sách các nguồn đối tác ──">
                        {sourcesList.map((src) => (
                          <option key={src} value={src}>
                            {src}
                          </option>
                        ))}
                      </optgroup>
                      <option value="custom">+ Nhập nguồn mới khác...</option>
                    </select>

                    {selectedSourceOption === 'custom' && (
                      <input
                        type="text"
                        required
                        value={customSourceName}
                        onChange={(e) => handleCustomSourceChange(e.target.value)}
                        placeholder="Nhập tên nguồn mới..."
                        className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl border border-purple-300 bg-white font-semibold text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none placeholder:text-slate-400"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Dòng 1: Họ tên (col-span-2) + Năm sinh + Giới tính */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Họ và tên bệnh nhân <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.hoTen}
                    onChange={(e) => handleFieldChange('hoTen', e.target.value)}
                    placeholder="Ví dụ: VƯƠNG THỊ HÂN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3] outline-none uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Năm sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.namSinh}
                    onChange={(e) => handleFieldChange('namSinh', e.target.value)}
                    placeholder="1994"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3] outline-none placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giới tính <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gioiTinh}
                    onChange={(e) => handleFieldChange('gioiTinh', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3] outline-none cursor-pointer"
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              {/* Dòng 2: Địa chỉ (col-span-2) + SĐT + Loại mẫu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={formData.diaChi}
                    onChange={(e) => handleFieldChange('diaChi', e.target.value)}
                    placeholder="Ví dụ: Phường Mão Điền, Tỉnh Bắc Ninh"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3] outline-none placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formData.soDienThoai}
                    onChange={(e) => handleFieldChange('soDienThoai', e.target.value)}
                    placeholder="0355 922 657"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3] outline-none placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Loại mẫu
                  </label>
                  <input
                    type="text"
                    value={formData.loaiMau}
                    onChange={(e) => handleFieldChange('loaiMau', e.target.value)}
                    placeholder="Dịch phết"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3] outline-none"
                  />
                </div>
              </div>

              {/* Dòng 3: Đơn vị gửi mẫu + Bác sĩ chỉ định + Ngày nhận mẫu + Bác sĩ đọc KQ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Đơn vị gửi mẫu
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin && currentUser?.role === 'lab'}
                    value={formData.donVi}
                    onChange={(e) => handleFieldChange('donVi', e.target.value)}
                    placeholder="Đơn vị gửi mẫu"
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs sm:text-sm outline-none ${
                      !isAdmin && currentUser?.role === 'lab'
                        ? 'bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed select-none'
                        : 'border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Bác sĩ chỉ định
                  </label>
                  <input
                    type="text"
                    value={formData.bacSiChiDinh}
                    onChange={(e) => handleFieldChange('bacSiChiDinh', e.target.value)}
                    placeholder="Bác sĩ chỉ định"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ngày nhận mẫu
                  </label>
                  <input
                    type="date"
                    value={formData.ngayNhanMau}
                    onChange={(e) => handleFieldChange('ngayNhanMau', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3] outline-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Bác sĩ đọc kết quả</span>
                    {!isAdmin && (
                      <span className="text-[10px] text-amber-600 font-semibold">
                        (Chỉ Admin phân công)
                      </span>
                    )}
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.bacSiDoc}
                    onChange={(e) => handleFieldChange('bacSiDoc', e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs sm:text-sm outline-none transition-all ${
                      isAdmin
                        ? 'bg-white text-slate-900 border-slate-200 focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3] cursor-pointer'
                        : 'bg-slate-100/90 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                    }`}
                  >
                    {DOCTOR_OPTIONS.map((doc) => (
                      <option key={doc} value={doc}>
                        {doc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0070f3] hover:bg-[#005bb5] text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FilePlus className="w-4 h-4" />
                )}
                <span>Tạo phiếu mới</span>
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* Logout Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          localStorage.removeItem('bio_token');
          localStorage.removeItem('bio_user');
          router.push('/login');
        }}
      />
    </div>
  );
}

export default function NewCasePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0070f3]" />
        </div>
      }
    >
      <NewCaseContent />
    </Suspense>
  );
}
