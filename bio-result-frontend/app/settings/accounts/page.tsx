'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import LogoutConfirmModal from '@/components/layout/LogoutConfirmModal';
import { getApiUrl } from '@/lib/config';
import { toast } from '@/components/common/Toast';
import {
  KeyRound,
  UserCheck,
  UserX,
  Search,
  Lock,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Users,
  ShieldCheck,
  UserPlus,
  Stethoscope,
  Building2,
  ArrowLeft,
  Edit3,
  Shield,
  ShieldAlert,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AccountItem {
  _id: string;
  username: string;
  fullName: string;
  role: 'superadmin' | 'admin' | 'doctor' | 'bacsy' | 'lab';
  isActive: boolean;
  passwordHint?: string;
  donVi?: string;
  createdAt?: string;
  doctorId?: any;
  sourceId?: any;
}

export default function AccountsSettingsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [unlinkedDoctors, setUnlinkedDoctors] = useState<any[]>([]);
  const [unlinkedSources, setUnlinkedSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal Create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAccRole, setNewAccRole] = useState<'admin' | 'doctor' | 'lab'>('doctor');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Edit Account (Tên, Mã, MK, Vai trò, Trạng thái)
  const [showEditModal, setShowEditModal] = useState(false);
  const [targetAccount, setTargetAccount] = useState<AccountItem | null>(null);
  const [showPasswordInEdit, setShowPasswordInEdit] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    _id: string;
    username: string;
    fullName: string;
    role: string;
    password: string;
    isActive: boolean;
  }>({
    _id: '',
    username: '',
    fullName: '',
    role: 'doctor',
    password: '',
    isActive: true,
  });

  // Modal Delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const user = JSON.parse(localStorage.getItem('bio_user') || 'null');
        if (!user) {
          router.replace('/login');
          return;
        }
        setCurrentUser(user);

        // Kiểm tra quyền Super Admin
        const isSuper = user.role === 'superadmin' || user.username === 'superadmin';
        if (!isSuper) {
          toast.error('Chỉ Super Admin mới có quyền truy cập trang Quản lý Tài khoản!', 'Từ chối truy cập');
          setTimeout(() => router.replace('/'), 1200);
          return;
        }

        fetchData();
      } catch {
        router.replace('/login');
      }
    }
  }, [router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [accRes, docRes, srcRes] = await Promise.all([
        fetch(getApiUrl('/users/accounts-list')),
        fetch(getApiUrl('/users/doctors')),
        fetch(getApiUrl('/users/sources')),
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData);
      }

      let docs: any[] = [];
      let srcs: any[] = [];
      if (docRes.ok) docs = await docRes.json();
      if (srcRes.ok) srcs = await srcRes.json();

      // Lọc các bác sĩ và nguồn CHƯA CÓ tài khoản
      setUnlinkedDoctors(docs.filter((d) => !d.hasAccount));
      setUnlinkedSources(srcs.filter((s) => !s.hasAccount));
    } catch (err) {
      console.error('Error fetching accounts data:', err);
      toast.error('Lỗi khi nạp dữ liệu tài khoản từ hệ thống', 'Lỗi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (account: AccountItem) => {
    if (account.role === 'superadmin' && account.isActive) {
      toast.warning('Không thể khóa tài khoản Super Admin!', 'Cảnh báo');
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/users/accounts/${account._id}/toggle-active`), {
        method: 'PUT',
      });
      const data = await res.json();
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((acc) => (acc._id === account._id ? { ...acc, isActive: data.isActive } : acc))
        );
        toast.success(
          data.isActive
            ? `Tài khoản '${account.username}' đã ĐƯỢC MỞ KHÓA.`
            : `Tài khoản '${account.username}' đã BỊ KHÓA ĐĂNG NHẬP.`,
          'Trạng thái tài khoản'
        );
      } else {
        toast.error(data.message || 'Lỗi cập nhật trạng thái', 'Lỗi');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ', 'Lỗi');
    }
  };

  const handleOpenCreateModal = () => {
    setNewAccRole('doctor');
    setSelectedDoctorId(unlinkedDoctors[0]?._id || '');
    setSelectedSourceId(unlinkedSources[0]?._id || '');
    setNewUsername(unlinkedDoctors[0]?.code || '');
    setNewPassword('123456');
    setNewAdminFullName('');
    setShowCreateModal(true);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let payload: any = {
        role: newAccRole,
        username: newUsername.trim(),
        password: newPassword.trim(),
      };

      if (newAccRole === 'doctor') {
        if (!selectedDoctorId) {
          toast.warning('Vui lòng chọn Bác sĩ trong danh mục', 'Thiếu thông tin');
          setIsSubmitting(false);
          return;
        }
        payload.doctorId = selectedDoctorId;
      } else if (newAccRole === 'lab') {
        if (!selectedSourceId) {
          toast.warning('Vui lòng chọn Nguồn / Đơn vị trong danh mục', 'Thiếu thông tin');
          setIsSubmitting(false);
          return;
        }
        payload.sourceId = selectedSourceId;
      } else if (newAccRole === 'admin') {
        if (!newAdminFullName.trim()) {
          toast.warning('Vui lòng nhập Họ tên quản trị viên', 'Thiếu thông tin');
          setIsSubmitting(false);
          return;
        }
        payload.fullName = newAdminFullName.trim();
      }

      const res = await fetch(getApiUrl('/users/accounts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Đã tạo tài khoản '${data.username}' thành công!`, 'Thành công');
        setShowCreateModal(false);
        fetchData();
      } else {
        toast.error(data.message || 'Lỗi khi tạo tài khoản', 'Lỗi');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (acc: AccountItem) => {
    setTargetAccount(acc);
    setEditFormData({
      _id: acc._id,
      username: acc.username,
      fullName: acc.fullName,
      role: acc.role,
      password: acc.passwordHint || '',
      isActive: acc.isActive,
    });
    setShowPasswordInEdit(false);
    setShowEditModal(true);
  };

  const handleSaveEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.username.trim() || !editFormData.fullName.trim()) {
      toast.warning('Vui lòng nhập đầy đủ Tên đăng nhập và Họ tên/Đơn vị!', 'Thiếu thông tin');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(getApiUrl(`/users/accounts/${editFormData._id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editFormData.username.trim(),
          fullName: editFormData.fullName.trim(),
          role: editFormData.role,
          password: editFormData.password.trim(),
          isActive: editFormData.isActive,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Cập nhật tài khoản '${editFormData.username}' thành công! Đã tự động đồng bộ sang hồ sơ Bác sĩ/Nguồn trong CSDL.`,
          'Cập nhật thành công'
        );
        setShowEditModal(false);
        fetchData();
      } else {
        toast.error(data.message || 'Lỗi cập nhật tài khoản', 'Lỗi');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!targetAccount) return;
    if (targetAccount.role === 'superadmin') {
      toast.error('Không thể xóa tài khoản Super Admin!', 'Thao tác bị cấm');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(getApiUrl(`/users/accounts/${targetAccount._id}`), {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(
          `Đã xóa tài khoản '${targetAccount.username}'. Lưu ý danh sách hồ sơ Bác sĩ / Nguồn vẫn được bảo toàn nguyên vẹn.`,
          'Thành công'
        );
        setShowDeleteModal(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Lỗi khi xóa tài khoản', 'Lỗi');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ', 'Lỗi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bio_user');
    localStorage.removeItem('bio_token');
    router.replace('/login');
  };

  // Lọc danh sách
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'superadmin' && acc.role === 'superadmin') ||
      (roleFilter === 'admin' && acc.role === 'admin') ||
      (roleFilter === 'doctor' && (acc.role === 'doctor' || acc.role === 'bacsy')) ||
      (roleFilter === 'lab' && acc.role === 'lab');
    return matchesSearch && matchesRole;
  });

  const superAdminCount = accounts.filter((a) => a.role === 'superadmin').length;
  const adminCount = accounts.filter((a) => a.role === 'admin').length;
  const doctorAccCount = accounts.filter((a) => a.role === 'doctor' || a.role === 'bacsy').length;
  const sourceAccCount = accounts.filter((a) => a.role === 'lab').length;

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      {/* 1. SIDEBAR NẰM TRÁI CỐ ĐỊNH FULL CHIỀU CAO */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        activeCategory="all"
        currentUser={currentUser}
        onLogout={() => setShowLogoutModal(true)}
      />

      {/* 2. CỘT PHẢI CHỨA HEADER & NỘI DUNG CUỘN */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* HEADER PHÍA TRÊN */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentUser={currentUser}
          onLogout={() => setShowLogoutModal(true)}
        />

        {/* NỘI DUNG CHÍNH (CHUẨN FORM NHƯ CÁC TRANG CÀI ĐẶT KHÁC) */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-7 space-y-6 custom-scrollbar">
          {/* Page Header Card (Không dùng tabs) */}
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
                Quản lý Tài khoản (Super Admin)
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Quản trị tài khoản đăng nhập, sửa tên, mã username, mật khẩu, trạng thái hoạt động (bật/tắt) và phân quyền
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={fetchData}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                title="Tải lại danh sách tài khoản"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 rounded-xl bg-[#0070f3] hover:bg-[#005bb5] active:scale-95 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cấp / Tạo tài khoản mới</span>
              </button>
            </div>
          </div>

          {/* Thống kê tài khoản */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0070f3] flex items-center justify-center font-bold shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Tổng tài khoản
                </div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{accounts.length}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Quản trị (Admin)
                </div>
                <div className="text-xl font-black text-slate-900 mt-0.5">
                  {superAdminCount + adminCount}{' '}
                  <span className="text-xs text-slate-400 font-normal">({superAdminCount} Super)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  TK Bác sĩ
                </div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{doctorAccCount}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  TK Đơn vị gửi mẫu
                </div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{sourceAccCount}</div>
              </div>
            </div>
          </div>

          {/* Tìm kiếm & Bộ lọc */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm theo Tên đăng nhập hoặc Họ tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-[#0070f3] transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Lọc theo vai trò:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 outline-none cursor-pointer focus:bg-white focus:border-[#0070f3]"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="superadmin">Super Admin (Tối cao)</option>
                <option value="admin">Admin Quản trị</option>
                <option value="doctor">Bác sĩ đọc KQ</option>
                <option value="lab">Đơn vị gửi mẫu (Lab)</option>
              </select>
            </div>
          </div>

          {/* Bảng danh sách Tài khoản */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#0070f3]" />
                <span>Đang nạp danh sách tài khoản từ hệ thống...</span>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                Không tìm thấy tài khoản phù hợp với tìm kiếm.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Tài khoản (Username)</th>
                      <th className="py-3.5 px-4">Tên người dùng / Đơn vị</th>
                      <th className="py-3.5 px-4">Vai trò (Role)</th>
                      <th className="py-3.5 px-4">Mật khẩu (Hint)</th>
                      <th className="py-3.5 px-4 text-center">Cho phép đăng nhập</th>
                      <th className="py-3.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAccounts.map((acc) => {
                      const isSuper = acc.role === 'superadmin';
                      return (
                        <tr key={acc._id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Username */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            <div className="flex items-center gap-2">
                              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-blue-700">{acc.username}</span>
                              {isSuper && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                                  SUPER
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Full Name & Sub info */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{acc.fullName}</div>
                            {acc.donVi && (
                              <div className="text-[11px] text-slate-400 font-medium">
                                {acc.donVi}
                              </div>
                            )}
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            {acc.role === 'superadmin' ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                Super Admin
                              </span>
                            ) : acc.role === 'admin' ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                Quản trị Lab
                              </span>
                            ) : acc.role === 'doctor' || acc.role === 'bacsy' ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Bác sĩ đọc KQ
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                Đơn vị gửi mẫu
                              </span>
                            )}
                          </td>

                          {/* Password Hint */}
                          <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">
                            <span className="bg-slate-100 px-2 py-1 rounded-md text-[11px] border border-slate-200">
                              {acc.passwordHint || '••••••'}
                            </span>
                          </td>

                          {/* Active Toggle Switch */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleActive(acc)}
                              disabled={isSuper}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                isSuper
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed opacity-90'
                                  : acc.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer'
                              }`}
                              title={
                                isSuper
                                  ? 'Tài khoản Super Admin luôn hoạt động'
                                  : acc.isActive
                                  ? 'Click để TẠM KHÓA tài khoản'
                                  : 'Click để BẬT HOẠT ĐỘNG'
                              }
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  acc.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                                }`}
                              />
                              <span>{acc.isActive ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}</span>
                            </button>
                          </td>

                          {/* Actions: Chỉnh sửa & Xóa */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Nút Chỉnh sửa thông tin tài khoản (Tên, Mã, MK, Vai trò) */}
                              <button
                                onClick={() => handleOpenEditModal(acc)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Chỉnh sửa tài khoản (Tên, Mã, Mật khẩu, Vai trò)"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {!isSuper && (
                                <button
                                  onClick={() => {
                                    setTargetAccount(acc);
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa tài khoản đăng nhập (Không ảnh hưởng danh sách Bác sĩ / Nguồn)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
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

      {/* MODAL CẤP / TẠO TÀI KHOẢN MỚI */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0070f3]" />
                <h3 className="font-extrabold text-slate-900 text-base">Cấp / Tạo tài khoản mới</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Đối tượng cấp tài khoản:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAccRole('doctor')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      newAccRole === 'doctor'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Bác sĩ
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccRole('lab')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      newAccRole === 'lab'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Nguồn / Đơn vị
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAccRole('admin')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      newAccRole === 'admin'
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Admin Quản lý
                  </button>
                </div>
              </div>

              {/* Nếu chọn Bác sĩ */}
              {newAccRole === 'doctor' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn Bác sĩ cần cấp tài khoản: <span className="text-rose-500">*</span>
                  </label>
                  {unlinkedDoctors.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                      Tất cả Bác sĩ trong danh mục đã có tài khoản. Hãy thêm Bác sĩ mới trong trang Bác sĩ trước.
                    </div>
                  ) : (
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => {
                        setSelectedDoctorId(e.target.value);
                        const doc = unlinkedDoctors.find((d) => d._id === e.target.value);
                        if (doc) setNewUsername(doc.code || '');
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0070f3]"
                      required
                    >
                      <option value="">-- Chọn bác sĩ --</option>
                      {unlinkedDoctors.map((doc) => (
                        <option key={doc._id} value={doc._id}>
                          {doc.fullName} ({doc.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Nếu chọn Nguồn */}
              {newAccRole === 'lab' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chọn Nguồn / Đơn vị cần cấp tài khoản: <span className="text-rose-500">*</span>
                  </label>
                  {unlinkedSources.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                      Tất cả Nguồn gửi mẫu đã có tài khoản. Hãy thêm Đơn vị mới trong trang Nguồn trước.
                    </div>
                  ) : (
                    <select
                      value={selectedSourceId}
                      onChange={(e) => {
                        setSelectedSourceId(e.target.value);
                        const src = unlinkedSources.find((s) => s._id === e.target.value);
                        if (src) setNewUsername(src.code || '');
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0070f3]"
                      required
                    >
                      <option value="">-- Chọn đơn vị gửi mẫu --</option>
                      {unlinkedSources.map((src) => (
                        <option key={src._id} value={src._id}>
                          {src.fullName} ({src.code})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Nếu tạo Admin mới */}
              {newAccRole === 'admin' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên Quản trị viên: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Văn A (Quản lý Lab)"
                    value={newAdminFullName}
                    onChange={(e) => setNewAdminFullName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0070f3]"
                    required
                  />
                </div>
              )}

              {/* Tên đăng nhập */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đăng nhập (Username): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: bacsi_lanh hoặc lab_medilab"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#0070f3]"
                  required
                />
              </div>

              {/* Mật khẩu khởi tạo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu khởi tạo: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Mặc định: 123456"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#0070f3]"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0070f3] hover:bg-[#005bb5] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Đang cấp...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA TÀI KHOẢN (TÊN, MÃ USERNAME, MẬT KHẨU, VAI TRÒ, TRẠNG THÁI) */}
      {showEditModal && targetAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#0070f3]" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Chỉnh sửa tài khoản: {targetAccount.username}
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditAccount} className="p-5 space-y-4">
              {/* Họ tên người dùng / Tên đơn vị */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ tên người dùng / Tên đơn vị: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0070f3]"
                  placeholder="VD: TS.BS Nguyễn Sỹ Lánh"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * Tên sẽ tự động đồng bộ sang hồ sơ Bác sĩ hoặc Đơn vị trong toàn bộ hệ thống.
                </span>
              </div>

              {/* Tên đăng nhập (Mã / Username) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đăng nhập (Mã / Username): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#0070f3]"
                  placeholder="VD: bacsi_lanh"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * Mã định danh tài khoản dùng để đăng nhập.
                </span>
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu mới:
                </label>
                <div className="relative">
                  <input
                    type={showPasswordInEdit ? 'text' : 'password'}
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#0070f3] pr-10"
                    placeholder="Nhập mật khẩu mới..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInEdit(!showPasswordInEdit)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPasswordInEdit ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * Hệ thống sẽ lưu mật khẩu được mã hóa an toàn và cập nhật gợi ý mật khẩu.
                </span>
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vai trò (Role):
                </label>
                <select
                  value={editFormData.role}
                  disabled={targetAccount.role === 'superadmin'}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0070f3] disabled:opacity-60 cursor-pointer"
                >
                  {targetAccount.role === 'superadmin' ? (
                    <option value="superadmin">Super Admin (Tối cao)</option>
                  ) : (
                    <>
                      <option value="admin">Admin Quản lý Lab</option>
                      <option value="doctor">Bác sĩ đọc KQ</option>
                      <option value="lab">Đơn vị gửi mẫu (Lab)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Cho phép đăng nhập (Bật / Tắt) */}
              <div className="pt-2 flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-800">Trạng thái đăng nhập</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {editFormData.isActive ? 'Cho phép người dùng đăng nhập' : 'Khóa tài khoản này'}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={targetAccount.role === 'superadmin'}
                  onClick={() =>
                    setEditFormData({ ...editFormData, isActive: !editFormData.isActive })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    editFormData.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                  } ${targetAccount.role === 'superadmin' ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                      editFormData.isActive ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0070f3] hover:bg-[#005bb5] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA TÀI KHOẢN */}
      {showDeleteModal && targetAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Xác nhận xóa tài khoản '{targetAccount.username}'?
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-left">
                ℹ️ <strong>Quy tắc xóa 1 chiều:</strong> Việc xóa tài khoản chỉ thu hồi quyền đăng nhập vào hệ thống. Hồ sơ Bác sĩ hoặc Đơn vị gửi mẫu cùng toàn bộ lịch sử ca bệnh, chữ ký và kết quả xét nghiệm <strong>VẪN ĐƯỢC GIỮ NGUYÊN VẸN</strong> trong CSDL.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Đang xóa...' : 'Đồng ý xóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirm modal */}
      {showLogoutModal && (
        <LogoutConfirmModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}
