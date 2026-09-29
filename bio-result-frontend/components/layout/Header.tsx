'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Bell,
  BellRing,
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
import { toast } from '@/components/common/Toast';

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
  const router = useRouter();

  // Notification state
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notiRef = useRef<HTMLDivElement>(null);

  // Desktop notification permission & tracking state
  const [desktopPermission, setDesktopPermission] = useState<string>('default');
  const seenNotiIdsRef = useRef<Set<string>>(new Set());
  const isInitialFetchRef = useRef<boolean>(true);

  // Settings dropdown state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Lấy ngay user từ prop hoặc fallback trực tiếp từ localStorage để không bị trễ state khi tải lại trang
  const activeUser =
    currentUser ||
    (typeof window !== 'undefined'
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem('bio_user') || 'null');
          } catch {
            return null;
          }
        })()
      : null);

  const isDoctor = activeUser?.role === 'doctor' || activeUser?.role === 'bacsy';
  const isSuperAdmin = activeUser?.role === 'superadmin' || activeUser?.username === 'superadmin';
  const isAdmin = activeUser?.role === 'admin' || isSuperAdmin;
  const isSource = activeUser?.role === 'lab';

  // Đăng ký Service Worker và tự động hỏi quyền Desktop Notification ngay khi vào trang
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('Không thể đăng ký Service Worker:', err);
        });
      }
      if ('Notification' in window) {
        setDesktopPermission(Notification.permission);

        // Tự động kích hoạt hỏi quyền thông báo ngay sau 1.2s khi vào trang nếu chưa từng hỏi
        if (Notification.permission === 'default') {
          const timer = setTimeout(() => {
            requestDesktopPermission();
          }, 1200);
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);

  // Hàm phát âm thanh chuông "ting" nhẹ nhàng bằng Web Audio API (chuẩn 100%, không cần file mp3 ngoài)
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Chuông 2 nốt trong trẻo (E6 -> G6)
      playTone(659.25, 0, 0.22);
      playTone(783.99, 0.12, 0.32);
    } catch (e) {
      // AudioContext bị hạn chế do chưa tương tác người dùng
    }
  };

  // Bắn thông báo ra màn hình máy tính Windows / macOS (Desktop OS Banner)
  const sendDesktopNotification = async (title: string, message: string, testResultId?: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const targetUrl = testResultId ? `/results/${testResultId}` : window.location.pathname;

    // Cách 1: Ưu tiên dùng Service Worker showNotification (hoạt động tốt nhất trên Windows / Chrome / Edge)
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body: message,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: String(Date.now()),
            requireInteraction: true,
            data: { url: targetUrl },
          });
          return;
        }
      }
    } catch (e) {
      console.warn('SW notification fallback to window.Notification:', e);
    }

    // Cách 2: Native new Notification
    try {
      const desktopNoti = new Notification(title, {
        body: message,
        icon: '/logo.png',
        tag: String(Date.now()),
        requireInteraction: true,
      });
      desktopNoti.onclick = () => {
        window.focus();
        if (testResultId) {
          router.push(`/results/${testResultId}`);
        }
      };
    } catch (err) {
      console.error('Lỗi hiển thị Desktop Notification:', err);
    }
  };

  // Hàm xin quyền gửi thông báo màn hình máy tính (Windows / macOS Banner)
  const requestDesktopPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setDesktopPermission(res);
        if (res === 'granted') {
          playNotificationSound();
          toast.success('Đã bật thành công thông báo trực tiếp trên màn hình máy tính!', 'Kích hoạt thành công');
          await sendDesktopNotification(
            'GENHD - THÔNG BÁO MÀN HÌNH MÁY TÍNH',
            'Hệ thống GENHD sẽ gửi thông báo trực tiếp lên góc màn hình Windows khi có ca xét nghiệm mới hoặc có kết quả.'
          );
        } else if (res === 'denied') {
          toast.error(
            'Trình duyệt đang chặn thông báo. Vui lòng nhấn vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ URL để chọn Cho phép thông báo (Notifications: Allow)!',
            'Đang bị chặn'
          );
        }
      } catch (err) {
        console.error('Request notification permission error:', err);
      }
    }
  };

  // Nút thử nghiệm thông báo (bắn đồng thời cả chuông, toast trong web và thông báo Windows ngoài màn hình)
  const handleTestNotification = async () => {
    playNotificationSound();

    // 1. Toast trong trang web
    toast.notification(
      'Bác sĩ TS.BS Nguyễn Sỹ Lánh đã ký duyệt kết quả xét nghiệm GTHD-GPB-471',
      'THỬ THÔNG BÁO HỆ THỐNG',
      {
        duration: 6000,
        actionLabel: 'Xem chi tiết',
      }
    );

    // 2. Thông báo trực tiếp ngoài màn hình máy tính Windows
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        await sendDesktopNotification(
          'GENHD - THÔNG BÁO MÀN HÌNH',
          'Bác sĩ TS.BS Nguyễn Sỹ Lánh đã ký duyệt kết quả xét nghiệm GTHD-GPB-471'
        );
      } else {
        await requestDesktopPermission();
      }
    }
  };

  // Build query params based on role
  const getNotificationParams = () => {
    const params = new URLSearchParams();
    if (isAdmin) {
      params.append('role', 'admin');
    } else if (isDoctor) {
      params.append('role', 'doctor');
      if (activeUser?.fullName) params.append('doctor', activeUser.fullName);
      if (activeUser?.username) params.append('username', activeUser.username);
    } else if (isSource) {
      params.append('role', 'lab');
      if (activeUser?.donVi) params.append('source', activeUser.donVi);
      if (activeUser?.fullName) params.append('source', activeUser.fullName);
      if (activeUser?.username) params.append('username', activeUser.username);
    }
    return params.toString();
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!activeUser) return;
    try {
      let url = getApiUrl('/notifications');
      const qs = getNotificationParams();
      if (qs) url += `?${qs}`;

      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const incomingList: NotificationItem[] = data.notifications || [];
        setNotifications(incomingList);
        setUnreadCount(data.unreadCount || 0);

        if (isInitialFetchRef.current) {
          // Lần đầu tải trang: ghi nhớ ID các thông báo hiện có để không bắn spam hàng loạt
          seenNotiIdsRef.current = new Set(incomingList.map((n) => n._id));
          isInitialFetchRef.current = false;
        } else {
          // Các lần quét tự động tiếp theo: tìm những thông báo mới xuất hiện chưa đọc
          const newItems = incomingList.filter(
            (n) => !seenNotiIdsRef.current.has(n._id) && !n.isRead
          );

          if (newItems.length > 0) {
            // 1. Phát âm thanh chuông báo
            playNotificationSound();

            // 2. Hiển thị thanh thông báo trên góc màn hình có vạch thời gian chạy countdown và tự ẩn (Toast)
            newItems.slice(0, 3).forEach((item) => {
              toast.notification(item.message, item.title, {
                duration: 6000,
                actionUrl: item.testResultId ? `/results/${item.testResultId}` : undefined,
                actionLabel: 'Xem phiếu xét nghiệm',
              });
            });

            // 3. Bắn banner thông báo trực tiếp ra màn hình máy tính Windows (Desktop Notification)
            newItems.slice(0, 3).forEach((item) => {
              sendDesktopNotification(item.title, item.message, item.testResultId);
            });

            // Đưa các ID mới vào Set đã duyệt
            incomingList.forEach((n) => seenNotiIdsRef.current.add(n._id));
          }
        }
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
    <>
      {/* Banner nhắc bật thông báo màn hình máy tính nếu chưa cấp quyền (permission === 'default') */}
      {desktopPermission === 'default' && (
        <div className="bg-gradient-to-r from-[#0070f3] to-blue-700 text-white px-5 py-2.5 text-xs flex items-center justify-between shadow-md z-30 shrink-0 select-none animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4 animate-bounce text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold mr-1.5 uppercase tracking-wide">Bật thông báo màn hình máy tính:</span>
              <span className="text-blue-100">
                Nhận chuông và tin báo trực tiếp ngoài màn hình Windows khi có ca xét nghiệm mới hoặc kết quả được ký duyệt.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              onClick={requestDesktopPermission}
              className="px-3.5 py-1.5 bg-white text-[#0070f3] hover:bg-blue-50 font-bold rounded-lg shadow-sm transition-all cursor-pointer text-xs flex items-center gap-1.5"
            >
              <span>Cho phép ngay</span>
              <span>🔔</span>
            </button>
            <button
              onClick={() => setDesktopPermission('dismissed')}
              className="px-2.5 py-1.5 text-blue-200 hover:text-white text-xs hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Để sau"
            >
              Để sau
            </button>
          </div>
        </div>
      )}

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

              {/* Desktop Notification Banner */}
              {desktopPermission === 'denied' ? (
                <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-bold">
                    <span>⚠️ Trình duyệt đang chặn thông báo máy tính</span>
                  </div>
                  <p className="text-[10px] text-amber-700 leading-tight">
                    Để nhận thông báo ngoài màn hình: Nhấn vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ URL &gt; Chọn <b>Cho phép</b> (Allow) ở mục Thông báo.
                  </p>
                </div>
              ) : desktopPermission !== 'granted' ? (
                <div className="px-3 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <BellRing className="w-3.5 h-3.5 text-[#0070f3] shrink-0 animate-bounce" />
                    <span className="text-[11px] text-slate-700 font-medium truncate">
                      Bật thông báo màn hình máy tính
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleTestNotification}
                      className="px-2 py-1 text-slate-600 hover:text-[#0070f3] text-[10px] font-semibold transition-all cursor-pointer"
                      title="Thử chuông và thông báo"
                    >
                      Thử 🔔
                    </button>
                    <button
                      onClick={requestDesktopPermission}
                      className="px-2.5 py-1 bg-[#0070f3] hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Bật ngay
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between text-[10px] text-emerald-800 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>Đã bật thông báo màn hình máy tính</span>
                  </span>
                  <button
                    onClick={handleTestNotification}
                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[10px] transition-colors cursor-pointer shrink-0"
                    title="Bắn thử thông báo ra màn hình máy tính Windows"
                  >
                    Bắn thử máy tính 🔔
                  </button>
                </div>
              )}

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

        {/* 1.5 SETTINGS BUTTON WITH FLOATING DROPDOWN (CHỈ DÀNH CHO SUPERADMIN) */}
        {isSuperAdmin && (
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
                    href="/settings/accounts"
                    onClick={() => setSettingsOpen(false)}
                    className="block px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors border-b border-slate-100"
                  >
                    Quản lý Tài khoản (Auth)
                  </Link>
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
                {currentUser?.fullName || (isSuperAdmin ? 'Super Administrator' : isAdmin ? 'Admin phòng Lab' : 'Người dùng')}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                {isSuperAdmin
                  ? 'Super Admin'
                  : isAdmin
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
  </>
  );
}
