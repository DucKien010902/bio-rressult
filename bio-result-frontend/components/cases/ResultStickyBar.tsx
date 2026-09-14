'use client';

import React from 'react';
import { CheckCircle2, Eye, Download } from 'lucide-react';

interface ResultStickyBarProps {
  caseData: any;
  onPreviewPdf: () => void;
  onDownloadPdf: () => void;
}

export default function ResultStickyBar({
  caseData,
  onPreviewPdf,
  onDownloadPdf,
}: ResultStickyBarProps) {
  return (
    <div className="sticky bottom-4 z-40 w-full">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Status badges */}
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold text-slate-500">Trạng thái phiếu:</span>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              caseData?.trangThai === 'da_tra_ket_qua'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : caseData?.trangThai === 'chay_ket_qua'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {caseData?.trangThai === 'da_tra_ket_qua'
                ? 'Đã trả kết quả'
                : caseData?.trangThai === 'chay_ket_qua'
                ? 'Chạy kết quả'
                : 'Nhập thông tin'}
            </span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              caseData?.daKy
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{caseData?.daKy ? 'Đã ký duyệt' : 'Chưa ký'}</span>
          </span>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPreviewPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Xem lại PDF</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0070f3] hover:bg-[#005bb5] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Tải xuống PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
