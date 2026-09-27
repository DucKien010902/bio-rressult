'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LogoutConfirmModal from '@/components/layout/LogoutConfirmModal';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import { toast } from '@/components/common/Toast';
import {
  Clock,
  UserCheck,
  Building2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Shield,
  Plus,
  ExternalLink,
} from 'lucide-react';

// Danh sách tất cả các loại dịch vụ xét nghiệm trong hệ thống
const SERVICES_LIST = [
  { id: 'thinprep', label: 'Xét nghiệm ThinPrep', group: 'Tế bào học', defaultHours: 24 },
  { id: 'cell', label: 'Xét nghiệm Cell', group: 'Tế bào học', defaultHours: 24 },
  { id: 'hpv40', label: 'Xét nghiệm HPV 40 Types', group: 'Sinh học phân tử', defaultHours: 48 },
  { id: 'hpv20', label: 'Xét nghiệm HPV 20 Types', group: 'Sinh học phân tử', defaultHours: 48 },
  { id: 'hpv23', label: 'Xét nghiệm HPV 23 Types', group: 'Sinh học phân tử', defaultHours: 48 },
  { id: 'soituoi', label: 'Xét nghiệm Soi tươi', group: 'Vi sinh', defaultHours: 4 },
  { id: 'giaiphaubenh', label: 'Giải Phẫu Bệnh', group: 'Mô bệnh học', defaultHours: 72 },
  { id: 'combo_hpv20_cell', label: 'Gói Combo: HPV 20 + Cell', group: 'Combo 2 trong 1', defaultHours: 48 },
  { id: 'combo_hpv40_cell', label: 'Gói Combo: HPV 40 + Cell', group: 'Combo 2 trong 1', defaultHours: 48 },
  { id: 'combo_hpv23_cell', label: 'Gói Combo: HPV 23 + Cell', group: 'Combo 2 trong 1', defaultHours: 48 },
  { id: 'combo_hpv20_thinprep', label: 'Gói Combo: HPV 20 + ThinPrep', group: 'Combo 2 trong 1', defaultHours: 48 },
  { id: 'combo_hpv40_thinprep', label: 'Gói Combo: HPV 40 + ThinPrep', group: 'Combo 2 trong 1', defaultHours: 48 },
  { id: 'combo_hpv23_thinprep', label: 'Gói Combo: HPV 23 + ThinPrep', group: 'Combo 2 trong 1', defaultHours: 48 },
];

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Tab: 'deadline' | 'doctors' | 'sources'
  const [activeTab, setActiveTab] = useState<'deadline' | 'doctors' | 'sources'>(
    tabParam === 'doctors' ? 'doctors' : tabParam === 'sources' ? 'sources' : 'deadline'
  );

  // Turnaround Time State (giờ theo từng loại xét nghiệm)
  const [turnaroundHours, setTurnaroundHours] = useState<Record<string, number>>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Sync tab with URL query parameter
  useEffect(() => {
    if (tabParam === 'doctors') setActiveTab('doctors');
    else if (tabParam === 'sources') setActiveTab('sources');
    else setActiveTab('deadline');
  }, [tabParam]);

  // Load User from LocalStorage & Check Admin permission
  useEffect(() => {
    const rawUser = localStorage.getItem('bio_user');
    if (!rawUser) {
      router.push('/login');
      return;
    }
    try {
      const u = JSON.parse(rawUser);
      // Chỉ Admin mới có quyền vào Cài đặt hệ thống
      if (u.role !== 'admin' && u.username !== 'admin') {
        toast.warning('Chỉ Quản trị viên (Admin) mới có quyền truy cập Cài đặt hệ thống!', 'Từ chối quyền');
        router.push('/');
        return;
      }
      setCurrentUser(u);
    } catch (e) {
      console.error('Error parsing bio_user:', e);
      router.push('/login');
    }
  }, [router]);

  // Fetch Turnaround Time Settings
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const res = await fetch(getApiUrl('/settings/turnaround-time'), {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setTurnaroundHours(data);
          localStorage.setItem('bio_turnaround_times', JSON.stringify(data));
        } else {
          // Fallback to defaults
          const defaults: Record<string, number> = {};
          SERVICES_LIST.forEach((s) => {
            defaults[s.id] = s.defaultHours;
          });
          setTurnaroundHours(defaults);
        }
      } catch (err) {
        console.error('Error fetching turnaround times:', err);
        const defaults: Record<string, number> = {};
        SERVICES_LIST.forEach((s) => {
          defaults[s.id] = s.defaultHours;
        });
        setTurnaroundHours(defaults);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const handleHourChange = (serviceId: string, hours: number) => {
    setTurnaroundHours((prev) => ({
      ...prev,
      [serviceId]: Math.max(1, hours),
    }));
  };

  const handleSaveTurnaroundTimes = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(getApiUrl('/settings/turnaround-time'), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(turnaroundHours),
      });

      if (res.ok) {
        const savedData = await res.json();
        setTurnaroundHours(savedData);
        localStorage.setItem('bio_turnaround_times', JSON.stringify(savedData));
        toast.success(
          'Đã lưu cấu hình thời gian dự kiến trả kết quả thành công!',
          'Lưu thành công'
        );
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(
          err.message || 'Không thể lưu cấu hình trên máy chủ!',
          'Lưu thất bại'
        );
      }
    } catch (err) {
      console.error('Error saving turnaround times:', err);
      toast.error('Không thể kết nối đến máy chủ!', 'Lỗi kết nối');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    const defaults: Record<string, number> = {};
    SERVICES_LIST.forEach((s) => {
      defaults[s.id] = s.defaultHours;
    });
    setTurnaroundHours(defaults);
    toast.info('Đã khôi phục các giá trị mặc định, bấm Lưu để áp dụng!', 'Khôi phục');
  };

  return (
    <div className="flex h-screen w-full bg-[#f1f5f9] overflow-hidden select-none font-sans text-slate-800">
      {/* 1. SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        activeCategory=""
        onSelectCategory={(id) => {
          router.push(`/?category=${id}`);
        }}
        currentUser={currentUser}
        onLogout={() => setShowLogoutModal(true)}
      />

      {/* 2. MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* HEADER */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
          onLogout={() => setShowLogoutModal(true)}
        />

        {/* SETTINGS CONTENT WRAPPER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0070f3] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại danh sách phiếu</span>
                  </Link>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Cài đặt hệ thống
                </h1>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Quản lý cấu hình thời gian trả kết quả, danh mục bác sĩ và đơn vị gửi mẫu
                </p>
              </div>

              {/* Action buttons on header */}
              {activeTab === 'deadline' && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    disabled={isSaving || isLoadingSettings}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-95 text-xs font-bold text-slate-600 transition-all cursor-pointer flex items-center gap-1.5"
                    title="Khôi phục mốc giờ mặc định ban đầu"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Mặc định</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTurnaroundTimes}
                    disabled={isSaving || isLoadingSettings}
                    className="px-5 py-2 rounded-xl bg-[#0070f3] hover:bg-[#005bb5] active:scale-95 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Lưu cấu hình thời gian</span>
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Tabs (Không icon bên trong) */}
            <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('deadline');
                  router.replace('/settings?tab=deadline');
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
                  activeTab === 'deadline'
                    ? 'bg-[#0070f3] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Thời gian trả kết quả
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('doctors');
                  router.replace('/settings?tab=doctors');
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
                  activeTab === 'doctors'
                    ? 'bg-[#0070f3] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Quản lý Bác sĩ
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('sources');
                  router.replace('/settings?tab=sources');
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
                  activeTab === 'sources'
                    ? 'bg-[#0070f3] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Quản lý Nguồn / Đơn vị
              </button>
            </div>

            {/* TAB 1: THỜI GIAN TRẢ KẾT QUẢ (SLA DEADLINE) */}
            {activeTab === 'deadline' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Cấu hình số giờ dự kiến trả kết quả theo từng dịch vụ
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Thời gian dự kiến sẽ được tính tự động từ lúc tiếp nhận mẫu. Nếu vượt quá mốc giờ này, hệ thống sẽ cảnh báo quá hạn và đổi màu dòng ca thành màu đỏ nhạt.
                    </p>
                  </div>
                  <span className="shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0070f3] border border-blue-200">
                    {SERVICES_LIST.length} Dịch vụ
                  </span>
                </div>

                {isLoadingSettings ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0070f3]" />
                    <span className="text-xs font-semibold">Đang tải cấu hình thời gian...</span>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {SERVICES_LIST.map((svc, idx) => {
                      const currentVal = turnaroundHours[svc.id] || svc.defaultHours;

                      return (
                        <div
                          key={svc.id}
                          className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Service Info */}
                          <div className="space-y-1 min-w-[280px]">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0070f3] flex items-center justify-center font-bold text-xs shrink-0">
                                {idx + 1}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900">
                                {svc.label}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                                {svc.id}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 pl-8">
                              Nhóm: <strong className="text-slate-600 font-semibold">{svc.group}</strong> • Mặc định: {svc.defaultHours}h
                            </p>
                          </div>

                          {/* Quick presets & Number Input */}
                          <div className="flex flex-wrap items-center gap-3 pl-8 lg:pl-0">
                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1.5">
                              {[4, 12, 24, 48, 72].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => handleHourChange(svc.id, preset)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    currentVal === preset
                                      ? 'bg-blue-100 text-[#0070f3] border border-blue-300'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                                  }`}
                                >
                                  {preset}h
                                </button>
                              ))}
                            </div>

                            {/* Exact Number Input */}
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <input
                                  type="number"
                                  min={1}
                                  max={720}
                                  value={currentVal}
                                  onChange={(e) =>
                                    handleHourChange(svc.id, parseInt(e.target.value) || 1)
                                  }
                                  className="w-20 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-center text-slate-800 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-600">
                                Giờ ({(currentVal / 24).toFixed(1)} ngày)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer submit bar */}
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    * Các mốc giờ này sẽ áp dụng trực tiếp cho việc tính hạn chót và phát hiện trễ hạn trên toàn bộ hệ thống.
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveTurnaroundTimes}
                    disabled={isSaving || isLoadingSettings}
                    className="px-6 py-2.5 rounded-xl bg-[#0070f3] hover:bg-[#005bb5] active:scale-95 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Lưu cấu hình thời gian</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: QUẢN LÝ BÁC SĨ (CHUẨN BỊ SẴN GIAI ĐOẠN TIẾP THEO) */}
            {activeTab === 'doctors' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Danh sách bác sĩ đọc & ký duyệt kết quả
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Quản lý tài khoản, chứng chỉ hành nghề, phân công dịch vụ và chữ ký số của các bác sĩ.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toast.info(
                        'Tính năng thêm mới bác sĩ đang được mở rộng cho quản trị viên!',
                        'Thông báo'
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 self-start"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm bác sĩ mới</span>
                  </button>
                </div>

                {/* Doctor Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      name: 'TS.BS Nguyễn Sỹ Lãnh',
                      role: 'Trưởng khoa / Giám đốc chuyên môn',
                      signStatus: 'Đã tích hợp chữ ký điện tử',
                      casesCount: 420,
                    },
                    {
                      name: 'BS CK1 PHẠM THẾ HÙNG',
                      role: 'Bác sĩ chuyên khoa Sản Phụ khoa & Tế bào',
                      signStatus: 'Đã tích hợp chữ ký điện tử',
                      casesCount: 388,
                    },
                    {
                      name: 'ThS.BSNT Trịnh Ngọc Sơn',
                      role: 'Bác sĩ Nội trú Giải Phẫu Bệnh',
                      signStatus: 'Đã tích hợp chữ ký điện tử',
                      casesCount: 265,
                    },
                  ].map((doc, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 text-[#0070f3] flex items-center justify-center font-black text-sm shrink-0">
                          {doc.name.charAt(doc.name.indexOf(' ') + 1) || 'B'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {doc.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                            {doc.role}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Chữ ký sẵn sàng</span>
                        </span>
                        <span className="text-slate-400 font-medium text-[11px]">
                          {doc.casesCount} ca đã ký
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: QUẢN LÝ NGUỒN / ĐƠN VỊ GỬI MẪU */}
            {activeTab === 'sources' && (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Danh mục Nguồn / Đối tác gửi mẫu xét nghiệm
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Danh sách các phòng khám, bệnh viện đối tác, trung tâm y tế liên kết gửi mẫu tới phòng Lab.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toast.info(
                        'Tính năng thêm đơn vị gửi mẫu đang được mở rộng cho quản trị viên!',
                        'Thông báo'
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-[#0070f3] hover:bg-[#005bb5] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 self-start"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm nguồn đối tác</span>
                  </button>
                </div>

                {/* Sources Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">TÊN ĐƠN VỊ / NGUỒN</th>
                        <th className="py-3 px-4">LOẠI ĐỐI TÁC</th>
                        <th className="py-3 px-4">ĐỊA CHỈ</th>
                        <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {[
                        { name: 'Genetrust.vn', type: 'Trung tâm trực thuộc', address: 'Hà Nội' },
                        { name: 'medilab', type: 'Phòng khám liên kết', address: 'Hải Phòng' },
                        { name: 'Bệnh Viện ĐHQG', type: 'Bệnh viện công lập', address: 'Hà Nội' },
                        { name: 'Bệnh Viện Phụ Sản Hà Nội', type: 'Bệnh viện chuyên khoa', address: 'Hà Nội' },
                        { name: 'BV Sản Nhi Ninh Bình', type: 'Bệnh viện tỉnh', address: 'Ninh Bình' },
                        { name: 'PK ĐẠI DƯƠNG ĐH', type: 'Phòng khám tư nhân', address: 'Hà Nội' },
                        { name: 'BVĐK Ngã Tư Hồ', type: 'Bệnh viện đa khoa', address: 'Bắc Ninh' },
                      ].map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {item.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {item.type}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {item.address}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đang hoạt động</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* LOGOUT CONFIRM MODAL */}
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

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[#f1f5f9]">
          <Loader2 className="w-8 h-8 text-[#0070f3] animate-spin" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
