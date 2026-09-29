'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LogoutConfirmModal from '@/components/layout/LogoutConfirmModal';
import Link from 'next/link';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import { toast } from '@/components/common/Toast';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  Edit3,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  Lock,
  RefreshCw,
  Search,
  Shield,
  Layers,
  ArrowLeft,
} from 'lucide-react';

const SERVICE_CATEGORIES = [
  { id: 'cell', label: 'Tế bào học (Cell)', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'thinprep', label: 'Tế bào học (ThinPrep)', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'hpv40', label: 'Sinh học phân tử (HPV 40)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'hpv20', label: 'Sinh học phân tử (HPV 20)', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  { id: 'hpv23', label: 'Sinh học phân tử (HPV 23)', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'soituoi', label: 'Vi sinh (Soi tươi)', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'giaiphaubenh', label: 'Mô bệnh học (Giải phẫu bệnh)', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
];

function SettingsSourcesContent() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Sources State
  const [sourcesList, setSourcesList] = useState<any[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSavingSource, setIsSavingSource] = useState(false);

  // Source Form State
  const [sourceForm, setSourceForm] = useState<any>({
    _id: '',
    fullName: '',
    username: '',
    password: '',
    donVi: '',
    soDienThoai: '',
    email: '',
    diaChi: '',
    allowedCategories: ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'soituoi', 'giaiphaubenh'],
    isActive: true,
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
        toast.warning('Chỉ Super Admin mới có quyền truy cập trang Cài đặt Nguồn / Đơn vị!', 'Từ chối');
        router.push('/');
        return;
      }
      setCurrentUser(parsed);
    } catch (e) {
      console.error('Error parsing bio_user:', e);
      router.push('/login');
    }
  }, [router]);

  // Fetch danh sách Nguồn / Đơn vị từ backend
  const fetchSources = async () => {
    setIsLoadingSources(true);
    try {
      const res = await fetch(getApiUrl('/users/sources'), {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSourcesList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching sources:', err);
      toast.error('Không thể kết nối đến máy chủ lấy danh sách nguồn đối tác', 'Lỗi');
    } finally {
      setIsLoadingSources(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const openEditSource = (src: any) => {
    setSelectedSource(src);
    setSourceForm({
      _id: src._id,
      fullName: src.fullName || '',
      username: src.username || '',
      password: '',
      donVi: src.donVi || src.fullName || '',
      soDienThoai: src.soDienThoai || '',
      email: src.email || '',
      diaChi: src.diaChi || '',
      allowedCategories: Array.isArray(src.allowedCategories) && src.allowedCategories.length > 0
        ? src.allowedCategories
        : ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'soituoi', 'giaiphaubenh'],
      isActive: src.isActive !== false,
    });
    setIsEditModalOpen(true);
  };

  const openAddSource = () => {
    setSelectedSource(null);
    setSourceForm({
      _id: '',
      fullName: '',
      username: '',
      password: '',
      donVi: '',
      soDienThoai: '',
      email: '',
      diaChi: '',
      allowedCategories: ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23', 'soituoi', 'giaiphaubenh'],
      isActive: true,
    });
    setIsAddModalOpen(true);
  };

  // Lưu thông tin Nguồn đối tác (Thêm mới hoặc Cập nhật)
  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceForm.fullName || !sourceForm.username) {
      toast.warning('Vui lòng điền Tên đơn vị và Tên đăng nhập!', 'Thiếu thông tin');
      return;
    }

    setIsSavingSource(true);
    try {
      const isEdit = !!sourceForm._id;
      const url = isEdit ? getApiUrl(`/users/sources/${sourceForm._id}`) : getApiUrl('/users/sources');
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(sourceForm),
      });

      if (res.ok) {
        toast.success(
          isEdit ? 'Cập nhật thông tin nguồn đối tác thành công!' : 'Thêm nguồn đối tác mới thành công!',
          'Thành công'
        );
        setIsEditModalOpen(false);
        setIsAddModalOpen(false);
        fetchSources();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Không thể lưu thông tin nguồn đối tác', 'Lỗi');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối máy chủ', 'Lỗi');
    } finally {
      setIsSavingSource(false);
    }
  };

  // Xóa tài khoản Nguồn
  const handleDeleteSource = async (src: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản nguồn đối tác "${src.fullName}"?`)) return;

    try {
      const res = await fetch(getApiUrl(`/users/sources/${src._id}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        toast.success('Đã xóa nguồn đối tác thành công!', 'Thành công');
        fetchSources();
      } else {
        toast.error('Không thể xóa nguồn đối tác', 'Lỗi');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối', 'Lỗi');
    }
  };

  const filteredSources = sourcesList.filter((src) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (src.fullName || '').toLowerCase().includes(q) ||
      (src.username || '').toLowerCase().includes(q) ||
      (src.donVi || '').toLowerCase().includes(q) ||
      (src.soDienThoai || '').toLowerCase().includes(q) ||
      (src.email || '').toLowerCase().includes(q) ||
      (src.diaChi || '').toLowerCase().includes(q)
    );
  });

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
                href="/"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0070f3] transition-colors mb-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại danh sách phiếu</span>
              </Link>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Quản lý Nguồn / Đơn vị
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Danh sách các phòng khám, bệnh viện đối tác gửi mẫu tới phòng Lab
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={fetchSources}
                disabled={isLoadingSources}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Tải lại danh sách"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSources ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
              <button
                type="button"
                onClick={openAddSource}
                className="px-4 py-2 rounded-xl bg-[#0070f3] hover:bg-[#005bb5] active:scale-95 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm nguồn đối tác</span>
              </button>
            </div>
          </div>

          {/* MAIN SOURCES CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-5">
            {/* Header section & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Danh mục Nguồn / Đối tác gửi mẫu xét nghiệm
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0070f3] border border-blue-200">
                    {filteredSources.length} Đơn vị
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Danh sách các phòng khám, bệnh viện đối tác gửi mẫu tới phòng Lab. Tài khoản có quyền đăng nhập để theo dõi trạng thái và tải phiếu kết quả.
                </p>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[260px] sm:min-w-[320px]">
                <input
                  type="text"
                  placeholder="Tìm theo tên, username, SĐT, đơn vị..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Loading State */}
            {isLoadingSources && (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#0070f3]" />
                <span className="text-xs font-semibold">Đang tải danh sách nguồn đối tác từ hệ thống...</span>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingSources && filteredSources.length === 0 && (
              <div className="py-16 text-center text-slate-400">
                <Building2 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">Không tìm thấy nguồn đối tác nào phù hợp</p>
                <p className="text-xs text-slate-400 mt-1">
                  Nhấn &quot;Thêm nguồn đối tác&quot; để tạo tài khoản gửi mẫu mới.
                </p>
              </div>
            )}

            {/* Sources Table */}
            {!isLoadingSources && filteredSources.length > 0 && (
              <div className="overflow-x-auto border border-slate-200/90 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">TỀN ĐƠN VỊ / NGUỒN</th>
                      <th className="py-3 px-4">TÀI KHOẢN</th>
                      <th className="py-3 px-4">MẬT KHẤU</th>
                      <th className="py-3 px-4">THÔNG TIN LIỀN HỆ</th>
                      <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                      <th className="py-3 px-4 text-center">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredSources.map((src) => {
                      return (
                        <tr key={src._id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Tên đơn vị */}
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">
                                  {src.fullName}
                                </span>
                                {src.diaChi && (
                                  <span className="text-[11px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[200px]">{src.diaChi}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Tài khoản */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-bold text-[#0070f3] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {src.username}
                            </span>
                          </td>

                          {/* Mật khẩu */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {src.passwordHint || '••••••'}
                            </span>
                          </td>

                          {/* Liên hệ: SĐT & Email */}
                          <td className="py-3.5 px-4 text-slate-600">
                            <div className="space-y-1">
                              {src.soDienThoai && (
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{src.soDienThoai}</span>
                                </div>
                              )}
                              {src.email && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[160px]">{src.email}</span>
                                </div>
                              )}
                              {!src.soDienThoai && !src.email && (
                                <span className="text-slate-400 italic text-[11px]">Chưa cập nhật</span>
                              )}
                            </div>
                          </td>


                          {/* Trạng thái */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                src.isActive !== false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {src.isActive !== false ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Hoạt động</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Tạm khóa</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* Thao tác */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditSource(src)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-[#0070f3] hover:border-blue-200 text-slate-500 transition-all cursor-pointer"
                                title="Chỉnh sửa thông tin"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSource(src)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 transition-all cursor-pointer"
                                title="Xóa tài khoản nguồn"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL THÊM / CHỈNH SỬA NGUỒN ĐỐI TÁC */}
      {(isEditModalOpen || isAddModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isEditModalOpen ? 'Chỉnh sửa tài khoản Nguồn đối tác' : 'Thêm Nguồn đối tác mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cấu hình tài khoản đăng nhập, đơn vị phân vùng dữ liệu và thông tin liên hệ.
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
            <form onSubmit={handleSaveSource} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Tên đơn vị & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Nguồn / Đơn vị đối tác <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Bệnh Viện Phụ Sản Hà Nội"
                    value={sourceForm.fullName}
                    onChange={(e) => setSourceForm({ ...sourceForm, fullName: e.target.value })}
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
                    placeholder="VD: lab_phusan"
                    value={sourceForm.username}
                    onChange={(e) => setSourceForm({ ...sourceForm, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Đơn vị phân vùng ca bệnh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Đơn vị liên kết (Phân vùng ca xét nghiệm) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="VD: Bệnh Viện Phụ Sản Hà Nội"
                    value={sourceForm.donVi}
                    onChange={(e) => setSourceForm({ ...sourceForm, donVi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20 pl-9"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  * Tên đơn vị dùng để lọc và gán ca xét nghiệm cho cơ sở này.
                </span>
              </div>

              {/* SĐT & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="0243.8343.181"
                      value={sourceForm.soDienThoai}
                      onChange={(e) => setSourceForm({ ...sourceForm, soDienThoai: e.target.value })}
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
                      placeholder="contact@phongkham.vn"
                      value={sourceForm.email}
                      onChange={(e) => setSourceForm({ ...sourceForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20 pl-9"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              {/* Địa chỉ cơ sở */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa chỉ cơ sở / Phòng khám đối tác
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="VD: 929 Đ. La Thành, Ba Đình, Hà Nội"
                    value={sourceForm.diaChi}
                    onChange={(e) => setSourceForm({ ...sourceForm, diaChi: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20 pl-9"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Dịch vụ xét nghiệm liên kết */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Dịch vụ xét nghiệm liên kết (Các loại xét nghiệm nguồn được phép gửi &amp; xem kết quả):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {SERVICE_CATEGORIES.map((cat) => {
                    const isChecked = (sourceForm.allowedCategories || []).includes(cat.id);
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
                            const cur = sourceForm.allowedCategories || [];
                            if (e.target.checked) {
                              setSourceForm({
                                ...sourceForm,
                                allowedCategories: [...cur, cat.id],
                              });
                            } else {
                              setSourceForm({
                                ...sourceForm,
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

              {/* Trạng thái hoạt động */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActiveSource"
                  checked={sourceForm.isActive}
                  onChange={(e) => setSourceForm({ ...sourceForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0070f3] focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="isActiveSource" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                  Kích hoạt tài khoản (Cho phép đơn vị đối tác đăng nhập để xem danh sách và tải file kết quả)
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
                  disabled={isSavingSource}
                  className="px-6 py-2.5 rounded-xl bg-[#0070f3] hover:bg-[#005bb5] active:scale-95 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
                >
                  {isSavingSource && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isEditModalOpen ? 'Lưu thay đổi' : 'Thêm nguồn đối tác'}</span>
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

export default function SettingsSourcesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[#f1f5f9]">
          <Loader2 className="w-8 h-8 text-[#0070f3] animate-spin" />
        </div>
      }
    >
      <SettingsSourcesContent />
    </Suspense>
  );
}
