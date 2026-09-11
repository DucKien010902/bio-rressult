'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleQuickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('http://localhost:5002/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Đăng nhập thất bại');
        }

        localStorage.setItem('bio_token', data.accessToken);
        localStorage.setItem('bio_user', JSON.stringify(data.user));

        router.push('/');
      } catch (err: any) {
        setError(err.message || 'Không thể kết nối đến máy chủ Backend (cổng 5002)');
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800 font-sans">
      <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-2xl shadow-sm p-7 space-y-6">
        
        {/* Header Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500 text-white font-bold text-xl shadow-xs">
            🧬
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Hệ Thống Trả Kết Quả Sinh Học
            </h1>
            <p className="text-[11px] font-medium tracking-wide text-sky-600">
              BIO-RESULT PORTAL
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-600 mb-1.5">
              Tên tài khoản
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-600 mb-1.5">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs tracking-wide shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isPending ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>

        {/* Quick Test Role Selection */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-medium text-slate-400 text-center">
            Chọn tài khoản test nhanh (Mật khẩu: 123456):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', '123456')}
              className="px-2 py-1.5 text-[11px] font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('bacsy', '123456')}
              className="px-2 py-1.5 text-[11px] font-medium rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
            >
              🩺 Bác sĩ
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('lab', '123456')}
              className="px-2 py-1.5 text-[11px] font-medium rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors"
            >
              🔬 KTV Lab
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
