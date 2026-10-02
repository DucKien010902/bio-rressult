'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LogoutConfirmModal from '@/components/layout/LogoutConfirmModal';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import { toast } from '@/components/common/Toast';
import {
  Save,
  RotateCcw,
  Loader2,
} from 'lucide-react';

const SERVICES_LIST = [
  { id: 'thinprep', label: 'Xét nghiệm ThinPrep', group: 'Tế bào học', defaultHours: 24 },
  { id: 'cell', label: 'Xét nghiệm Cell', group: 'Tế bào học', defaultHours: 24 },
  { id: 'hpv40', label: 'Xét nghiệm HPV 40 Types', group: 'Sinh học phân tử', defaultHours: 48 },
  { id: 'hpv20', label: 'Xét nghiệm HPV 20 Types', group: 'Sinh học phân tử', defaultHours: 48 },
  { id: 'hpv23', label: 'Xét nghiệm HPV 23 Types', group: 'Sinh học phân tử', defaultHours: 48 },
  { id: 'hpv24', label: 'Xét nghiệm HPV 24 Types', group: 'Sinh học phân tử', defaultHours: 48 },
  { id: 'soituoi', label: 'Xét nghiệm Soi tươi', group: 'Vi sinh', defaultHours: 4 },
  { id: 'giaiphaubenh', label: 'Giải Phẫu Bệnh', group: 'Mô bệnh học', defaultHours: 72 },
  { id: 'giaiphaubenh_mobenh', label: 'Giải Phẫu Bệnh - Mô Bệnh', group: 'Mô bệnh học', defaultHours: 72 },
  { id: 'giaiphaubenh_tebaohoc', label: 'Giải Phẫu Bệnh - Tế Bào Học', group: 'Mô bệnh học', defaultHours: 72 },
  { id: 'combo_hpv20_cell', label: 'Gói Combo: HPV 20 + Cell', group: 'Combo 2 trong 1', defaultHours: 48 },
  { id: 'combo_hpv40_cell', label: 'Gói Combo: HPV 40 + Cell', group: 'Combo 2 trong 1', defaultHours: 48 },
  { id: 'combo_hpv23_cell', label: 'Gói Combo: HPV 23 + Cell', group: 'Combo 2 trong 1', defaultHours: 48 },
  { id: 'combo_hpv20_thinprep', label: 'Gói Combo: HPV 20 + ThinPrep', group: 'Combo 2 trong 1', defaultHours: 48 },
  { id: 'combo_hpv40_thinprep', label: 'Gói Combo: HPV 40 + ThinPrep', group: 'Combo 2 trong 1', defaultHours: 48 },
  { id: 'combo_hpv23_thinprep', label: 'Gói Combo: HPV 23 + ThinPrep', group: 'Combo 2 trong 1', defaultHours: 48 },
];

function SettingsDeadlineContent() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [turnaroundHours, setTurnaroundHours] = useState<Record<string, number>>({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Authentication check
  useEffect(() => {
    const rawUser = typeof window !== 'undefined' ? localStorage.getItem('bio_user') : null;
    if (!rawUser) {
      router.push('/login');
      return;
    }
    try {
      const parsed = JSON.parse(rawUser);
      if (parsed.role !== 'superadmin' && parsed.username !== 'superadmin') {
        toast.warning('Chỉ Super Admin mới có quyền truy cập trang Cài đặt thời gian!', 'Từ chối');
        router.push('/');
        return;
      }
      setCurrentUser(parsed);
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
    toast.info('Đã khôi phục các giá trị thời gian mặc định (nhấn Lưu để áp dụng).', 'Khôi phục');
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      {/* 1. SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        activeCategory="all"
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
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-7 space-y-6 custom-scrollbar">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
            <div>
              <Link
                href="/?category=all"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0070f3] transition-colors mb-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại danh sách phiếu</span>
              </Link>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Thời gian trả kết quả
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Cấu hình số giờ dự kiến trả kết quả theo từng dịch vụ xét nghiệm
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={handleResetDefaults}
                disabled={isLoadingSettings}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục mặc định</span>
              </button>
              <button
                type="button"
                onClick={handleSaveTurnaroundTimes}
                disabled={isSaving || isLoadingSettings}
                className="px-4 py-2 rounded-xl bg-[#0070f3] hover:bg-[#005bb5] active:scale-95 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Lưu cài đặt</span>
              </button>
            </div>
          </div>

          {/* MAIN SETTINGS CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Cấu hình số giờ dự kiến trả kết quả theo từng dịch vụ
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thời gian dự kiến sẽ được tính tự động từ lúc tiếp nhận mẫu. Nếu vượt quá mốc giờ này, hệ thống sẽ cảnh báo quá hạn và đổi màu dòng ca thành màu đỏ nhạt.
                </p>
              </div>
              <span className="shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0070f3] border border-blue-200 self-start sm:self-auto">
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
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                * Các mốc giờ này sẽ áp dụng trực tiếp cho việc tính hạn chót và phát hiện trễ hạn trên toàn bộ hệ thống.
              </span>
              <button
                type="button"
                onClick={handleSaveTurnaroundTimes}
                disabled={isSaving || isLoadingSettings}
                className="px-6 py-2.5 rounded-xl bg-[#0070f3] hover:bg-[#005bb5] active:scale-95 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
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

export default function SettingsDeadlinePage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[#f1f5f9]">
          <Loader2 className="w-8 h-8 text-[#0070f3] animate-spin" />
        </div>
      }
    >
      <SettingsDeadlineContent />
    </Suspense>
  );
}
