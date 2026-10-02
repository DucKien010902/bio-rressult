'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LogoutConfirmModal from '@/components/layout/LogoutConfirmModal';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getApiUrl, getAuthHeaders } from '@/lib/config';

// Nếu signatureUrl là full URL (MinIO public URL), dùng thẳng; còn không thì wrap qua API
const getImgUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return getApiUrl(url);
};
import { toast } from '@/components/common/Toast';
import {
  UserCheck,
  KeyRound,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Image as ImageIcon,
  FileSignature,
  X,
  Phone,
  Mail,
  Award,
  Lock,
  RefreshCw,
} from 'lucide-react';

const DOCTOR_CATEGORIES = [
  { id: 'cell', label: 'Tế bào học (Cell)', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'thinprep', label: 'Tế bào học (ThinPrep)', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'hpv40', label: 'Sinh học phân tử (HPV 40)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'hpv20', label: 'Sinh học phân tử (HPV 20)', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'hpv23', label: 'Sinh học phân tử (HPV 23)', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'hpv24', label: 'Sinh học phân tử (HPV 24)', badge: 'bg-teal-50 text-teal-800 border-teal-300' },
  { id: 'soituoi', label: 'Vi sinh (Soi tươi)', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'giaiphaubenh', label: 'Mô bệnh học (Giải phẫu bệnh)', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'giaiphaubenh_mobenh', label: 'Giải phẫu bệnh - Mô bệnh', badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  { id: 'giaiphaubenh_tebaohoc', label: 'Giải phẫu bệnh - Tế bào học', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const TITLE_SUGGESTIONS = [
  '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
  'Trưởng khoa Giải phẫu bệnh BV Việt Đức',
  '(Bệnh viện K Trung Ương)',
  'Khoa Tế Bào Học',
  'Khoa Giải Phẫu Bệnh',
];

function SettingsDoctorsContent() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Doctors Management State
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);
  const [isUploadingSig, setIsUploadingSig] = useState(false);

  // Doctor Form State
  const [doctorForm, setDoctorForm] = useState<any>({
    _id: '',
    fullName: '',
    username: '',
    password: '',
    title: '',
    donVi: '',
    soDienThoai: '',
    email: '',
    chungChiHanhNghe: '',
    allowedCategories: ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'hpv24', 'soituoi', 'giaiphaubenh', 'giaiphaubenh_mobenh', 'giaiphaubenh_tebaohoc'],
    isActive: true,
    signatureUrl: '',
  });

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
        toast.warning('Chỉ Super Admin mới có quyền truy cập trang Cài đặt Bác sĩ!', 'Từ chối');
        router.push('/');
        return;
      }
      setCurrentUser(parsed);
    } catch (e) {
      console.error('Error parsing bio_user:', e);
      router.push('/login');
    }
  }, [router]);

  // Fetch danh sách Bác sĩ từ backend
  const fetchDoctors = async () => {
    setIsLoadingDoctors(true);
    try {
      const res = await fetch(getApiUrl('/users/doctors'), {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setDoctorsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const openEditDoctor = (doc: any) => {
    setSelectedDoctor(doc);
    setDoctorForm({
      _id: doc._id,
      fullName: doc.fullName || '',
      username: doc.username || '',
      password: '',
      title: doc.title || '',
      donVi: doc.donVi || '',
      soDienThoai: doc.soDienThoai || '',
      email: doc.email || '',
      chungChiHanhNghe: doc.chungChiHanhNghe || '',
      allowedCategories: Array.isArray(doc.allowedCategories) && doc.allowedCategories.length > 0
        ? doc.allowedCategories
        : ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'hpv24', 'soituoi', 'giaiphaubenh', 'giaiphaubenh_mobenh', 'giaiphaubenh_tebaohoc'],
      isActive: doc.isActive !== false,
      signatureUrl: doc.signatureUrl || '',
    });
    setIsEditModalOpen(true);
  };

  const openAddDoctor = () => {
    setSelectedDoctor(null);
    setDoctorForm({
      _id: '',
      fullName: '',
      username: '',
      password: '',
      title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
      donVi: 'Khoa Xét Nghiệm & Tế Bào',
      soDienThoai: '',
      email: '',
      chungChiHanhNghe: '',
      allowedCategories: ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'hpv24', 'soituoi', 'giaiphaubenh', 'giaiphaubenh_mobenh', 'giaiphaubenh_tebaohoc'],
      isActive: true,
      signatureUrl: '',
    });
    setIsAddModalOpen(true);
  };

  // Upload chữ ký lên MinIO
  const handleUploadDoctorSignature = async (file: File, doctorId?: string) => {
    const targetId = doctorId || doctorForm._id;
    if (!targetId) {
      toast.warning('Vui lòng lưu thông tin bác sĩ trước khi tải chữ ký!', 'Chú ý');
      return;
    }

    setIsUploadingSig(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('bio_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(getApiUrl(`/users/doctors/${targetId}/signature`), {
        method: 'POST',
        headers,
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Tải ảnh chữ ký lên MinIO thành công!', 'Thành công');
        setDoctorForm((prev: any) => ({ ...prev, signatureUrl: data.signatureUrl }));
        fetchDoctors();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Lỗi khi tải ảnh chữ ký', 'Lỗi');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối khi tải chữ ký', 'Lỗi');
    } finally {
      setIsUploadingSig(false);
    }
  };

  // Xóa chữ ký trên MinIO
  const handleDeleteDoctorSignature = async (doctorId?: string) => {
    const targetId = doctorId || doctorForm._id;
    if (!targetId) return;

    if (!confirm('Bạn có chắc chắn muốn xóa ảnh chữ ký này khỏi hệ thống MinIO?')) return;

    setIsUploadingSig(true);
    try {
      const res = await fetch(getApiUrl(`/users/doctors/${targetId}/signature`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        toast.success('Đã xóa chữ ký thành công!', 'Thành công');
        setDoctorForm((prev: any) => ({ ...prev, signatureUrl: '' }));
        fetchDoctors();
      } else {
        toast.error('Không thể xóa ảnh chữ ký', 'Lỗi');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối', 'Lỗi');
    } finally {
      setIsUploadingSig(false);
    }
  };

  // Lưu thông tin bác sĩ (Thêm mới hoặc Cập nhật)
  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorForm.fullName || !doctorForm.username) {
      toast.warning('Vui lòng điền Họ tên và Tên đăng nhập!', 'Thiếu thông tin');
      return;
    }

    setIsSavingDoctor(true);
    try {
      const isEdit = !!doctorForm._id;
      const url = isEdit ? getApiUrl(`/users/doctors/${doctorForm._id}`) : getApiUrl('/users/doctors');
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(doctorForm),
      });

      if (res.ok) {
        toast.success(
          isEdit ? 'Cập nhật thông tin bác sĩ thành công!' : 'Thêm bác sĩ mới thành công!',
          'Thành công'
        );
        setIsEditModalOpen(false);
        setIsAddModalOpen(false);
        fetchDoctors();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Không thể lưu thông tin bác sĩ', 'Lỗi');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối', 'Lỗi');
    } finally {
      setIsSavingDoctor(false);
    }
  };

  // Xóa tài khoản bác sĩ
  const handleDeleteDoctor = async (doc: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản bác sĩ "${doc.fullName}"?`)) return;

    try {
      const res = await fetch(getApiUrl(`/users/doctors/${doc._id}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        toast.success('Đã xóa tài khoản bác sĩ!', 'Thành công');
        fetchDoctors();
      } else {
        toast.error('Không thể xóa tài khoản bác sĩ', 'Lỗi');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối', 'Lỗi');
    }
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
                Quản lý Bác sĩ
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Cấu hình tài khoản, chức danh, phân công dịch vụ và tải ảnh chữ ký số lưu trên MinIO
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={fetchDoctors}
                disabled={isLoadingDoctors}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Tải lại danh sách bác sĩ"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDoctors ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
              <button
                type="button"
                onClick={openAddDoctor}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm bác sĩ mới</span>
              </button>
            </div>
          </div>

          {/* DOCTORS CONTENT CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Danh sách bác sĩ đọc & ký duyệt kết quả
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0070f3] border border-blue-200">
                    {doctorsList.length} Bác sĩ
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cấu hình tài khoản, chức danh, phân công dịch vụ và tải ảnh chữ ký số lưu trữ trên MinIO.
                </p>
              </div>
            </div>

            {/* Loading State */}
            {isLoadingDoctors && (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#0070f3]" />
                <span className="text-xs font-semibold">Đang tải danh sách bác sĩ từ hệ thống...</span>
              </div>
            )}

            {/* Doctor Cards Grid */}
            {!isLoadingDoctors && doctorsList.length === 0 && (
              <div className="py-16 text-center text-slate-400">
                <UserCheck className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">Chưa có tài khoản bác sĩ nào trong hệ thống</p>
              </div>
            )}

            {!isLoadingDoctors && doctorsList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {doctorsList.map((doc) => {
                  const initials = doc.fullName
                    ? doc.fullName
                        .split(' ')
                        .filter(Boolean)
                        .slice(-2)
                        .map((p: string) => p[0])
                        .join('')
                        .toUpperCase()
                    : 'BS';

                  return (
                    <div
                      key={doc._id}
                      className="rounded-2xl border border-slate-200/90 p-5 bg-white hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Card Header: Avatar & Names */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0070f3] to-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-blue-500/20">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                                {doc.fullName}
                              </h3>
                              <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                                @{doc.username}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                              doc.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {doc.isActive !== false ? 'Hoạt động' : 'Tạm khóa'}
                          </span>
                        </div>

                        {/* Title / Department */}
                        <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-700 font-bold truncate">
                            <Award className="w-3.5 h-3.5 text-[#0070f3] shrink-0" />
                            <span className="truncate">{doc.title || 'Bác sĩ chẩn đoán'}</span>
                          </div>
                          {doc.donVi && (
                            <div className="flex items-center gap-1.5 text-slate-500 font-medium truncate">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{doc.donVi}</span>
                            </div>
                          )}
                        </div>

                        {/* Signature Preview */}
                        <div className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50/40 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileSignature className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-xs font-semibold text-slate-600 truncate">
                              Chữ ký số MinIO
                            </span>
                          </div>
                          {doc.signatureUrl ? (
                            <div className="flex items-center gap-2 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getImgUrl(doc.signatureUrl)}
                                alt="Chữ ký"
                                className="h-8 max-w-[90px] object-contain border border-slate-200 bg-white rounded-md px-1"
                              />
                              <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Đã có
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                              Chưa tải lên
                            </span>
                          )}
                        </div>

                        {/* Account Status */}
                        <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-bold">Tài khoản đăng nhập:</span>
                          {doc.hasAccount ? (
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              <KeyRound className="w-3 h-3 text-blue-500" />
                              {doc.username}
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              Chưa cấp tài khoản
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openEditDoctor(doc)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#0070f3] hover:text-white text-slate-700 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa & Chữ ký</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDoctor(doc)}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 transition-all cursor-pointer"
                          title="Xóa tài khoản bác sĩ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL THÊM / CHỈNH SỬA BÁC SĨ */}
      {(isEditModalOpen || isAddModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isEditModalOpen ? 'Chỉnh sửa tài khoản Bác sĩ' : 'Thêm tài khoản Bác sĩ mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thông tin bác sĩ đọc kết quả, chức vụ và chữ ký số điện tử trên phiếu kết quả.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsAddModalOpen(false);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveDoctor} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Họ tên & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên Bác sĩ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: BSCK1 . Nguyễn Trung Trực"
                    value={doctorForm.fullName}
                    onChange={(e) => setDoctorForm({ ...doctorForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên đăng nhập (Username) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: bacsi_truc"
                    value={doctorForm.username}
                    onChange={(e) => setDoctorForm({ ...doctorForm, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Số điện thoại & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="0987 654 321"
                      value={doctorForm.soDienThoai}
                      onChange={(e) => setDoctorForm({ ...doctorForm, soDienThoai: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20 pl-9"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email liên hệ
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="bacsi@benhvien.vn"
                      value={doctorForm.email || ''}
                      onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20 pl-9"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              {/* Chức danh & Đơn vị công tác */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chức danh chuyên môn (In phía dưới tên trên file PDF)
                </label>
                <input
                  type="text"
                  placeholder="VD: (Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)"
                  value={doctorForm.title}
                  onChange={(e) => setDoctorForm({ ...doctorForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20"
                />
                {/* Gợi ý chức danh */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-semibold self-center">Gợi ý:</span>
                  {TITLE_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setDoctorForm({ ...doctorForm, title: sug })}
                      className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-[#0070f3] px-2 py-0.5 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đơn vị / Khoa phòng công tác
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Khoa Tế Bào Học"
                    value={doctorForm.donVi}
                    onChange={(e) => setDoctorForm({ ...doctorForm, donVi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Chứng chỉ hành nghề (CCHN)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 012345/BYT-CCHN"
                    value={doctorForm.chungChiHanhNghe}
                    onChange={(e) => setDoctorForm({ ...doctorForm, chungChiHanhNghe: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Phân công dịch vụ được phép đọc kết quả */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Phân công dịch vụ đọc kết quả (Chọn các loại xét nghiệm bác sĩ phụ trách):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {DOCTOR_CATEGORIES.map((cat) => {
                    const isChecked = (doctorForm.allowedCategories || []).includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50 text-[#0070f3] border-blue-300 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = doctorForm.allowedCategories || [];
                            if (e.target.checked) {
                              setDoctorForm({
                                ...doctorForm,
                                allowedCategories: [...cur, cat.id],
                              });
                            } else {
                              setDoctorForm({
                                ...doctorForm,
                                allowedCategories: cur.filter((c: string) => c !== cat.id),
                              });
                            }
                          }}
                          className="w-4 h-4 rounded text-[#0070f3] focus:ring-blue-500 border-slate-300"
                        />
                        <span>{cat.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Quản lý ảnh Chữ ký số (MinIO) */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-[#0070f3]" />
                    <span className="text-xs font-bold text-slate-900">
                      Ảnh Chữ ký số điện tử (MinIO Storage)
                    </span>
                  </div>
                  {doctorForm.signatureUrl && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDoctorSignature()}
                      disabled={isUploadingSig}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ảnh</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="w-40 h-20 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {doctorForm.signatureUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={getImgUrl(doctorForm.signatureUrl)}
                        alt="Chữ ký xem trước"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-center text-slate-300">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <span className="text-[10px] font-bold block text-slate-400">Chưa có chữ ký</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 text-center sm:text-left">
                    <p className="text-xs font-medium text-slate-600">
                      Tải lên file ảnh chữ ký (PNG nền trong suốt hoặc JPG nét). Ảnh này sẽ được tự động vẽ lên phiếu PDF khi bác sĩ bấm Ký duyệt.
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0070f3] text-xs font-bold border border-blue-200 transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingSig ? 'Đang tải lên...' : 'Chọn file ảnh chữ ký'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        disabled={isUploadingSig}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadDoctorSignature(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Trạng thái hoạt động */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={doctorForm.isActive}
                  onChange={(e) => setDoctorForm({ ...doctorForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0070f3] focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                  Kích hoạt tài khoản (Cho phép bác sĩ đăng nhập và ký duyệt phiếu)
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingDoctor}
                  className="px-6 py-2.5 rounded-xl bg-[#0070f3] hover:bg-[#005bb5] active:scale-95 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
                >
                  {isSavingDoctor && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isEditModalOpen ? 'Lưu thay đổi' : 'Thêm bác sĩ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default function SettingsDoctorsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[#f1f5f9]">
          <Loader2 className="w-8 h-8 text-[#0070f3] animate-spin" />
        </div>
      }
    >
      <SettingsDoctorsContent />
    </Suspense>
  );
}
