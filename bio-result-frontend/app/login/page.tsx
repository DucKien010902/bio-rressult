'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleQuickSelect = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('http://localhost:5002/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim(),
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

        // Chuyển hướng tới trang chính / dashboard
        router.push('/');
        router.refresh();
      } catch (err: any) {
        setError(
          err.message ||
            'Không thể kết nối đến máy chủ Backend (cổng 5002). Hãy kiểm tra Backend!'
        );
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f1f5f9]">
      <div className="w-full max-w-[440px] bg-white rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 p-8 sm:p-10 transition-all">
        {/* Header: Logo & Titles */}
        <div className="flex flex-col items-center justify-center mb-7 text-center">
          <div className="flex items-center justify-center mb-3">
            <Image
              src="/logo_gentech.png"
              alt="Logo Gentech"
              width={100}
              height={100}
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#003399] focus:ring-2 focus:ring-blue-100 transition-all font-medium"
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
                className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#003399] focus:ring-2 focus:ring-blue-100 transition-all font-medium tracking-wide"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
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
            className="w-full py-3.5 px-4 mt-2 rounded-xl bg-[#0070f3] hover:bg-[#005bb5] text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
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

        {/* Quick Demo Accounts Selection */}
        <div className="mt-7 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => setShowQuickLogin(!showQuickLogin)}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Tài khoản thử nghiệm phân quyền</span>
            {showQuickLogin ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showQuickLogin && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-left animate-in fade-in slide-in-from-top-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('admin_lab', '210577')}
                className="p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/70 transition-all text-xs"
              >
                <div className="font-bold text-blue-900">👑 Admin Lab</div>
                <div className="text-[11px] text-blue-600">admin_lab / 210577</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('bacsi_hùng', '210577')}
                className="p-2.5 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/70 transition-all text-xs"
              >
                <div className="font-bold text-purple-900">🩺 Bác Sĩ Hùng</div>
                <div className="text-[11px] text-purple-600">bacsi_hùng / 210577</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('bv_đhqg', '123456')}
                className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/70 transition-all text-xs"
              >
                <div className="font-bold text-emerald-900">🏥 BV ĐHQG</div>
                <div className="text-[11px] text-emerald-600">bv_đhqg / 123456</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('ninhbinh', '123456')}
                className="p-2.5 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100/70 transition-all text-xs"
              >
                <div className="font-bold text-amber-900">🏥 BV Ninh Bình</div>
                <div className="text-[11px] text-amber-600">ninhbinh / 123456</div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
