'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar, { COMBO_REQUIRED_MAP } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LogoutConfirmModal from '@/components/layout/LogoutConfirmModal';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import { toast } from '@/components/common/Toast';
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

import {
  fetchDoctorsList,
  type DoctorOption,
  DEFAULT_DOCTOR_LIST,
} from '@/lib/doctors';

// Danh sách các dịch vụ đơn lẻ
const SINGLE_SERVICES = [
  { id: 'cell', label: 'Cell' },
  { id: 'thinprep', label: 'ThinPrep' },
  { id: 'hpv40', label: 'HPV 40' },
  { id: 'hpv20', label: 'HPV 20' },
  { id: 'hpv23', label: 'HPV 23' },
  { id: 'hpv24', label: 'HPV 24' },
  { id: 'soituoi', label: 'Soi tươi' },
  { id: 'giaiphaubenh', label: 'Giải Phẫu Bệnh' },
  { id: 'giaiphaubenh_mobenh', label: 'Giải Phẫu Bệnh - Mô Bệnh' },
  { id: 'giaiphaubenh_tebaohoc', label: 'Giải Phẫu Bệnh - Tế Bào Học' },
];

// Danh sách các gói Combo 2 trong 1 (HPV 24 là dịch vụ đơn lẻ, không có combo)
const COMBO_SERVICES = [
  { id: 'combo_hpv20_cell', label: 'Gói Combo: HPV 20 + Cell' },
  { id: 'combo_hpv40_cell', label: 'Gói Combo: HPV 40 + Cell' },
  { id: 'combo_hpv23_cell', label: 'Gói Combo: HPV 23 + Cell' },
  { id: 'combo_hpv20_thinprep', label: 'Gói Combo: HPV 20 + ThinPrep' },
  { id: 'combo_hpv40_thinprep', label: 'Gói Combo: HPV 40 + ThinPrep' },
  { id: 'combo_hpv23_thinprep', label: 'Gói Combo: HPV 23 + ThinPrep' },
];

function NewCaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Layout & session states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.username === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin' || isSuperAdmin;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Service
  const initialCategory = searchParams?.get('category') || 'cell';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  // Lọc danh sách dịch vụ đơn lẻ và combo theo quyền hạn của tài khoản nguồn (lab)
  const visibleSingleServices = useMemo(() => {
    if (isAdmin) return SINGLE_SERVICES;
    const allowed: string[] = currentUser?.allowedCategories || [];
    return SINGLE_SERVICES.filter((s) => allowed.includes(s.id));
  }, [isAdmin, currentUser]);

  const visibleComboServices = useMemo(() => {
    if (isAdmin) return COMBO_SERVICES;
    const allowed: string[] = currentUser?.allowedCategories || [];
    return COMBO_SERVICES.filter((c) => {
      const parts = COMBO_REQUIRED_MAP[c.id];
      if (!parts) return false;
      return allowed.includes(parts[0]) && allowed.includes(parts[1]);
    });
  }, [isAdmin, currentUser]);

  // Đảm bảo loại dịch vụ đang chọn luôn hợp lệ theo quyền hạn của tài khoản
  useEffect(() => {
    if (!currentUser || isAdmin) return;
    const allAllowedIds = [
      ...visibleSingleServices.map((s) => s.id),
      ...visibleComboServices.map((c) => c.id),
    ];
    if (allAllowedIds.length > 0 && !allAllowedIds.includes(selectedCategory)) {
      setSelectedCategory(allAllowedIds[0]);
    }
  }, [currentUser, isAdmin, visibleSingleServices, visibleComboServices, selectedCategory]);

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
    bacSiDoc2: 'Chưa phân loại',
  });

  // Source selection states (Dành riêng cho Admin nhập thay nguồn)
  const [sourcesList, setSourcesList] = useState<string[]>([]);
  const [selectedSourceOption, setSelectedSourceOption] = useState<string>('default');
  const [customSourceName, setCustomSourceName] = useState<string>('');
  const [doctorList, setDoctorList] = useState<DoctorOption[]>(DEFAULT_DOCTOR_LIST);

  // Check Auth, load sources & doctors
  useEffect(() => {
    const userStr = localStorage.getItem('bio_user');
    if (!userStr) {
      router.push('/login');
    } else {
      try {
        const u = JSON.parse(userStr);
        // Bác sĩ không được tạo mẫu, chỉ có admin và tài khoản nguồn (lab) mới được tạo
        if (u.role === 'doctor' || u.role === 'bacsy') {
          toast.warning('Tài khoản Bác sĩ không có quyền tạo phiếu xét nghiệm!', 'Từ chối quyền');
          router.push('/');
          return;
        }
        setCurrentUser(u);
        if (u.role === 'lab' && u.donVi) {
          setFormData((prev) => ({ ...prev, donVi: u.donVi }));
        }
      } catch {
        router.push('/login');
      }
    }

    // Tải danh sách nguồn từ máy chủ CSDL
    async function fetchSources() {
      try {
        const res = await fetch(getApiUrl('/users/sources'), {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const names = list.map((s: any) => s.donVi || s.fullName).filter(Boolean);
            setSourcesList(Array.from(new Set(names)));
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh sách nguồn:', err);
      }
    }
    fetchSources();

    // Tải danh sách bác sĩ thực tế từ tài khoản hệ thống
    fetchDoctorsList().then((docs) => {
      if (docs && docs.length > 0) {
        setDoctorList(docs);
      }
    });
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
      hpv24: `GTHD-HPV24-${randomNum}`,
      soituoi: `GTHD-ST-${randomNum}`,
      giaiphaubenh: `GTHD-GPB-${randomNum}`,
      giaiphaubenh_mobenh: `GTHD-MB-${randomNum}`,
      giaiphaubenh_tebaohoc: `GTHD-TB-${randomNum}`,
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
      toast.warning('Vui lòng nhập họ và tên bệnh nhân!', 'Thiếu thông tin');
      return;
    }

    if (isAdmin && selectedSourceOption === 'custom' && !customSourceName.trim()) {
      toast.warning('Vui lòng nhập tên nguồn / đơn vị đối tác mới!', 'Thiếu thông tin');
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
      } else if (currentUser?.role === 'lab') {
        effectiveDonVi = formData.donVi.trim() || currentUser.donVi || '';
        effectiveNguoiNhap = currentUser.fullName || currentUser.donVi || effectiveDonVi;
      }

      const isCombo = selectedCategory.startsWith('combo_');
      const b1 = formData.bacSiDoc === 'Chưa phân loại' ? '' : formData.bacSiDoc;
      const b2 = formData.bacSiDoc2 === 'Chưa phân loại' ? b1 : (formData.bacSiDoc2 || b1);

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
        daKy2: isCombo ? false : undefined,
        bacSiDoc: b1,
        bacSiDoc2: isCombo ? b2 : '',
      };

      const res = await fetch(getApiUrl('/cases'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        toast.success('Tạo phiếu xét nghiệm mới thành công!', 'Tạo thành công');
        // Chuyển hướng ngay đến trang chi tiết ca vừa tạo để nhập kết quả / xuất PDF
        router.push(`/results/${created._id}`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Có lỗi khi tạo phiếu xét nghiệm!', 'Tạo phiếu thất bại');
      }
    } catch (err) {
      console.error('Lỗi tạo ca mới:', err);
      toast.error('Không thể kết nối đến máy chủ!', 'Lỗi kết nối');
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
              onClick={() => router.push('/?category=all')}
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

              {/* Cảnh báo nếu tài khoản chưa được cấp quyền xét nghiệm nào */}
              {!isAdmin && visibleSingleServices.length === 0 && visibleComboServices.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
                  Tài khoản đơn vị của bạn hiện chưa được cấp quyền dịch vụ xét nghiệm nào. Vui lòng liên hệ quản trị viên để kích hoạt dịch vụ liên kết!
                </div>
              )}

              {/* 1. Dịch vụ đơn lẻ */}
              {visibleSingleServices.length > 0 && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-600">
                    1. Dịch vụ đơn lẻ:
                  </label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {visibleSingleServices.map((srv) => {
                      const isSelected = selectedCategory === srv.id;
                      return (
                        <button
                          type="button"
                          key={srv.id}
                          onClick={() => setSelectedCategory(srv.id)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${isSelected
                            ? 'bg-[#0070f3] text-white shadow-sm ring-2 ring-[#0070f3]/30'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
                            }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center border ${isSelected
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
              )}

              {/* 2. Gói Combo (2 xét nghiệm trong 1 phiếu) */}
              {visibleComboServices.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <label className="block text-xs font-bold text-slate-600">
                    2. Hoặc chọn Gói Combo (2 xét nghiệm trong 1 phiếu):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {visibleComboServices.map((cmb) => {
                      const isSelected = selectedCategory === cmb.id;
                      return (
                        <button
                          type="button"
                          key={cmb.id}
                          onClick={() => setSelectedCategory(cmb.id)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${isSelected
                            ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-500 text-orange-900 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-2xs'
                            }`}
                        >
                          <Flame
                            className={`w-4 h-4 shrink-0 ${isSelected ? 'text-orange-500 fill-orange-500' : 'text-orange-400'
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
              )}
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
                    value={formData.donVi}
                    onChange={(e) => handleFieldChange('donVi', e.target.value)}
                    placeholder="Đơn vị gửi mẫu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3] outline-none placeholder:text-slate-400"
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

                {isCombo ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>Bác sĩ 1 (Đọc kết quả HPV) *</span>
                      </label>
                      <select
                        disabled={!isAdmin}
                        value={formData.bacSiDoc}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleFieldChange('bacSiDoc', val);
                          if (formData.bacSiDoc2 === 'Chưa phân loại' || !formData.bacSiDoc2) {
                            handleFieldChange('bacSiDoc2', val);
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs sm:text-sm outline-none transition-all ${isAdmin
                          ? 'bg-white text-slate-900 border-slate-200 focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3] cursor-pointer'
                          : 'bg-slate-100/90 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                          }`}
                      >
                        <option value="Chưa phân loại">-- Chưa phân công bác sĩ 1 --</option>
                        {doctorList.map((doc) => (
                          <option key={`doc1-${doc.username || doc.fullName}`} value={doc.fullName}>
                            {doc.fullName} ({doc.username})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>Bác sĩ 2 (Đọc kết quả Tế bào / ThinPrep) *</span>
                      </label>
                      <select
                        disabled={!isAdmin}
                        value={formData.bacSiDoc2 !== 'Chưa phân loại' ? formData.bacSiDoc2 : formData.bacSiDoc}
                        onChange={(e) => handleFieldChange('bacSiDoc2', e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs sm:text-sm outline-none transition-all ${isAdmin
                          ? 'bg-white text-slate-900 border-slate-200 focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3] cursor-pointer'
                          : 'bg-slate-100/90 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                          }`}
                      >
                        <option value="Chưa phân loại">-- Chưa phân công bác sĩ 2 --</option>
                        {doctorList.map((doc) => (
                          <option key={`doc2-${doc.username || doc.fullName}`} value={doc.fullName}>
                            {doc.fullName} ({doc.username})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Bác sĩ đọc kết quả</span>
                    </label>
                    <select
                      disabled={!isAdmin}
                      value={formData.bacSiDoc}
                      onChange={(e) => handleFieldChange('bacSiDoc', e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-medium text-xs sm:text-sm outline-none transition-all ${isAdmin
                        ? 'bg-white text-slate-900 border-slate-200 focus:ring-2 focus:ring-[#0070f3] focus:border-[#0070f3] cursor-pointer'
                        : 'bg-slate-100/90 text-slate-500 border-slate-200 cursor-not-allowed select-none'
                        }`}
                    >
                      <option value="Chưa phân loại">-- Chưa phân công bác sĩ --</option>
                      {doctorList.map((doc) => (
                        <option key={doc.username || doc.fullName} value={doc.fullName}>
                          {doc.fullName} ({doc.username})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
