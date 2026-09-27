'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export default function UnsavedChangesModal({
  isOpen,
  onStay,
  onLeave,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onStay}
    >
      <div
        className="w-full max-w-[420px] bg-white rounded-[24px] shadow-2xl border border-slate-100 p-6 relative overflow-hidden animate-in zoom-in-95 duration-200 text-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon Pill */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
          Bạn có thay đổi chưa lưu!
        </h3>
        <p className="text-xs text-slate-600 font-medium mb-6 leading-relaxed">
          Bạn đang chỉnh sửa phiếu xét nghiệm mà chưa bấm <strong className="text-red-600">"Lưu thay đổi"</strong>. 
          Nếu rời khỏi trang lúc này, các thông tin hoặc ảnh vừa thay đổi sẽ bị mất. 
          <br />
          <span className="text-slate-800 font-bold block mt-1.5">
            Bạn có chắc chắn muốn rời khỏi trang mà không lưu?
          </span>
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onStay}
            className="py-2.5 px-4 rounded-xl bg-[#0070f3] hover:bg-[#005bb5] active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            Ở lại lưu thay đổi
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-600 font-bold text-xs transition-all cursor-pointer"
          >
            Rời trang không lưu
          </button>
        </div>
      </div>
    </div>
  );
}
