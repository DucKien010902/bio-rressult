'use client';

import React from 'react';
import { Eye, Download, X } from 'lucide-react';

import { getApiUrl } from '@/lib/config';

interface PdfPreviewSectionProps {
  caseId: string;
  patientName?: string;
  onClose?: () => void;
  onDownload?: () => void;
}

export default function PdfPreviewSection({
  caseId,
  patientName = '',
  onClose,
  onDownload,
}: PdfPreviewSectionProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <h3 className="text-sm font-bold text-slate-800">
            Xem trước phiếu kết quả PDF {patientName ? `: ${patientName}` : ''}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={
              onDownload ||
              (() => {
                window.open(
                  getApiUrl(`/cases/${caseId}/export-pdf`),
                  '_blank'
                );
              })
            }
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải PDF về máy</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Đóng</span>
            </button>
          )}
        </div>
      </div>

      {/* PDF Iframe Viewer */}
      <div className="w-full h-[750px] bg-slate-100 relative">
        <iframe
          src={getApiUrl(`/cases/${caseId}/export-pdf`)}
          className="w-full h-full border-0"
          title="Xem trước kết quả PDF"
        />
      </div>
    </div>
  );
}
