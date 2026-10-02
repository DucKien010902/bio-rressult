'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Layers,
  Activity,
  FlaskConical,
  Sparkles,
  TestTube,
  TestTube2,
  Microscope,
  Stethoscope,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

interface CategoryStat {
  key: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  icon: string;
}

interface DoctorStat {
  doctorName: string;
  total: number;
  daHoanTat: number;
  dangXuLy: number;
}

interface StatsData {
  kpi: {
    total: number;
    nhapThongTin: number;
    chayKetQua: number;
    daTraKetQua: number;
  };
  byCategory: CategoryStat[];
  byDoctor: DoctorStat[];
  doctorView?: {
    isDoctor: boolean;
    doctorName: string;
  } | null;
}

import { getApiUrl, getAuthHeaders } from '@/lib/config';

interface DashboardViewProps {
  currentUser?: any;
  onSelectCategory?: (catId: string, filterDoctor?: string) => void;
}

export default function DashboardView({
  currentUser,
  onSelectCategory,
}: DashboardViewProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const isDoctor = currentUser?.role === 'doctor' || currentUser?.role === 'bacsy';
  const doctorName = currentUser?.fullName || '';

  const fetchStats = async () => {
    setLoading(true);
    try {
      let url = getApiUrl('/cases/stats');
      const params = new URLSearchParams();

      if (isDoctor) {
        params.append('doctor', currentUser?.username || doctorName);
      } else if (currentUser?.role === 'lab' && currentUser?.donVi) {
        params.append('donVi', currentUser.donVi);
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const res = await fetch(url, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Lỗi khi tải thống kê:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentUser]);

  // --- Tất cả hooks phải được gọi ở đây, trước mọi early return ---
  const rawByCategory = stats?.byCategory || [];
  const isSpecialRole =
    currentUser?.role === 'doctor' ||
    currentUser?.role === 'bacsy' ||
    currentUser?.role === 'lab';
  const byCategory = React.useMemo(() => {
    if (!isSpecialRole) return rawByCategory;
    const allowed = Array.isArray(currentUser?.allowedCategories)
      ? currentUser.allowedCategories
      : [];
    if (allowed.length === 0) return rawByCategory;
    return rawByCategory.filter((cat) => allowed.includes(cat.key));
  }, [rawByCategory, isSpecialRole, currentUser]);
  // --- Kết thúc vùng hooks ---

  const getServiceIcon = (key: string, className = 'w-4 h-4') => {
    switch (key) {
      case 'cell':
        return <Activity className={className} />;
      case 'thinprep':
        return <FlaskConical className={className} />;
      case 'hpv40':
        return <Sparkles className={className} />;
      case 'hpv20':
        return <TestTube className={className} />;
      case 'hpv23':
      case 'hpv24':
        return <TestTube2 className={className} />;
      case 'soituoi':
        return <Microscope className={className} />;
      case 'giaiphaubenh':
      case 'giaiphaubenh_mobenh':
      case 'giaiphaubenh_tebaohoc':
        return <FileText className={className} />;
      default:
        return <Layers className={className} />;
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0070f3]" />
        <span className="text-xs font-semibold">Đang tổng hợp dữ liệu báo cáo & thống kê...</span>
      </div>
    );
  }

  const kpi = stats?.kpi || {
    total: 0,
    nhapThongTin: 0,
    chayKetQua: 0,
    daTraKetQua: 0,
  };

  const byDoctor = stats?.byDoctor || [];

  // Helper: Calculate smart Y-axis max scale dynamically based on current data magnitude
  const getSmartMaxScale = (rawMax: number, defaultMin = 10): number => {
    if (!rawMax || rawMax <= 0) return defaultMin;
    if (rawMax <= 4) return 4;
    if (rawMax <= 8) return 8;
    if (rawMax <= 10) return 10;

    const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const normalized = rawMax / magnitude;

    let multiplier = 10;
    if (normalized <= 1) multiplier = 1;
    else if (normalized <= 1.25) multiplier = 1.5;
    else if (normalized <= 2) multiplier = 2;
    else if (normalized <= 2.5) multiplier = 2.5;
    else if (normalized <= 4) multiplier = 4;
    else if (normalized <= 5) multiplier = 5;

    return Math.max(Math.ceil(multiplier * magnitude), defaultMin);
  };

  // Dynamic Max scale for Service Bar Chart
  const maxRawCategory = Math.max(...byCategory.map((c) => c.count), 0);
  const maxCategoryCount = getSmartMaxScale(maxRawCategory, 10);

  // Dynamic Max scale for Doctor Bar Chart (top 5)
  const topDoctors = byDoctor.slice(0, 5);
  const maxDoctorRaw = Math.max(...topDoctors.map((d) => d.total), 0);
  const maxDoctorTotal = getSmartMaxScale(maxDoctorRaw, 10);

  // SVG Donut Slices Calculation
  let cumulativePercent = 0;
  const donutSlices = byCategory.map((cat) => {
    const start = cumulativePercent;
    cumulativePercent += cat.percentage;
    return {
      ...cat,
      startPercent: start,
      endPercent: cumulativePercent,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isDoctor ? `Thống kê phiếu của Bác sĩ: ${doctorName}` : 'Thống kê & Báo cáo hệ thống'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {isDoctor
              ? `Tổng quan cá nhân chỉ số phiếu xét nghiệm được phân công cho ${doctorName}`
              : 'Tổng quan chỉ số hoạt động xét nghiệm tế bào & HPV GENHD'}
          </p>
        </div>
      </div>

      {/* 2. DOCTOR BANNER (If Doctor View) */}
      {isDoctor && (
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center gap-3 text-sm text-[#003399] font-medium animate-in fade-in">
          <div className="w-8 h-8 rounded-xl bg-blue-100/80 flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4 text-[#003399]" />
          </div>
          <span>
            <strong>Chế độ xem Bác sĩ:</strong> Dữ liệu bên dưới đã tự động lọc duy nhất cho{' '}
            <strong>{doctorName}</strong>
          </span>
        </div>
      )}

      {/* 3. TOP 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cases */}
        <div className="bg-white rounded-2xl p-5 border border-rose-100/70 shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">
              TỔNG SỐ PHIẾU XÉT NGHIỆM
            </div>
            <div className="text-3xl font-extrabold text-rose-600 tracking-tight">
              {kpi.total.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Tất cả phân loại</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Status: Nhập thông tin */}
        <div className="bg-white rounded-2xl p-5 border border-amber-100/70 shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
              NHẬP THÔNG TIN
            </div>
            <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
              {kpi.nhapThongTin.toLocaleString()}
            </div>
            <div className="text-[11px] text-amber-500/80 font-medium">
              Chờ nhận mẫu & xử lý
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Status: Đang chạy kết quả */}
        <div className="bg-white rounded-2xl p-5 border border-blue-100/70 shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">
              ĐANG CHẠY KẾT QUẢ
            </div>
            <div className="text-3xl font-extrabold text-blue-600 tracking-tight">
              {kpi.chayKetQua.toLocaleString()}
            </div>
            <div className="text-[11px] text-blue-400 font-medium">
              Đang đọc mẫu & hoàn thiện
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Status: Đã trả kết quả */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100/70 shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              ĐÃ TRẢ KẾT QUẢ
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              {kpi.daTraKetQua.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-500 font-medium">
              Phiếu đã ký & hoàn tất
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. CHI TIẾT SỐ PHIẾU THEO GÓI DỊCH VỤ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
          <Layers className="w-4 h-4 text-[#0070f3]" />
          <span>CHI TIẾT SỐ PHIẾU THEO GÓI DỊCH VỤ</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {byCategory.map((cat) => {
            const isSelected = selectedService === cat.key;
            return (
              <div
                key={cat.key}
                onClick={() => {
                  setSelectedService(cat.key);
                  if (onSelectCategory) {
                    onSelectCategory(cat.key);
                  }
                }}
                className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#0070f3] shadow-md ring-2 ring-blue-100'
                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                    {cat.label}
                  </span>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    {getServiceIcon(cat.key, 'w-3.5 h-3.5')}
                  </div>
                </div>

                <div>
                  <div className="text-xl font-extrabold text-slate-800 tracking-tight">
                    {cat.count}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {cat.percentage}% tổng số
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. CHARTS ROW: DONUT CHART + BAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Donut Chart - Tỷ lệ phân bổ dịch vụ */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0070f3]" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">Tỷ lệ phân bổ dịch vụ</h2>
              <p className="text-[11px] text-slate-400">Tỷ lệ % từng loại xét nghiệm trong hệ thống</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center pt-2">
            {/* SVG Donut */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {donutSlices.map((slice, i) => {
                  const strokeDash = `${slice.percentage} ${100 - slice.percentage}`;
                  const strokeOffset = -slice.startPercent;
                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="35"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth="14"
                      strokeDasharray={strokeDash}
                      strokeDashoffset={strokeOffset}
                      className="transition-all hover:stroke-width-16 cursor-pointer"
                    />
                  );
                })}
              </svg>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-800">{kpi.total}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Tổng Phiếu
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-6 w-full max-w-md pt-4 border-t border-slate-100 text-xs">
              {byCategory.map((cat) => (
                <div
                  key={cat.key}
                  onClick={() => onSelectCategory && onSelectCategory(cat.key)}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-semibold text-slate-700">{cat.label}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {cat.count}{' '}
                    <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Bar Chart - Biểu đồ so sánh số lượng phiếu */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10b981]" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">Biểu đồ so sánh số lượng phiếu</h2>
              <p className="text-[11px] text-slate-400">Số phiếu ghi nhận theo từng loại xét nghiệm</p>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="flex-1 flex flex-col justify-end pt-6">
            <div className="relative h-56 flex items-end justify-between px-2 pb-6 border-b border-slate-200">
              {/* Y-axis grid marks */}
              <div className="absolute inset-x-0 bottom-6 h-[180px] flex flex-col justify-between pointer-events-none text-[10px] text-slate-400">
                <div className="border-b border-dashed border-slate-200 flex justify-between items-center relative -top-2">
                  <span className="bg-white/90 px-1 rounded text-slate-600 font-bold">{maxCategoryCount}</span>
                </div>
                <div className="border-b border-dashed border-slate-200 flex justify-between items-center relative -top-2">
                  <span className="bg-white/90 px-1 rounded text-slate-400">{Math.round(maxCategoryCount * 0.75)}</span>
                </div>
                <div className="border-b border-dashed border-slate-200 flex justify-between items-center relative -top-2">
                  <span className="bg-white/90 px-1 rounded text-slate-400">{Math.round(maxCategoryCount * 0.5)}</span>
                </div>
                <div className="border-b border-dashed border-slate-200 flex justify-between items-center relative -top-2">
                  <span className="bg-white/90 px-1 rounded text-slate-400">{Math.round(maxCategoryCount * 0.25)}</span>
                </div>
                <div className="flex justify-between items-center relative -top-2">
                  <span className="bg-white/90 px-1 rounded text-slate-400">0</span>
                </div>
              </div>

              {/* Columns */}
              <div className="w-full flex items-end justify-around z-10">
                {byCategory.map((cat) => {
                  const barHeight = Math.max(
                    (cat.count / maxCategoryCount) * 180,
                    cat.count > 0 ? 8 : 2
                  );
                  return (
                    <div
                      key={cat.key}
                      onClick={() => onSelectCategory && onSelectCategory(cat.key)}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <span className="text-[11px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        {cat.count}
                      </span>
                      <div
                        className="w-8 sm:w-10 rounded-t-md transition-all group-hover:brightness-95 shadow-2xs"
                        style={{
                          height: `${barHeight}px`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-around pt-2 text-[11px] font-bold text-slate-600">
              {byCategory.map((cat) => (
                <div key={cat.key} className="text-center truncate max-w-[50px] sm:max-w-none">
                  {cat.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6. SECTION: THỐNG KÊ TIẾN ĐỘ THEO BÁC SĨ ĐỌC KẾT QUẢ (Admin View) */}
      {!isDoctor && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Thống kê tiến độ theo Bác sĩ đọc kết quả
                </h2>
                <p className="text-[11px] text-slate-500">
                  Theo dõi chi tiết số phiếu Đã hoàn tất & Đang xử lý
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Grouped Bar Chart (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full">
              <div className="relative h-60 flex items-end justify-around px-2 pb-6 border-b border-slate-200">
                {/* Y-axis background marks */}
                <div className="absolute inset-x-0 bottom-6 h-[190px] flex flex-col justify-between pointer-events-none text-[10px] text-slate-400">
                  <div className="border-b border-dashed border-slate-200 flex justify-between items-center relative -top-2">
                    <span className="bg-white/90 px-1 rounded text-slate-600 font-bold">{maxDoctorTotal}</span>
                  </div>
                  <div className="border-b border-dashed border-slate-200 flex justify-between items-center relative -top-2">
                    <span className="bg-white/90 px-1 rounded text-slate-400">{Math.round(maxDoctorTotal * 0.75)}</span>
                  </div>
                  <div className="border-b border-dashed border-slate-200 flex justify-between items-center relative -top-2">
                    <span className="bg-white/90 px-1 rounded text-slate-400">{Math.round(maxDoctorTotal * 0.5)}</span>
                  </div>
                  <div className="border-b border-dashed border-slate-200 flex justify-between items-center relative -top-2">
                    <span className="bg-white/90 px-1 rounded text-slate-400">{Math.round(maxDoctorTotal * 0.25)}</span>
                  </div>
                  <div className="flex justify-between items-center relative -top-2">
                    <span className="bg-white/90 px-1 rounded text-slate-400">0</span>
                  </div>
                </div>

                {/* Grouped Bars */}
                <div className="w-full flex items-end justify-around z-10">
                  {topDoctors.map((doc, idx) => {
                    const hDangXuLy = Math.max(
                      (doc.dangXuLy / maxDoctorTotal) * 190,
                      doc.dangXuLy > 0 ? 6 : 2
                    );
                    const hDaHoanTat = Math.max(
                      (doc.daHoanTat / maxDoctorTotal) * 190,
                      doc.daHoanTat > 0 ? 6 : 2
                    );

                    return (
                      <div key={idx} className="flex flex-col items-center gap-1.5 group cursor-pointer">
                        <div className="flex items-end gap-1.5">
                          {/* Đang xử lý */}
                          <div
                            className="w-4 sm:w-5 bg-[#0284c7] rounded-t-sm transition-all group-hover:brightness-95"
                            style={{ height: `${hDangXuLy}px` }}
                            title={`Đang xử lý: ${doc.dangXuLy}`}
                          />
                          {/* Đã hoàn tất */}
                          <div
                            className="w-4 sm:w-5 bg-[#10b981] rounded-t-sm transition-all group-hover:brightness-95"
                            style={{ height: `${hDaHoanTat}px` }}
                            title={`Đã hoàn tất: ${doc.daHoanTat}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend for Doctor Chart */}
              <div className="flex items-center justify-center gap-6 pt-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#0284c7] rounded-xs" />
                  <span className="font-semibold text-slate-600">Đang xử lý</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#10b981] rounded-xs" />
                  <span className="font-semibold text-slate-600">Đã hoàn tất</span>
                </div>
              </div>
            </div>

            {/* Right: Table of Doctors (7 cols) */}
            <div className="lg:col-span-7 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">BÁC SĨ ĐỌC KẾT QUẢ</th>
                    <th className="pb-3 font-semibold text-center">TỔNG</th>
                    <th className="pb-3 font-semibold text-center">ĐÃ HOÀN TẤT</th>
                    <th className="pb-3 font-semibold text-center">ĐANG XỬ LÝ</th>
                    <th className="pb-3 font-semibold text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {byDoctor.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pr-2 font-bold text-slate-800 flex items-center gap-2">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate max-w-[200px]" title={doc.doctorName}>
                          {doc.doctorName}
                        </span>
                      </td>
                      <td className="py-3.5 text-center font-extrabold text-slate-800">
                        {doc.total}
                      </td>
                      <td className="py-3.5 text-center font-bold text-emerald-600">
                        {doc.daHoanTat}
                      </td>
                      <td className="py-3.5 text-center font-bold text-blue-600">
                        {doc.dangXuLy}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => {
                            if (onSelectCategory) {
                              onSelectCategory('hpv40', doc.doctorName);
                            }
                          }}
                          className="text-[#0070f3] hover:text-[#005bb5] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer group"
                        >
                          <span>Xem phiếu</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
