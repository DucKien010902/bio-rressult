'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  Shield,
  Stethoscope,
  Building2,
  LogOut,
  ExternalLink,
  CheckCircle2,
  Settings,
  Trash2,
} from 'lucide-react';

import { getApiUrl, getAuthHeaders } from '@/lib/config';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  currentUser?: any;
  onLogout?: () => void;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  testResultId?: string;
  caseCode?: string;
  patientName?: string;
  doctorName?: string;
  sourceName?: string;
  recipientRole?: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
}

export default function Header({
  sidebarOpen,
  setSidebarOpen,
  currentUser,
  onLogout,
}: HeaderProps) {
  // Notification state
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notiRef = useRef<HTMLDivElement>(null);

  // Settings dropdown state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const isDoctor = currentUser?.role === 'doctor' || currentUser?.role === 'bacsy';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin';
  const isSource = currentUser?.role === 'lab';

  // Build query params based on role
  const getNotificationParams = () => {
    const params = new URLSearchParams();
    if (isAdmin) {
      params.append('role', 'admin');
    } else if (isDoctor) {
      params.append('role', 'doctor');
      if (currentUser?.fullName) params.append('doctor', currentUser.fullName);
      if (currentUser?.username) params.append('username', currentUser.username);
    } else if (isSource) {
      params.append('role', 'lab');
      if (currentUser?.donVi) params.append('source', currentUser.donVi);
      if (currentUser?.fullName) params.append('source', currentUser.fullName);
      if (currentUser?.username) params.append('username', currentUser.username);
    }
    return params.toString();
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      let url = getApiUrl('/notifications');
      const qs = getNotificationParams();
      if (qs) url += `?${qs}`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Auto-polling mỗi 15s để đồng bộ thông báo thời gian thực giữa Nguồn, Admin và Bác sĩ
    const interval = setInterval(fetchNotifications, 15000);
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentUser]);

  // Handle outside click for notification & settings dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setNotiOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkSingleRead = async (id: string, isRead: boolean) => {
    if (!isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
      try {
        await fetch(getApiUrl('/notifications'), {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ notificationId: id }),
        });
      } catch (e) {
        console.error('Mark read error:', e);
      }
    }
  };

  const handleMarkAllRead = async () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    try {
      let url = getApiUrl('/notifications');
      const qs = getNotificationParams();
      if (qs) url += `?${qs}`;

      await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      });
    } catch (e) {
      console.error('Mark all read error:', e);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ thông báo?')) return;
    setNotifications([]);
    setUnreadCount(0);
    try {
      let url = getApiUrl('/notifications');
      const qs = getNotificationParams();
      if (qs) url += `?${qs}`;

      await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (e) {
      console.error('Clear all notifications error:', e);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetItem = notifications.find((item) => item._id === id);
    setNotifications((prev) => prev.filter((item) => item._id !== id));
    if (targetItem && !targetItem.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    try {
      await fetch(getApiUrl(`/notifications/${id}`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (e) {
      console.error('Delete notification error:', e);
    }
  };

  return (
    <header className="h-[68px] bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-2xs z-20 shrink-0 select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 rounded-xl text-slate-600 hover:text-[#0070f3] hover:bg-blue-50 border border-slate-200 bg-white transition-all cursor-pointer shadow-2xs"
          title="Thu nhỏ / Mở rộng Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* 1. NOTIFICATION BELL WITH FLOATING DROPDOWN */}
        <div className="relative" ref={notiRef}>
          <button
            onClick={() => setNotiOpen(!notiOpen)}
            className="relative p-2.5 text-slate-600 hover:text-[#0070f3] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1 min-w-[16px] h-[16px] bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Floating Notification Popup */}
          {notiOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              {/* Header Bar */}
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  THÔNG BÁO ({unreadCount})
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#0070f3] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      title="Đánh dấu tất cả là đã đọc"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đọc hết</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAllNotifications}
                      className="text-xs text-red-500 hover:text-red-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer ml-1"
                      title="Xóa toàn bộ thông báo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa hết</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">
                    Không có thông báo mới nào
                  </div>
                ) : (
                  notifications.map((item) => {
                    const timeStr = item.createdAt
                      ? new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '12:00';

                    return (
                      <div
                        key={item._id}
                        onClick={() => handleMarkSingleRead(item._id, item.isRead)}
                        className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 relative group ${
                          !item.isRead ? 'bg-sky-50/50 font-medium' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between text-slate-800 font-bold mb-1 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {item.type === 'new_order' || item.title.includes('cần nhận mẫu') ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 shrink-0">
                                Đơn mới
                              </span>
                            ) : item.type === 'sample_accepted' || item.title.includes('tiếp nhận mẫu') ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800 shrink-0">
                                Đã nhận mẫu
                              </span>
                            ) : item.type === 'doctor_assigned' || item.title.includes('phân công') || item.title.includes('cần đọc') ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-purple-100 text-purple-800 shrink-0">
                                Phân công BS
                              </span>
                            ) : item.type === 'result_signed' || item.title.includes('đã ký duyệt') ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-teal-100 text-teal-800 shrink-0">
                                BS đã ký
                              </span>
                            ) : item.type === 'result_released' || item.title.includes('kết quả chính thức') ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                                Đã trả KQ
                              </span>
                            ) : null}
                            <span className="truncate text-xs font-bold text-slate-800">{item.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal shrink-0">
                            {timeStr}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-1.5 leading-relaxed text-xs">
                          {item.message}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          {item.testResultId ? (
                            <Link
                              href={`/results/${item.testResultId}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkSingleRead(item._id, item.isRead);
                                setNotiOpen(false);
                              }}
                              className="inline-flex items-center gap-1 text-[#0070f3] hover:underline font-semibold text-xs"
                            >
                              <span>Xem phiếu</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span />
                          )}
                          <button
                            onClick={(e) => handleDeleteNotification(item._id, e)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa thông báo này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 1.5 SETTINGS BUTTON WITH FLOATING DROPDOWN (CHỈ DÀNH CHO ADMIN) */}
        {isAdmin && (
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                settingsOpen
                  ? 'text-[#0070f3] bg-blue-50'
                  : 'text-slate-600 hover:text-[#0070f3] hover:bg-slate-100'
              }`}
              title="Cài đặt hệ thống"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Floating Settings Dropdown (Không dùng icon trong danh mục theo yêu cầu) */}
            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Cài đặt hệ thống
                </div>
                <div className="py-1">
                  <Link
                    href="/settings/deadline"
                    onClick={() => setSettingsOpen(false)}
                    className="block px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0070f3] transition-colors"
                  >
                    Thời gian trả kết quả
                  </Link>
                  <Link
                    href="/settings/doctors"
                    onClick={() => setSettingsOpen(false)}
                    className="block px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0070f3] transition-colors"
                  >
                    Quản lý Bác sĩ
                  </Link>
                  <Link
                    href="/settings/sources"
                    onClick={() => setSettingsOpen(false)}
                    className="block px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0070f3] transition-colors"
                  >
                    Quản lý Nguồn / Đơn vị
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. USER PROFILE PILL & LOGOUT BUTTON */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="flex items-center gap-2.5 p-1 rounded-xl">
            {/* User Avatar Icon according to role */}
            <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-[#0070f3] flex items-center justify-center shrink-0">
              {isAdmin ? (
                <Shield className="w-5 h-5 text-[#0070f3]" />
              ) : isDoctor ? (
                <Stethoscope className="w-5 h-5 text-[#0070f3]" />
              ) : (
                <Building2 className="w-5 h-5 text-emerald-600" />
              )}
            </div>

            {/* User Title & Subtitle */}
            <div className="hidden sm:block text-left">
              <div className="text-sm font-bold text-slate-800 leading-tight">
                {currentUser?.fullName || (isAdmin ? 'Admin phòng Lab' : 'Người dùng')}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {isAdmin
                  ? 'Quản lý Lab'
                  : isDoctor
                  ? 'Bác sĩ'
                  : 'Đơn vị tiếp nhận'}
              </div>
            </div>
          </div>

          {/* Direct Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-1"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
