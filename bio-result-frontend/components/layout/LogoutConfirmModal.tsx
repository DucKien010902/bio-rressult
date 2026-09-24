'use client';

import React from 'react';
import { LogOut } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] bg-white rounded-[24px] shadow-2xl border border-slate-100 p-6 relative overflow-hidden animate-in zoom-in-95 duration-200 text-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon Pill */}
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <LogOut className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1.5">
          Xác nhận đăng xuất?
        </h3>
        <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
          Bạn có chắc chắn muốn thoát khỏi phiên làm việc hiện tại trên hệ thống GenTech?
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 active:scale-[0.99] transition-all cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
