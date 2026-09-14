'use client';

import React from 'react';
import { Eye, Download, X } from 'lucide-react';

interface PdfPreviewSectionProps {
  caseId: string;
  onClose: () => void;
  onDownload: () => void;
}

export default function PdfPreviewSection({
  caseId,
  onClose,
  onDownload,
}: PdfPreviewSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden space-y-0 mt-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="p-4 px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
          <Eye className="w-5 h-5 text-sky-600" />
          <span>Xem trước PDF kết quả</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0070f3] hover:bg-[#005bb5] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải PDF</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Đóng</span>
          </button>
        </div>
      </div>

      {/* PDF Iframe Viewer */}
      <div className="w-full h-[750px] bg-slate-100 relative">
        <iframe
          src={`http://localhost:5002/api/cases/${caseId}/export-pdf`}
          className="w-full h-full border-0"
          title="Xem trước kết quả PDF"
        />
      </div>
    </div>
  );
}
