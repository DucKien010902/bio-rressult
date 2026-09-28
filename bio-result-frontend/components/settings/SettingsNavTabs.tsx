'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface SettingsNavTabsProps {
  activeTab: 'deadline' | 'doctors' | 'sources';
  extraActions?: React.ReactNode;
}

export default function SettingsNavTabs({ activeTab, extraActions }: SettingsNavTabsProps) {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0070f3] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại danh sách phiếu</span>
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Cài đặt hệ thống
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Quản lý thời hạn trả kết quả, danh sách bác sĩ ký duyệt và các nguồn / đơn vị gửi mẫu
          </p>
        </div>

        {extraActions && (
          <div className="flex items-center gap-3 self-start sm:self-center">
            {extraActions}
          </div>
        )}
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-xs overflow-x-auto">
        <Link
          href="/settings/deadline"
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
            activeTab === 'deadline'
              ? 'bg-[#0070f3] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Thời gian trả kết quả
        </Link>

        <Link
          href="/settings/doctors"
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
            activeTab === 'doctors'
              ? 'bg-[#0070f3] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Quản lý Bác sĩ
        </Link>

        <Link
          href="/settings/sources"
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer whitespace-nowrap ${
            activeTab === 'sources'
              ? 'bg-[#0070f3] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Quản lý Nguồn / Đơn vị
        </Link>
      </div>
    </div>
  );
}
