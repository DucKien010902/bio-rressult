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
  ChevronDown,
  Check,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  currentUser?: any;
  onLogout?: () => void;
  onUserSwitch?: (user: any) => void;
}

const DEMO_ACCOUNTS = [
  {
    username: 'admin_lab',
    fullName: 'Admin phòng Lab',
    role: 'admin',
    donVi: 'Quản lý Lab',
    label: '👑 Admin phòng Lab (Quản lý Lab)',
  },
  {
    username: 'bacsi_hùng',
    fullName: 'BS CK1 PHẠM THẾ HÙNG',
    role: 'doctor',
    donVi: 'Phòng Đọc Kết Quả & Giải Phẫu Bệnh',
    label: '🩺 BS CK1 PHẠM THẾ HÙNG (Bác sĩ)',
  },
  {
    username: 'bacsi_đương',
    fullName: 'TS . BS Nguyễn Khánh Dương',
    role: 'doctor',
    donVi: 'Khoa Tế Bào Học',
    label: '🩺 TS . BS Nguyễn Khánh Dương (Bác sĩ)',
  },
  {
    username: 'bv_đhqg',
    fullName: 'Bệnh Viện Đại Học Quốc Gia',
    role: 'lab',
    donVi: 'Bệnh Viện ĐHQG',
    label: '🏥 Bệnh Viện ĐHQG (Đơn vị tiếp nhận)',
  },
  {
    username: 'ninhbinh',
    fullName: 'Bệnh Viện Sản Nhi Ninh Bình',
    role: 'lab',
    donVi: 'BV Sản Nhi Ninh Bình',
    label: '🏥 BV Sản Nhi Ninh Bình (Đơn vị tiếp nhận)',
  },
];

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  testResultId?: string;
  caseCode?: string;
  patientName?: string;
  doctorName?: string;
  isRead: boolean;
  createdAt: string;
}

export default function Header({
  sidebarOpen,
  setSidebarOpen,
  currentUser,
  onLogout,
  onUserSwitch,
}: HeaderProps) {
  // User switcher state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notiRef = useRef<HTMLDivElement>(null);

  const isDoctor = currentUser?.role === 'doctor' || currentUser?.role === 'bacsy';
  const isAdmin = currentUser?.role === 'admin';

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      let url = 'http://localhost:5002/api/notifications';
      const params = new URLSearchParams();
      if (isDoctor && currentUser?.fullName) {
        params.append('doctor', currentUser.fullName);
        params.append('role', 'doctor');
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await fetch(url);
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
  }, [currentUser]);

  // Handle outside click for both dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setNotiOpen(false);
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
        await fetch('http://localhost:5002/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
      await fetch('http://localhost:5002/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch (e) {
      console.error('Mark all read error:', e);
    }
  };

  const handleSelectAccount = (acc: any) => {
    localStorage.setItem('bio_user', JSON.stringify(acc));
    if (onUserSwitch) {
      onUserSwitch(acc);
    } else {
      window.location.reload();
    }
    setDropdownOpen(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-2xs z-20 shrink-0 select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl text-slate-600 hover:text-[#0070f3] hover:bg-blue-50 border border-slate-200 bg-white transition-all cursor-pointer shadow-2xs"
          title="Thu nhỏ / Mở rộng Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* 1. NOTIFICATION BELL WITH FLOATING DROPDOWN */}
        <div className="relative" ref={notiRef}>
          <button
            onClick={() => setNotiOpen(!notiOpen)}
            className="relative p-2 text-slate-600 hover:text-[#0070f3] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1 min-w-[15px] h-[15px] bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center leading-none animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Floating Notification Popup */}
          {notiOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              {/* Header Bar */}
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  THÔNG BÁO MỚI ({unreadCount})
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-[#0070f3] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đọc tất cả</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
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
                        className={`p-3.5 text-xs transition-colors cursor-pointer hover:bg-slate-50 ${
                          !item.isRead ? 'bg-sky-50/50 font-medium' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between text-slate-800 font-bold mb-1">
                          <span className="truncate pr-2">{item.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal shrink-0">
                            {timeStr}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-2 leading-relaxed">
                          {item.message}
                        </p>
                        {item.testResultId && (
                          <Link
                            href={`/results/${item.testResultId}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkSingleRead(item._id, item.isRead);
                              setNotiOpen(false);
                            }}
                            className="inline-flex items-center gap-1 text-[#0070f3] hover:underline font-semibold"
                          >
                            <span>Xem phiếu</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. USER PROFILE PILL WITH ACCOUNT SWITCHER */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 pl-3 border-l border-slate-200 hover:bg-slate-50/80 p-1.5 rounded-xl transition-all cursor-pointer"
            title="Đổi tài khoản / Quyền hạn"
          >
            {/* User Avatar Icon according to role */}
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-[#0070f3] flex items-center justify-center shrink-0">
              {isAdmin ? (
                <Shield className="w-4 h-4 text-[#0070f3]" />
              ) : isDoctor ? (
                <Stethoscope className="w-4 h-4 text-[#0070f3]" />
              ) : (
                <Building2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>

            {/* User Title & Subtitle */}
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser?.fullName || (isAdmin ? 'Admin phòng Lab' : 'Người dùng')}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {isAdmin
                  ? 'Quản lý Lab'
                  : isDoctor
                  ? 'Bác sĩ'
                  : 'Đơn vị tiếp nhận'}
              </div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Switcher Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Chuyển đổi quyền hạn thử nghiệm
              </div>

              <div className="py-1">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isCurrent =
                    currentUser?.username === acc.username ||
                    currentUser?.fullName === acc.fullName;

                  return (
                    <button
                      key={acc.username}
                      onClick={() => handleSelectAccount(acc)}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                        isCurrent ? 'bg-blue-50/50 text-[#0070f3] font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div>{acc.label}</div>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-[#0070f3] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {onLogout && (
                <div className="pt-1 mt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất GenTech</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer ml-1"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
