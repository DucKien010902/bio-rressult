import React from 'react';
import {
  CheckCircle2,
  Eye,
  Download,
  Send,
  RotateCcw,
  Loader2,
  FlaskConical,
  Clock,
} from 'lucide-react';

interface ResultStickyBarProps {
  caseData: any;
  onDownloadPdf: () => void;
  currentUser?: any;
  onReleaseResult?: () => void;
  onPreviewPdf?: () => void;
  isReleasing?: boolean;
  isDownloading?: boolean;
}

export default function ResultStickyBar({
  caseData,
  onDownloadPdf,
  currentUser,
  onReleaseResult,
  onPreviewPdf,
  isReleasing = false,
  isDownloading = false,
}: ResultStickyBarProps) {
  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.username === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin' || isSuperAdmin;
  const isCombo = caseData?.loaiXetNghiem?.startsWith('combo_');
  const isSigned = isCombo
    ? !!(caseData?.daKy && caseData?.daKy2)
    : !!caseData?.daKy;

  return (
    <div className="sticky bottom-4 z-40 w-full">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Status badges */}
        <div className="flex items-center gap-3 text-xs sm:text-sm">
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
            {caseData?.trangThai === 'da_tra_ket_qua' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã trả kết quả</span>
              </>
            ) : caseData?.trangThai === 'chay_ket_qua' ? (
              <>
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Chạy kết quả</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>Nhập thông tin</span>
              </>
            )}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isSigned
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSigned ? 'Đã ký duyệt' : 'Chưa ký'}</span>
          </span>
        </div>

        {/* Right: Quick actions (Gắn nút Xác nhận Trả KQ cùng thanh với Tải xuống PDF) */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Nút Xác nhận Trả kết quả (Chỉ dành cho Admin, sau khi BS đã ký) */}
          {isAdmin && (
            <button
              type="button"
              onClick={onReleaseResult}
              disabled={isReleasing}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95 ${
                caseData?.trangThai === 'da_tra_ket_qua'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  : 'bg-[#10b981] hover:bg-[#059669] text-white shadow-emerald-500/20 ring-1 ring-emerald-400'
              }`}
            >
              {isReleasing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : caseData?.trangThai === 'da_tra_ket_qua' ? (
                <RotateCcw className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>
                {caseData?.trangThai === 'da_tra_ket_qua'
                  ? 'Hủy trả kết quả'
                  : 'Xác nhận Trả kết quả'}
              </span>
            </button>
          )}

          {/* Nút Xem lại PDF */}
          {onPreviewPdf && (
            <button
              type="button"
              onClick={onPreviewPdf}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-sky-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Eye className="w-4 h-4 text-sky-600" />
              <span>Xem lại PDF</span>
            </button>
          )}

          {/* Nút Tải xuống PDF */}
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#0070f3] hover:bg-[#005bb5] text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md disabled:opacity-60"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isDownloading ? 'Đang tải PDF...' : 'Tải xuống PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
