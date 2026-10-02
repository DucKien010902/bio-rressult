'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar, { MENU_CATEGORIES, isCategoryPermitted } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import CaseTable, { CaseItem } from '@/components/cases/CaseTable';
import DashboardView from '@/components/dashboard/DashboardView';
import { FileSpreadsheet } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/lib/config';

import LogoutConfirmModal from '@/components/layout/LogoutConfirmModal';
import ExportExcelModal from '@/components/cases/ExportExcelModal';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Category state from query or default to dashboard
  const categoryParam = searchParams?.get('category') || 'dashboard';
  const [activeCategory, setActiveCategory] = useState(categoryParam);

  // User session
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Layout states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Data states
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync category state when URL changes
  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  // Check auth & clean old cached GenHD usernames, đồng bộ quyền hạn mới nhất từ máy chủ
  useEffect(() => {
    const userStr = localStorage.getItem('bio_user');
    if (!userStr) {
      router.push('/login');
      return;
    }
    try {
      const u = JSON.parse(userStr);
      if (u.fullName && (u.fullName.includes('GenHD') || u.fullName.includes('genhd') || u.fullName.includes('Quản Trị Viên Lab'))) {
        u.fullName = 'Admin phòng Lab';
        u.donVi = 'Quản lý Lab';
        localStorage.setItem('bio_user', JSON.stringify(u));
      }
      setCurrentUser(u);
    } catch {
      router.push('/login');
      return;
    }

    // Tự động đồng bộ quyền hạn mới nhất từ backend
    const token = localStorage.getItem('bio_token');
    if (token) {
      fetch(getApiUrl('/auth/me'), {
        headers: getAuthHeaders(),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((freshUser) => {
          if (freshUser && freshUser.username) {
            setCurrentUser((prev: any) => {
              const merged = { ...(prev || {}), ...freshUser };
              localStorage.setItem('bio_user', JSON.stringify(merged));
              return merged;
            });
          }
        })
        .catch(() => {});
    }
  }, [router]);

  // Đảm bảo activeCategory hợp lệ theo quyền của tài khoản nguồn / bác sĩ
  useEffect(() => {
    if (!currentUser) return;
    const role = currentUser.role;
    if (role === 'admin' || role === 'superadmin' || currentUser.username === 'admin') return;
    if (activeCategory && !isCategoryPermitted(activeCategory, currentUser)) {
      setActiveCategory('all');
    }
  }, [currentUser, activeCategory]);

  // Fetch cases from Backend
  const fetchCases = async (signal?: AbortSignal) => {
    if (activeCategory === 'dashboard') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        getApiUrl(`/cases?category=${activeCategory}`),
        {
          headers: getAuthHeaders(),
          signal,
        }
      );
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching cases:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchCases(controller.signal);
    return () => {
      controller.abort();
    };
  }, [activeCategory]);

  const handleLogout = () => {
    localStorage.removeItem('bio_token');
    localStorage.removeItem('bio_user');
    router.push('/login');
  };

  const activeCategoryObj =
    MENU_CATEGORIES.find((m) => m.id === activeCategory) || MENU_CATEGORIES[3];

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden text-slate-800 font-sans">
      {/* 1. SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        activeCategory={activeCategory}
        onSelectCategory={(catId) => {
          setActiveCategory(catId);
          router.push(`/?category=${catId}`);
        }}
        currentUser={currentUser}
        onLogout={() => setShowLogoutModal(true)}
      />

      {/* 2. MAIN VIEW AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
          onLogout={() => setShowLogoutModal(true)}
        />

        {/* Main Content Body */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-7">
          {activeCategory === 'dashboard' ? (
            /* 1. MÀN HÌNH BÁO CÁO & THỐNG KÊ (DASHBOARD) */
            <DashboardView
              currentUser={currentUser}
              onSelectCategory={(catId, doctorFilter) => {
                setActiveCategory(catId);
                router.push(
                  doctorFilter
                    ? `/?category=${catId}&doctor=${encodeURIComponent(doctorFilter)}`
                    : `/?category=${catId}`
                );
              }}
            />
          ) : (
            /* 2. MÀN HÌNH BẢNG DANH SÁCH PHIẾU XÉT NGHIỆM */
            <>
              {/* Top Title Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {searchParams?.get('doctor')
                      ? `Phiếu xét nghiệm: ${searchParams.get('doctor')}`
                      : activeCategory === 'all'
                      ? 'Tất cả phiếu xét nghiệm'
                      : 'Danh sách phiếu xét nghiệm'}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {searchParams?.get('doctor')
                      ? `Danh sách các phiếu xét nghiệm phụ trách bởi ${searchParams.get('doctor')}`
                      : activeCategory === 'all'
                      ? 'Quản lý toàn bộ danh sách phiếu xét nghiệm các dịch vụ GENHD'
                      : `Quản lý workflow xét nghiệm ${activeCategoryObj.label} GENHD`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Xuất Excel</span>
                  </button>
                </div>
              </div>

              {/* Doctor Filter Active Banner (Screenshot 1) */}
              {searchParams?.get('doctor') && (
                <div className="mb-5 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs text-[#003399] animate-in fade-in">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span>
                      Đang xem phiếu của bác sĩ: <strong>{searchParams.get('doctor')}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(`/?category=${activeCategory}`)}
                    className="text-xs font-bold text-[#0070f3] hover:underline cursor-pointer"
                  >
                    Xóa lọc
                  </button>
                </div>
              )}

              {/* Case Table with Filters & Permissions */}
              <CaseTable
                cases={cases}
                loading={loading}
                onRefresh={fetchCases}
                currentUser={currentUser}
                filterDoctorInitial={searchParams?.get('doctor') || ''}
                activeCategory={activeCategory}
              />
            </>
          )}
        </main>
      </div>

      {/* 3. MODAL XÁC NHẬN ĐĂNG XUẤT */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      {/* 4. MODAL XUẤT FILE EXCEL DANH SÁCH CA */}
      <ExportExcelModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        activeCategory={activeCategory}
        doctorFilter={searchParams?.get('doctor') || ''}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc] text-xs text-slate-400 font-semibold">
          Đang tải trang quản lý GENHD...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
