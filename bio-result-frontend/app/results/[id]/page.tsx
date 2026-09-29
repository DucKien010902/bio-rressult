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
import { downloadCasePdf } from '@/lib/download';
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
  Pencil,
  Send,
  RotateCcw,
} from 'lucide-react';

import LogoutConfirmModal from '@/components/layout/LogoutConfirmModal';
import UnsavedChangesModal from '@/components/cases/UnsavedChangesModal';
import { toast } from '@/components/common/Toast';

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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Unsaved changes tracking states
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.username === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin' || isSuperAdmin;
  const isDoctor = currentUser?.role === 'doctor' || currentUser?.role === 'bacsy';
  const isLab = currentUser?.role === 'lab';

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
        setIsDirty(false);
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error(
          errJson.message || 'Không tìm thấy ca xét nghiệm hoặc không có quyền truy cập!',
          'Lỗi tải ca'
        );
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

  // Field change handler: tự động đồng bộ Bác sĩ đơn 2 theo Bác sĩ đơn 1 khi là ca Combo
  const handleFieldChange = (field: string, value: any) => {
    setIsDirty(true);
    setCaseData((prev: any) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      // Nếu là ca Combo và người dùng đổi Bác sĩ đơn 1 (bacSiDoc)
      // thì đơn 2 (bacSiDoc2) sẽ tự động nhảy theo bác sĩ đó (nhưng vẫn có thể sửa riêng đơn 2)
      if (prev?.loaiXetNghiem?.startsWith('combo_') && field === 'bacSiDoc') {
        updated.bacSiDoc2 = value;
      }

      return updated;
    });
  };

  // Save all changes
  const handleSaveChanges = async () => {
    if (!caseData || !id) return;
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
        setIsDirty(false);
        toast.success('Đã lưu thông tin phiếu xét nghiệm thành công!', 'Lưu thành công');
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || 'Có lỗi khi lưu thông tin phiếu!', 'Lưu thất bại');
      }
    } catch (err) {
      console.error('Error saving case:', err);
      toast.error('Không thể kết nối đến máy chủ!', 'Lỗi kết nối');
    } finally {
      setIsSaving(false);
    }
  };

  const [isReleasing, setIsReleasing] = useState(false);

  // Toggle Doctor Signature (hỗ trợ độc lập từng phần cho gói Combo)
  // Bác sĩ ký duyệt KHÔNG tự động chuyển sang đã trả kết quả; cần bước Admin xác nhận riêng
  const handleToggleSign = async (part?: number) => {
    if (!caseData || !id) return;
    if (currentUser?.role === 'lab') {
      toast.warning('Tài khoản đơn vị gửi mẫu không có quyền ký duyệt kết quả!', 'Từ chối quyền');
      return;
    }

    const isCombo = caseData.loaiXetNghiem?.startsWith('combo_');
    const updatePayload: any = { ...caseData };

    if (isCombo && part === 2) {
      // Ký duyệt / Hủy ký cho Phần 2 (Tế bào / ThinPrep)
      const newDaKy2 = !caseData.daKy2;
      updatePayload.daKy2 = newDaKy2;
      if (newDaKy2 && !updatePayload.ngayXetNghiem2) {
        updatePayload.ngayXetNghiem2 = new Date().toISOString();
      }
      // Nếu hủy ký thì trạng thái không thể là đã trả kết quả
      if (!newDaKy2 && updatePayload.trangThai === 'da_tra_ket_qua') {
        updatePayload.trangThai = 'chay_ket_qua';
      }
    } else if (isCombo && part === 1) {
      // Ký duyệt / Hủy ký cho Phần 1 (HPV)
      const newDaKy1 = !caseData.daKy;
      updatePayload.daKy = newDaKy1;
      if (newDaKy1 && !updatePayload.ngayTraKetQua) {
        updatePayload.ngayTraKetQua = new Date().toISOString();
      }
      // Nếu hủy ký thì trạng thái không thể là đã trả kết quả
      if (!newDaKy1 && updatePayload.trangThai === 'da_tra_ket_qua') {
        updatePayload.trangThai = 'chay_ket_qua';
      }
    } else {
      // Đơn lẻ thông thường
      const newDaKy = !caseData.daKy;
      updatePayload.daKy = newDaKy;
      if (newDaKy && !updatePayload.ngayTraKetQua) {
        updatePayload.ngayTraKetQua = new Date().toISOString();
      }
      // Nếu hủy ký thì trạng thái không thể là đã trả kết quả
      if (!newDaKy && updatePayload.trangThai === 'da_tra_ket_qua') {
        updatePayload.trangThai = 'chay_ket_qua';
      }
    }

    setIsSaving(true);
    try {
      const res = await fetch(getApiUrl(`/cases/${id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatePayload),
      });
      if (res.ok) {
        const updated = await res.json();
        setCaseData(updated);
        setIsDirty(false);
        const signedStatus = isCombo
          ? (part === 2 ? updated.daKy2 : updated.daKy)
          : updated.daKy;
        toast.success(
          signedStatus
            ? `Đã ký duyệt kết quả ${isCombo ? `Phần ${part}` : ''} thành công! Phiếu sẵn sàng để Admin xác nhận trả kết quả.`
            : `Đã hủy chữ ký kết quả ${isCombo ? `Phần ${part}` : ''}!`,
          signedStatus ? 'Ký duyệt thành công' : 'Đã hủy chữ ký'
        );
      }
    } catch (err) {
      console.error('Error toggling sign:', err);
      toast.error('Có lỗi xảy ra khi ký duyệt kết quả!', 'Lỗi thao tác');
    } finally {
      setIsSaving(false);
    }
  };

  // Admin duyệt và Xác nhận trả kết quả (hoặc Hủy trả kết quả)
  const handleReleaseResult = async () => {
    if (!caseData || !id) return;
    const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.username === 'superadmin';
    const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin' || isSuperAdmin;
    if (!isAdmin) {
      toast.warning('Chỉ Quản trị viên (Admin/Super Admin) mới có quyền xác nhận trả kết quả!', 'Từ chối quyền');
      return;
    }

    const isCombo = caseData.loaiXetNghiem?.startsWith('combo_');
    const isSigned = isCombo
      ? !!(caseData.daKy && caseData.daKy2)
      : !!caseData.daKy;

    // Nếu chưa trả kết quả thì Bác sĩ bắt buộc phải ký duyệt trước
    if (caseData.trangThai !== 'da_tra_ket_qua' && !isSigned) {
      toast.warning(
        'Bác sĩ chưa ký duyệt đầy đủ kết quả xét nghiệm, chưa thể xác nhận trả kết quả!',
        'Chưa ký duyệt',
      );
      return;
    }

    setIsReleasing(true);
    try {
      const res = await fetch(getApiUrl(`/cases/${id}/release`), {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const updated = await res.json();
        setCaseData(updated);
        setIsDirty(false);
        if (updated.trangThai === 'da_tra_ket_qua') {
          toast.success('Đã xác nhận trả kết quả xét nghiệm thành công!', 'Trả kết quả thành công');
        } else {
          toast.info('Đã hủy trạng thái trả kết quả!', 'Hủy trả kết quả');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || 'Lỗi khi xác nhận trả kết quả!', 'Thất bại');
      }
    } catch (err) {
      console.error('Error releasing case:', err);
      toast.error('Không thể kết nối đến máy chủ!', 'Lỗi kết nối');
    } finally {
      setIsReleasing(false);
    }
  };

  // Cuộn mượt đến phần xem trước PDF
  const handleScrollToPdfPreview = () => {
    const el = document.getElementById('pdf-preview-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Intercept navigation if there are unsaved changes
  const handleNavigate = (url: string) => {
    if (isDirty) {
      setPendingUrl(url);
      setShowUnsavedModal(true);
    } else {
      router.push(url);
    }
  };

  const handleConfirmLeave = () => {
    setIsDirty(false);
    setShowUnsavedModal(false);
    if (pendingUrl === '__BACK__') {
      window.history.back();
    } else if (pendingUrl) {
      router.push(pendingUrl);
    }
  };

  const handleStayOnPage = () => {
    setShowUnsavedModal(false);
    setPendingUrl(null);
  };

  // 1. Cảnh báo khi người dùng tắt tab, reload trang hoặc nhập URL khác
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // 2. Chặn các liên kết thẻ <a> (như Logo, Tạo phiếu mới) khi có thay đổi chưa lưu
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (!isDirty) return;
      const target = (e.target as HTMLElement).closest('a');
      if (target) {
        const href = target.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          e.preventDefault();
          e.stopPropagation();
          handleNavigate(href);
        }
      }
    };

    document.addEventListener('click', handleAnchorClick, true);
    return () => {
      document.removeEventListener('click', handleAnchorClick, true);
    };
  }, [isDirty]);

  // 3. Chặn nút Back/Forward của trình duyệt khi có thay đổi chưa lưu
  useEffect(() => {
    if (!isDirty) return;

    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      if (isDirty) {
        window.history.pushState(null, '', window.location.href);
        setPendingUrl('__BACK__');
        setShowUnsavedModal(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty]);

  // Download PDF helper: Tải trực tiếp về máy, KHÔNG mở tab mới
  const handleDownloadPdf = async (templateId?: string) => {
    if (!id || !caseData) return;
    try {
      setIsDownloadingPdf(true);
      await downloadCasePdf({
        caseId: id,
        templateId: templateId || caseData.pdfTemplate,
        patientName: caseData.hoTen,
        maSo: caseData.maSo,
      });
    } catch (err: any) {
      console.error('Lỗi tải PDF:', err);
      toast.error(err.message || 'Không thể tải file PDF!', 'Lỗi tải xuống');
    } finally {
      setIsDownloadingPdf(false);
    }
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
          handleNavigate(`/?category=${catId}`);
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
                  onClick={() => handleNavigate('/')}
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
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:opacity-50 ${
                      isDirty
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25 ring-2 ring-red-400'
                        : 'bg-[#0070f3] hover:bg-[#005bb5] text-white shadow-xs'
                    }`}
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
                    onClick={() => handleDownloadPdf()}
                    disabled={isDownloadingPdf}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-60"
                  >
                    {isDownloadingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    ) : (
                      <Download className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{isDownloadingPdf ? 'Đang tải PDF...' : 'Download PDF kết quả'}</span>
                  </button>
                </div>
              </div>

              {/* Card 1: Thông tin hành chính bệnh nhân */}
              <PatientInfoCard
                caseData={caseData}
                onChange={handleFieldChange}
                onSave={handleSaveChanges}
                isSaving={isSaving}
                currentUser={currentUser}
                onReleaseResult={handleReleaseResult}
                onDownloadPdf={() => handleDownloadPdf()}
                onPreviewPdf={handleScrollToPdfPreview}
                isReleasing={isReleasing}
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
                    currentUser={currentUser}
                  />
                  <CellResultCard
                    caseData={caseData}
                    onChange={handleFieldChange}
                    onSave={handleSaveChanges}
                    onToggleSign={handleToggleSign}
                    isSaving={isSaving}
                    isCombo={true}
                    currentUser={currentUser}
                  />
                </>
              ) : ['cell', 'thinprep'].includes(caseData?.loaiXetNghiem) ? (
                <CellResultCard
                  caseData={caseData}
                  onChange={handleFieldChange}
                  onSave={handleSaveChanges}
                  onToggleSign={handleToggleSign}
                  isSaving={isSaving}
                  currentUser={currentUser}
                />
              ) : caseData?.loaiXetNghiem === 'soituoi' ? (
                <SoituoiResultCard
                  caseData={caseData}
                  onChange={handleFieldChange}
                  onSave={handleSaveChanges}
                  onToggleSign={handleToggleSign}
                  isSaving={isSaving}
                  currentUser={currentUser}
                />
              ) : caseData?.loaiXetNghiem === 'giaiphaubenh' ? (
                <GiaiphaubenhResultCard
                  caseData={caseData}
                  onChange={handleFieldChange}
                  onSave={handleSaveChanges}
                  onToggleSign={handleToggleSign}
                  isSaving={isSaving}
                  currentUser={currentUser}
                />
              ) : (
                <HpvResultCard
                  caseData={caseData}
                  onChange={handleFieldChange}
                  onSave={handleSaveChanges}
                  onToggleSign={handleToggleSign}
                  isSaving={isSaving}
                  currentUser={currentUser}
                />
              )}

              {/* Section 3: Inline PDF Preview - Luôn hiển thị cố định ở cuối trang */}
              <div id="pdf-preview-section">
                <PdfPreviewSection
                  caseId={id}
                  patientName={caseData?.hoTen}
                  currentTemplate={caseData?.pdfTemplate}
                  onDownload={handleDownloadPdf}
                  onTemplateChange={(tplId) => {
                    setIsDirty(true);
                    setCaseData((prev: any) => ({ ...prev, pdfTemplate: tplId }));
                  }}
                />
              </div>

              {/* Floating Sticky Bottom Bar */}
              <ResultStickyBar
                caseData={caseData}
                onDownloadPdf={handleDownloadPdf}
                currentUser={currentUser}
                onReleaseResult={handleReleaseResult}
                onPreviewPdf={handleScrollToPdfPreview}
                isReleasing={isReleasing}
                isDownloading={isDownloadingPdf}
              />
            </>
          )}
        </main>
      </div>

      {/* MODAL CẢNH BÁO THAY ĐỔI CHƯA LƯU */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onStay={handleStayOnPage}
        onLeave={handleConfirmLeave}
      />

      {/* MODAL XÁC NHẬN ĐĂNG XUẤT */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
