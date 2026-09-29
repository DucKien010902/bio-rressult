'use client';

import React, { useState } from 'react';
import { X, FileSpreadsheet, Calendar, Filter, Loader2, Download } from 'lucide-react';
import { downloadCasesExcel } from '@/lib/download';
import { toast } from '@/components/common/Toast';

export interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  doctorFilter?: string;
}

const CATEGORIES_OPTIONS = [
  { id: 'all', label: 'Tất cả dịch vụ' },
  { id: 'thinprep', label: 'Xét nghiệm ThinPrep' },
  { id: 'cell', label: 'Xét nghiệm Cell' },
  { id: 'hpv40', label: 'Xét nghiệm HPV 40 Types' },
  { id: 'hpv20', label: 'Xét nghiệm HPV 20 Types' },
  { id: 'hpv23', label: 'Xét nghiệm HPV 23 Types' },
  { id: 'hpv24', label: 'Xét nghiệm HPV 24 Types' },
  { id: 'soituoi', label: 'Xét nghiệm Soi tươi' },
  { id: 'giaiphaubenh', label: 'Giải Phẫu Bệnh' },
  { id: 'combo_hpv20_cell', label: 'Combo: HPV 20 + Cell' },
  { id: 'combo_hpv40_cell', label: 'Combo: HPV 40 + Cell' },
  { id: 'combo_hpv23_cell', label: 'Combo: HPV 23 + Cell' },
  { id: 'combo_hpv20_thinprep', label: 'Combo: HPV 20 + ThinPrep' },
  { id: 'combo_hpv40_thinprep', label: 'Combo: HPV 40 + ThinPrep' },
  { id: 'combo_hpv23_thinprep', label: 'Combo: HPV 23 + ThinPrep' },
];

export default function ExportExcelModal({
  isOpen,
  onClose,
  activeCategory,
  doctorFilter = '',
}: ExportExcelModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    activeCategory === 'dashboard' ? 'all' : activeCategory || 'all'
  );
  const [timeOption, setTimeOption] = useState<'all' | 'month'>('all');

  // Generate recent 12 months for month selector (YYYY-MM)
  const today = new Date();
  const monthOptions: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    monthOptions.push({
      value: `${yyyy}-${mm}`,
      label: `Tháng ${mm}/${yyyy}`,
    });
  }

  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0]?.value || '');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const monthParam = timeOption === 'all' ? 'all' : selectedMonth;
      await downloadCasesExcel({
        category: selectedCategory,
        month: monthParam,
        doctor: doctorFilter,
      });
      toast.success('Đã xuất file Excel danh sách ca thành công!', 'Xuất Excel');
      onClose();
    } catch (err: any) {
      console.error('Error exporting cases excel:', err);
      toast.error(err.message || 'Không thể tải file Excel!', 'Xuất file thất bại');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xuất danh sách ca xét nghiệm
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Tải file Excel (.xlsx) danh sách phiếu theo loại dịch vụ & thời gian
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* 1. Chọn loại dịch vụ (Category) */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-[#0070f3]" />
              <span>Loại dịch vụ xét nghiệm</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20"
            >
              {CATEGORIES_OPTIONS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Chọn Phạm vi thời gian */}
          <div className="space-y-3">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-[#0070f3]" />
              <span>Phạm vi thời gian</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTimeOption('all')}
                className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between ${
                  timeOption === 'all'
                    ? 'border-[#0070f3] bg-blue-50/60 text-[#0070f3] ring-1 ring-[#0070f3]'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span className="text-sm font-extrabold">Tất cả thời gian</span>
                <span className="text-[11px] font-medium text-slate-400 mt-1">
                  Xuất toàn bộ ca bệnh từ trước đến nay
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTimeOption('month')}
                className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer flex flex-col justify-between ${
                  timeOption === 'month'
                    ? 'border-[#0070f3] bg-blue-50/60 text-[#0070f3] ring-1 ring-[#0070f3]'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span className="text-sm font-extrabold">Theo tháng cụ thể</span>
                <span className="text-[11px] font-medium text-slate-400 mt-1">
                  Xuất danh sách ca của tháng được chọn
                </span>
              </button>
            </div>

            {/* Select Month Dropdown if 'month' option is active */}
            {timeOption === 'month' && (
              <div className="pt-2 animate-in fade-in">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/20"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {doctorFilter && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
              * Đang lọc theo bác sĩ phụ trách: <strong>{doctorFilter}</strong>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExporting ? 'Đang xuất Excel...' : 'Tải xuống file Excel'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
