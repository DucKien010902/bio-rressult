'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar, { MENU_CATEGORIES } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import PatientInfoCard from '@/components/cases/PatientInfoCard';
import HpvResultCard from '@/components/cases/HpvResultCard';
import CellResultCard from '@/components/cases/CellResultCard';
import SoituoiResultCard from '@/components/cases/SoituoiResultCard';
import GiaiphaubenhResultCard from '@/components/cases/GiaiphaubenhResultCard';
import ResultStickyBar from '@/components/cases/ResultStickyBar';
import PdfPreviewSection from '@/components/cases/PdfPreviewSection';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import {
  Eye,
  Save,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  FlaskConical,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';

import LogoutConfirmModal from '@/components/layout/LogoutConfirmModal';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // Session & Layout states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Case Data states
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Check auth & clean old cached GenHD usernames
  useEffect(() => {
    const userStr = localStorage.getItem('bio_user');
    if (!userStr) {
      router.push('/login');
    } else {
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
      }
    }
  }, [router]);

  // Fetch case data from Backend
  const fetchCase = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/cases/${id}`), {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCaseData(data);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || 'Không tìm thấy ca xét nghiệm hoặc không có quyền truy cập!');
        router.push('/');
      }
    } catch (err) {
      console.error('Error fetching case:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  const handleLogout = () => {
    localStorage.removeItem('bio_token');
    localStorage.removeItem('bio_user');
    router.push('/login');
  };

  // Field change handler
  const handleFieldChange = (field: string, value: any) => {
    setCaseData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save all changes
  const handleSaveChanges = async () => {
    if (!caseData || !id) return;
    if (currentUser?.role === 'lab') {
      alert('Tài khoản đơn vị gửi mẫu không có quyền chỉnh sửa thông tin!');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(getApiUrl(`/cases/${id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(caseData),
      });
      if (res.ok) {
        const updated = await res.json();
        setCaseData(updated);
        alert('Đã lưu thông tin phiếu xét nghiệm thành công!');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Có lỗi khi lưu thông tin phiếu!');
      }
    } catch (err) {
      console.error('Error saving case:', err);
      alert('Không thể kết nối đến máy chủ!');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Doctor Signature
  const handleToggleSign = async () => {
    if (!caseData || !id) return;
    if (currentUser?.role === 'lab') {
      alert('Tài khoản đơn vị gửi mẫu không có quyền ký duyệt kết quả!');
      return;
    }
    const newDaKy = !caseData.daKy;
    setIsSaving(true);
    try {
      const res = await fetch(getApiUrl(`/cases/${id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...caseData,
          daKy: newDaKy,
          trangThai: newDaKy ? 'da_tra_ket_qua' : 'chay_ket_qua',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCaseData(updated);
        alert(
          newDaKy
            ? 'Đã ký duyệt kết quả thành công!'
            : 'Đã hủy chữ ký kết quả!'
        );
      }
    } catch (err) {
      console.error('Error toggling sign:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Download PDF helper
  const handleDownloadPdf = () => {
    if (!id) return;
    const token = localStorage.getItem('bio_token') || '';
    window.open(getApiUrl(`/cases/${id}/export-pdf?token=${encodeURIComponent(token)}`), '_blank');
  };

  const currentCategory =
    MENU_CATEGORIES.find((m) => m.id === caseData?.loaiXetNghiem) ||
    MENU_CATEGORIES[3];

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden text-slate-800 font-sans">
      {/* 1. SIDEBAR DOCKED ON LEFT */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        activeCategory={caseData?.loaiXetNghiem || 'hpv40'}
        onSelectCategory={(catId) => {
          router.push(`/?category=${catId}`);
        }}
        currentUser={currentUser}
        onLogout={() => setShowLogoutModal(true)}
      />

      {/* 2. MAIN VIEW AREA (RIGHT OF SIDEBAR) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
          onLogout={() => setShowLogoutModal(true)}
        />

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 space-y-6">
          {loading || !caseData ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#0070f3]" />
              <p className="text-sm font-semibold">
                Đang tải thông tin ca xét nghiệm...
              </p>
            </div>
          ) : (
            <>
              {/* Back to List Button */}
              <div>
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0070f3] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại danh sách phiếu</span>
                </button>
              </div>

              {/* Case Header Bar (Tương ứng Ảnh 1 của bạn) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                      Phiếu xét nghiệm: {caseData.maSo}
                    </h1>

                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        caseData.trangThai === 'da_tra_ket_qua'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : caseData.trangThai === 'chay_ket_qua'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {caseData.trangThai === 'da_tra_ket_qua' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã trả kết quả</span>
                        </>
                      ) : caseData.trangThai === 'chay_ket_qua' ? (
                        <>
                          <FlaskConical className="w-3.5 h-3.5" />
                          <span>Chạy kết quả</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Nhập thông tin</span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Bệnh nhân:{' '}
                    <b className="text-slate-900 uppercase">{caseData.hoTen}</b>{' '}
                    ({currentCategory.label})
                  </p>
                </div>

                {/* Top Actions: [Lưu thay đổi] [Download PDF kết quả] */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0070f3] hover:bg-[#005bb5] text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Lưu thay đổi</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Download PDF kết quả</span>
                  </button>
                </div>
              </div>

              {/* Card 1: Thông tin hành chính bệnh nhân */}
              <PatientInfoCard
                caseData={caseData}
                onChange={handleFieldChange}
                onSave={handleSaveChanges}
                isSaving={isSaving}
              />

              {/* Card 2: Kết quả xét nghiệm theo dịch vụ */}
              {caseData?.loaiXetNghiem?.startsWith('combo_') ? (
                <>
                  <HpvResultCard
                    caseData={caseData}
                    onChange={handleFieldChange}
                    onSave={handleSaveChanges}
                    onToggleSign={handleToggleSign}
                    isSaving={isSaving}
                    isCombo={true}
                  />
                  <CellResultCard
                    caseData={caseData}
                    onChange={handleFieldChange}
                    onSave={handleSaveChanges}
                    onToggleSign={handleToggleSign}
                    isSaving={isSaving}
                    isCombo={true}
                  />
                </>
              ) : ['cell', 'thinprep'].includes(caseData?.loaiXetNghiem) ? (
                <CellResultCard
                  caseData={caseData}
                  onChange={handleFieldChange}
                  onSave={handleSaveChanges}
                  onToggleSign={handleToggleSign}
                  isSaving={isSaving}
                />
              ) : caseData?.loaiXetNghiem === 'soituoi' ? (
                <SoituoiResultCard
                  caseData={caseData}
                  onChange={handleFieldChange}
                  onSave={handleSaveChanges}
                  onToggleSign={handleToggleSign}
                  isSaving={isSaving}
                />
              ) : caseData?.loaiXetNghiem === 'giaiphaubenh' ? (
                <GiaiphaubenhResultCard
                  caseData={caseData}
                  onChange={handleFieldChange}
                  onSave={handleSaveChanges}
                  onToggleSign={handleToggleSign}
                  isSaving={isSaving}
                />
              ) : (
                <HpvResultCard
                  caseData={caseData}
                  onChange={handleFieldChange}
                  onSave={handleSaveChanges}
                  onToggleSign={handleToggleSign}
                  isSaving={isSaving}
                />
              )}

              {/* Section 3: Inline PDF Preview - Luôn hiển thị cố định ở cuối trang */}
              <PdfPreviewSection
                caseId={id}
                patientName={caseData?.hoTen}
                onDownload={handleDownloadPdf}
              />

              {/* Floating Sticky Bottom Bar */}
              <ResultStickyBar
                caseData={caseData}
                onDownloadPdf={handleDownloadPdf}
              />
            </>
          )}
        </main>
      </div>

      {/* MODAL XÁC NHẬN ĐĂNG XUẤT */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
