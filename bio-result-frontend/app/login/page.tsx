'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, Loader2, AlertCircle, X, Shield, Stethoscope, Building2 } from 'lucide-react';

import { getApiUrl } from '@/lib/config';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showQuickLoginModal, setShowQuickLoginModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleQuickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    setShowQuickLoginModal(false);

    startTransition(async () => {
      try {
        const res = await fetch(getApiUrl('/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.trim(),
            password: pass.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message || 'Tài khoản hoặc mật khẩu không chính xác!'
          );
        }

        // Lưu token & thông tin người dùng
        localStorage.setItem('bio_token', data.accessToken);
        localStorage.setItem('bio_user', JSON.stringify(data.user));

        // Chuyển hướng tới trang chính
        router.push('/');
        router.refresh();
      } catch (err: any) {
        setError(
          err.message ||
            'Không thể kết nối đến máy chủ Backend. Hãy kiểm tra Backend!'
        );
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu!');
      return;
    }
    handleQuickLogin(username, password);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 py-8 bg-[#f1f5f9] relative">
      {/* CARD ĐĂNG NHẬP CHÍNH */}
      <div className="w-full max-w-[480px] bg-white rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 p-7 sm:p-8 transition-all">
        {/* Header: Logo & Titles */}
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <div className="flex items-center justify-center mb-2.5">
            <Image
              src="/logo_gentech.png"
              alt="Logo Gentech"
              width={85}
              height={85}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-black text-[#003399] tracking-tight">
            GENTECH
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Hệ thống Quản lý Kết quả Xét nghiệm GenTech
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập..."
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#003399] focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#003399] focus:ring-2 focus:ring-blue-100 transition-all font-medium tracking-wide"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 mt-2 rounded-xl bg-[#0070f3] hover:bg-[#005bb5] text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </button>
        </form>

        {/* Nút kích hoạt Modal Tài khoản mẫu */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowQuickLoginModal(true)}
            className="w-full py-2.5 px-3.5 rounded-xl border border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/70 hover:bg-blue-100/70 text-[#0070f3] font-bold text-[13px] transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <span>⚡ Tài khoản mẫu thử nghiệm</span>
              <span className="text-[11px] bg-[#0070f3] text-white px-2 py-0.5 rounded-full font-bold">8 TK</span>
            </div>
            <span className="text-xs text-blue-600 font-semibold group-hover:underline flex items-center gap-1">
              Mở danh sách &rarr;
            </span>
          </button>
        </div>
      </div>

      {/* MODAL XEM TÀI KHOẢN MẪU (RỘNG ĐÚNG BẰNG CARD ĐĂNG NHẬP) */}
      {showQuickLoginModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowQuickLoginModal(false)}
        >
          <div
            className="w-full max-w-[480px] bg-white rounded-[26px] shadow-2xl border border-slate-100 p-6 sm:p-7 relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>⚡ TÀI KHOẢN MẪU THỬ NGHIỆM</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Bấm vào bất kỳ tài khoản nào để đăng nhập tức thì
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickLoginModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="py-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
              {/* Nhóm 1: Admin */}
              <div>
                <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Quản trị phòng Lab (Toàn quyền):</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin_lab', '210577')}
                  className="w-full p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-blue-900 text-xs sm:text-sm">Admin phòng Lab</div>
                    <div className="text-[11px] text-blue-600 mt-0.5">user: admin_lab &bull; pass: 210577</div>
                  </div>
                  <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity font-bold">Vào ngay &rarr;</span>
                </button>
              </div>

              {/* Nhóm 2: Bác sĩ */}
              <div>
                <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                  <span>Bác sĩ đọc kết quả (Chỉ xem ca của mình):</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('bacsi_hùng', '210577')}
                    className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 transition-all text-left cursor-pointer"
                  >
                    <div className="font-bold text-purple-900 text-xs truncate">BS PHẠM THẾ HÙNG</div>
                    <div className="text-[11px] text-purple-600 mt-0.5">bacsi_hùng / 210577</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('bacsi_đương', '123456')}
                    className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 transition-all text-left cursor-pointer"
                  >
                    <div className="font-bold text-purple-900 text-xs truncate">BS Nguyễn Khánh Dương</div>
                    <div className="text-[11px] text-purple-600 mt-0.5">bacsi_đương / 123456</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('bacsi_trực', '123456')}
                    className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 transition-all text-left cursor-pointer"
                  >
                    <div className="font-bold text-purple-900 text-xs truncate">BS Nguyễn Trung Trực</div>
                    <div className="text-[11px] text-purple-600 mt-0.5">bacsi_trực / 123456</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('bacsi_son', '123456')}
                    className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100 transition-all text-left cursor-pointer"
                  >
                    <div className="font-bold text-purple-900 text-xs truncate">BS Trịnh Ngọc Sơn</div>
                    <div className="text-[11px] text-purple-600 mt-0.5">bacsi_son / 123456</div>
                  </button>
                </div>
              </div>

              {/* Nhóm 3: Đơn vị gửi mẫu */}
              <div>
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đơn vị gửi mẫu (Chỉ xem ca đơn vị mình):</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('bv_đhqg', '123456')}
                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 transition-all text-left cursor-pointer"
                  >
                    <div className="font-bold text-emerald-900 text-xs truncate">BV ĐHQG</div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">bv_đhqg</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('ninhbinh', '123456')}
                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 transition-all text-left cursor-pointer"
                  >
                    <div className="font-bold text-emerald-900 text-xs truncate">Ninh Bình</div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">ninhbinh</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('lab 24/7', '123456')}
                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 transition-all text-left cursor-pointer"
                  >
                    <div className="font-bold text-emerald-900 text-xs truncate">Lab 24/7</div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">lab 24/7</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

