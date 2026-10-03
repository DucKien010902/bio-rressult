'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Calendar,
  User as UserIcon,
  MoreVertical,
  Download,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  FlaskConical,
  FileText,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  History,
} from 'lucide-react';
import { toast } from '@/components/common/Toast';
import CaseHistoryModal from './CaseHistoryModal';

export interface CaseItem {
  _id: string;
  maSo: string;
  loaiXetNghiem: string;
  hoTen: string;
  namSinh: number;
  gioiTinh: string;
  soDienThoai: string;
  diaChi: string;
  loaiMau: string;
  donVi: string;
  bacSiChiDinh: string;
  chanDoanLamSang: string;
  nguoiNhap: string | { fullName: string; username: string };
  ngayNhanMau: string;
  ngayXetNghiem: string;
  ngayDuKienTra: string;
  ngayTraKetQua: string;
  bacSiDoc: string;
  bacSiDocUsername?: string;
  bacSiDocId?: string;
  bacSiDoc2?: string;
  bacSiDoc2Username?: string;
  bacSiDoc2Id?: string;
  daKy: boolean;
  daKy2?: boolean;
  trangThai: 'nhap_thong_tin' | 'chay_ket_qua' | 'da_tra_ket_qua';
  createdAt: string;
}

import { getApiUrl, getAuthHeaders } from '@/lib/config';
import { downloadCasePdf } from '@/lib/download';
import {
  fetchDoctorsList,
  type DoctorOption,
  DEFAULT_DOCTOR_LIST,
} from '@/lib/doctors';

export const CATEGORY_NAMES_MAP: Record<string, string> = {
  cell: 'Xét nghiệm Cell',
  thinprep: 'Xét nghiệm ThinPrep',
  hpv40: 'Xét nghiệm HPV 40',
  hpv20: 'Xét nghiệm HPV 20',
  hpv23: 'Xét nghiệm HPV 23',
  hpv24: 'Xét nghiệm HPV 24',
  soituoi: 'Xét nghiệm Soi tươi',
  giaiphaubenh: 'Giải Phẫu Bệnh',
  giaiphaubenh_mobenh: 'Giải Phẫu Bệnh - Mô Bệnh',
  giaiphaubenh_tebaohoc: 'Giải Phẫu Bệnh - Tế Bào Học',
  combo_hpv20_cell: 'Combo HPV 20 + Cell',
  combo_hpv40_cell: 'Combo HPV 40 + Cell',
  combo_hpv23_cell: 'Combo HPV 23 + Cell',
  combo_hpv20_thinprep: 'Combo HPV 20 + ThinPrep',
  combo_hpv40_thinprep: 'Combo HPV 40 + ThinPrep',
  combo_hpv23_thinprep: 'Combo HPV 23 + ThinPrep',
};

interface TurnaroundInfo {
  timeStr: string;
  subLabel: string;
  isOverdue: boolean;
  overdueHours: number;
  isCompleted: boolean;
  isUnaccepted: boolean;
}

function getCaseTurnaroundInfo(
  item: CaseItem,
  turnaroundMap: Record<string, number>
): TurnaroundInfo {
  // 1. Nếu đã trả kết quả
  if (item.trangThai === 'da_tra_ket_qua') {
    let completedDate = item.ngayTraKetQua || (item as any).updatedAt || item.createdAt;
    let formatted = 'Đã trả kết quả';
    if (completedDate) {
      try {
        const d = new Date(completedDate);
        if (!isNaN(d.getTime())) {
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const mo = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          formatted = `${hh}:${mm} ${dd}/${mo}/${yyyy}`;
        } else {
          formatted = completedDate;
        }
      } catch {
        formatted = completedDate;
      }
    }

    return {
      timeStr: formatted,
      subLabel: 'Đã trả kết quả',
      isOverdue: false,
      overdueHours: 0,
      isCompleted: true,
      isUnaccepted: false,
    };
  }

  // 2. Nếu chưa nhận mẫu (trạng thái: nhap_thong_tin)
  if (item.trangThai === 'nhap_thong_tin') {
    return {
      timeStr: 'Chưa nhận mẫu',
      subLabel: 'Chờ tiếp nhận',
      isOverdue: false,
      overdueHours: 0,
      isCompleted: false,
      isUnaccepted: true,
    };
  }

  // 3. Đang chạy kết quả (chay_ket_qua): Tính thời gian dự kiến và kiểm tra quá hạn
  let startTime = new Date();
  if (item.ngayNhanMau) {
    const p = new Date(item.ngayNhanMau);
    if (!isNaN(p.getTime())) startTime = p;
  } else if (item.createdAt) {
    const p = new Date(item.createdAt);
    if (!isNaN(p.getTime())) startTime = p;
  }

  const hoursConfig =
    turnaroundMap[item.loaiXetNghiem] ||
    (item.loaiXetNghiem?.startsWith('hpv') || item.loaiXetNghiem?.startsWith('combo')
      ? 48
      : ['giaiphaubenh', 'giaiphaubenh_mobenh', 'giaiphaubenh_tebaohoc'].includes(item.loaiXetNghiem)
        ? 72
        : item.loaiXetNghiem === 'soituoi'
          ? 4
          : 24);

  let deadlineDate: Date;
  if (item.ngayDuKienTra) {
    const p = new Date(item.ngayDuKienTra);
    if (!isNaN(p.getTime())) {
      deadlineDate = p;
    } else {
      deadlineDate = new Date(startTime.getTime() + hoursConfig * 3600 * 1000);
    }
  } else {
    deadlineDate = new Date(startTime.getTime() + hoursConfig * 3600 * 1000);
  }

  const hh = String(deadlineDate.getHours()).padStart(2, '0');
  const mm = String(deadlineDate.getMinutes()).padStart(2, '0');
  const dd = String(deadlineDate.getDate()).padStart(2, '0');
  const mo = String(deadlineDate.getMonth() + 1).padStart(2, '0');
  const yyyy = deadlineDate.getFullYear();
  const timeStr = `${hh}:${mm} ${dd}/${mo}/${yyyy}`;

  const diffMs = Date.now() - deadlineDate.getTime();
  if (diffMs > 0) {
    // Quá hạn
    const overdueHours = Math.max(1, Math.floor(diffMs / (3600 * 1000)));
    return {
      timeStr,
      subLabel: `Quá hạn ${overdueHours}h!`,
      isOverdue: true,
      overdueHours,
      isCompleted: false,
      isUnaccepted: false,
    };
  } else {
    // Còn trong hạn
    const remainingHours = Math.max(1, Math.ceil(-diffMs / (3600 * 1000)));
    return {
      timeStr,
      subLabel: remainingHours > 24 ? `Còn ${(remainingHours / 24).toFixed(0)} ngày` : `Còn ${remainingHours}h`,
      isOverdue: false,
      overdueHours: 0,
      isCompleted: false,
      isUnaccepted: false,
    };
  }
}

interface CaseTableProps {
  cases: CaseItem[];
  loading: boolean;
  onRefresh: () => void;
  currentUser?: any;
  filterDoctorInitial?: string;
  activeCategory?: string;
}

export default function CaseTable({
  cases,
  loading,
  onRefresh,
  currentUser,
  filterDoctorInitial = '',
  activeCategory = '',
}: CaseTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = (activeCategory || searchParams?.get('category') || '').toLowerCase();
  const isComboCategory =
    currentCategory.startsWith('combo_') ||
    (cases.length > 0 && cases.every((c) => c.loaiXetNghiem?.toLowerCase()?.startsWith('combo_')));

  const [downloadingCaseId, setDownloadingCaseId] = useState<string | null>(null);

  // Turnaround times map (SLA/Deadline)
  const [turnaroundMap, setTurnaroundMap] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('bio_turnaround_times');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch { }
      }
    }
    return {
      cell: 24,
      thinprep: 24,
      hpv40: 48,
      hpv20: 48,
      hpv23: 48,
      hpv24: 48,
      soituoi: 4,
      giaiphaubenh: 72,
      giaiphaubenh_mobenh: 72,
      giaiphaubenh_tebaohoc: 72,
      combo_hpv20_cell: 48,
      combo_hpv40_cell: 48,
      combo_hpv23_cell: 48,
      combo_hpv20_thinprep: 48,
      combo_hpv40_thinprep: 48,
      combo_hpv23_thinprep: 48,
    };
  });

  useEffect(() => {
    const fetchSla = async () => {
      try {
        const res = await fetch(getApiUrl('/settings/turnaround-time'), {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setTurnaroundMap(data);
          localStorage.setItem('bio_turnaround_times', JSON.stringify(data));
        }
      } catch (e) {
        console.error('Error fetching SLA settings:', e);
      }
    };
    fetchSla();

    fetchDoctorsList().then((docs) => {
      if (docs && docs.length > 0) {
        setDoctorList(docs);
      }
    });
  }, []);

  const [doctorList, setDoctorList] = useState<DoctorOption[]>(DEFAULT_DOCTOR_LIST);

  // Filters
  const [activeStatusTab, setActiveStatusTab] = useState<
    'all' | 'nhap_thong_tin' | 'chay_ket_qua' | 'da_tra_ket_qua'
  >('all');
  const [selectedDoctor, setSelectedDoctor] = useState<string>(filterDoctorInitial);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [actionMenuPos, setActionMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [actionMenuCase, setActionMenuCase] = useState<CaseItem | null>(null);

  useEffect(() => {
    if (!openActionId) return;
    const handleCloseMenu = () => {
      setOpenActionId(null);
      setActionMenuPos(null);
      setActionMenuCase(null);
    };
    window.addEventListener('scroll', handleCloseMenu, true);
    window.addEventListener('resize', handleCloseMenu);
    window.addEventListener('click', handleCloseMenu);
    return () => {
      window.removeEventListener('scroll', handleCloseMenu, true);
      window.removeEventListener('resize', handleCloseMenu);
      window.removeEventListener('click', handleCloseMenu);
    };
  }, [openActionId]);

  // Admin permission
  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.username === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin' || isSuperAdmin;

  // Accept sample modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedCaseForAccept, setSelectedCaseForAccept] = useState<CaseItem | null>(null);
  const [selectedDoctorForAccept, setSelectedDoctorForAccept] = useState('bacsi_lanh');
  const [selectedDoctorForAccept2, setSelectedDoctorForAccept2] = useState('bacsi_hung');
  const [isAccepting, setIsAccepting] = useState(false);

  // History modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCaseForHistory, setSelectedCaseForHistory] = useState<CaseItem | null>(null);

  const handleAcceptCase = async (goToDetail: boolean = false) => {
    if (!selectedCaseForAccept) return;
    setIsAccepting(true);
    try {
      const isCombo = selectedCaseForAccept.loaiXetNghiem?.toLowerCase()?.startsWith('combo_');
      const doc1 = selectedDoctorForAccept;
      const doc2 = isCombo ? (selectedDoctorForAccept2 || selectedDoctorForAccept) : selectedDoctorForAccept;

      const res = await fetch(getApiUrl(`/cases/${selectedCaseForAccept._id}/accept`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          bacSiDoc: doc1,
          bacSiDoc2: doc2,
        }),
      });
      if (res.ok) {
        setShowAcceptModal(false);
        toast.success('Đã tiếp nhận ca xét nghiệm thành công!', 'Tiếp nhận thành công');
        if (goToDetail) {
          window.open(`/results/${selectedCaseForAccept._id}`, '_blank');
          onRefresh();
        } else {
          onRefresh();
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Không thể tiếp nhận ca xét nghiệm!', 'Tiếp nhận thất bại');
      }
    } catch (err) {
      console.error('Error accepting case:', err);
      toast.error('Không thể kết nối đến máy chủ!', 'Lỗi kết nối');
    } finally {
      setIsAccepting(false);
    }
  };

  // Pagination states (mặc định tối đa 20 bản ghi / trang)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Tự động chuyển về trang 1 mỗi khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatusTab, searchKeyword, selectedSource, selectedDoctor, fromDate, toDate]);

  // Status counts
  const counts = useMemo(() => {
    return {
      all: cases.length,
      nhap_thong_tin: cases.filter((c) => c.trangThai === 'nhap_thong_tin').length,
      chay_ket_qua: cases.filter((c) => c.trangThai === 'chay_ket_qua').length,
      da_tra_ket_qua: cases.filter((c) => c.trangThai === 'da_tra_ket_qua').length,
    };
  }, [cases]);

  // Unique sources
  const sources = useMemo(() => {
    const s = new Set<string>();
    cases.forEach((c) => {
      const name =
        typeof c.nguoiNhap === 'object'
          ? c.nguoiNhap?.fullName
          : c.nguoiNhap || c.donVi;
      if (name) s.add(name);
    });
    return Array.from(s);
  }, [cases]);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      if (activeStatusTab !== 'all' && item.trangThai !== activeStatusTab) {
        return false;
      }
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchName = item.hoTen?.toLowerCase().includes(kw);
        const matchCode = item.maSo?.toLowerCase().includes(kw);
        const matchPhone = item.soDienThoai?.includes(kw);

        // Tìm theo tên Nguồn / Đơn vị
        const sourceName =
          typeof item.nguoiNhap === 'object'
            ? item.nguoiNhap?.fullName
            : item.nguoiNhap || item.donVi;
        const matchSource = (sourceName || '').toLowerCase().includes(kw) || (item.donVi || '').toLowerCase().includes(kw);

        // Tìm theo tên Bác sĩ đọc KQ & Bác sĩ chỉ định
        const matchDoctor =
          (item.bacSiDoc || '').toLowerCase().includes(kw) ||
          ((item as any).bacSiDoc2 || '').toLowerCase().includes(kw) ||
          ((item as any).doctorName || '').toLowerCase().includes(kw) ||
          (item.bacSiChiDinh || '').toLowerCase().includes(kw);

        const matchDiagnosis = (item.chanDoanLamSang || '').toLowerCase().includes(kw);

        if (!matchName && !matchCode && !matchPhone && !matchSource && !matchDoctor && !matchDiagnosis) return false;
      }
      if (selectedSource !== 'all') {
        const sourceName =
          typeof item.nguoiNhap === 'object'
            ? item.nguoiNhap?.fullName
            : item.nguoiNhap || item.donVi;
        if (sourceName !== selectedSource) return false;
      }
      if (selectedDoctor && selectedDoctor.trim() !== '') {
        const doc1 = (item.bacSiDoc || '').toLowerCase();
        const doc2 = ((item as any).bacSiDoc2 || '').toLowerCase();
        const targetDoc = selectedDoctor.toLowerCase();
        if (!doc1.includes(targetDoc) && !doc2.includes(targetDoc)) return false;
      }
      if (fromDate) {
        const created = item.createdAt ? item.createdAt.split('T')[0] : '';
        if (created < fromDate) return false;
      }
      if (toDate) {
        const created = item.createdAt ? item.createdAt.split('T')[0] : '';
        if (created > toDate) return false;
      }
      return true;
    });
  }, [cases, activeStatusTab, searchKeyword, selectedSource, selectedDoctor, fromDate, toDate]);

  // Tính toán phân trang (Pagination calculations)
  const totalPages = Math.ceil(filteredCases.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredCases.length);

  const paginatedCases = useMemo(() => {
    return filteredCases.slice(startIndex, endIndex);
  }, [filteredCases, startIndex, endIndex]);

  // Tạo danh sách số trang hiển thị thông minh (kèm dấu ...)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ];
  }, [totalPages, currentPage]);

  const handleDelete = async (id: string, maSo: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa phiếu ${maSo}?`)) {
      try {
        const res = await fetch(getApiUrl(`/cases/${id}`), {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          toast.success(`Đã xóa phiếu ${maSo} thành công!`, 'Xóa thành công');
          onRefresh();
        } else {
          const err = await res.json().catch(() => ({}));
          toast.error(err.message || 'Không thể xóa phiếu xét nghiệm!', 'Xóa thất bại');
        }
      } catch (err) {
        console.error('Error deleting case:', err);
        toast.error('Không thể kết nối đến máy chủ!', 'Lỗi kết nối');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. FILTER BAR CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Row 1: Status Tabs & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveStatusTab('all')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeStatusTab === 'all'
                  ? 'bg-[#0070f3] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <span>Tất cả</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${activeStatusTab === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600'
                  }`}
              >
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveStatusTab('nhap_thong_tin')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeStatusTab === 'nhap_thong_tin'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <span>Nhập thông tin</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${activeStatusTab === 'nhap_thong_tin'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600'
                  }`}
              >
                {counts.nhap_thong_tin}
              </span>
            </button>

            <button
              onClick={() => setActiveStatusTab('chay_ket_qua')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeStatusTab === 'chay_ket_qua'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <span>Chạy kết quả</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${activeStatusTab === 'chay_ket_qua'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600'
                  }`}
              >
                {counts.chay_ket_qua}
              </span>
            </button>

            <button
              onClick={() => setActiveStatusTab('da_tra_ket_qua')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeStatusTab === 'da_tra_ket_qua'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              <span>Đã trả kết quả</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${activeStatusTab === 'da_tra_ket_qua'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600'
                  }`}
              >
                {counts.da_tra_ket_qua}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo Tên, Mã số, SĐT, Nguồn, Bác sĩ..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0070f3] transition-all font-medium"
            />
          </div>
        </div>

        {/* Row 2: Date filter & Source filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3.5 border-t border-slate-100 text-sm text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-blue-600" />
              Lọc theo ngày tạo:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Từ ngày:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Đến ngày:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <UserIcon className="w-4 h-4 text-purple-600" />
                Lọc theo nguồn:
              </span>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">-- Tất cả nguồn tạo --</option>
                {sources.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2. DATA TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-h-[260px] pb-4">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
                <th className="py-3 px-3.5 font-bold">MÃ SỐ</th>
                <th className="py-3 px-3.5 font-bold">HỌ VÀ TÊN</th>
                {!isComboCategory && (
                  <th className="py-3 px-3 font-bold text-center">NĂM SINH</th>
                )}
                {isAdmin && <th className="py-3 px-3.5 font-bold">NGUỒN</th>}
                <th className="py-3 px-3.5 font-bold">{isComboCategory ? 'BS 1 (HPV)' : 'BS ĐỌC KQ'}</th>
                {isComboCategory && (
                  <th className="py-3 px-3.5 font-bold text-purple-700">BS 2 (TẾ BÀO)</th>
                )}
                <th className="py-3 px-3 font-bold text-center">TRẠNG THÁI</th>
                <th className="py-3 px-3.5 font-bold">THỜI GIAN TRẢ / DỰ KIẾN</th>
                <th className="py-3 px-3 font-bold text-center">NGÀY TẠO</th>
                <th className="py-3 px-3.5 font-bold text-right pr-6">THAO TÁC</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? (isComboCategory ? 9 : 9) : (isComboCategory ? 8 : 8)} className="py-12 text-center text-slate-400 font-medium">
                    Đang tải danh sách phiếu xét nghiệm...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? (isComboCategory ? 9 : 9) : (isComboCategory ? 8 : 8)} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy ca xét nghiệm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedCases.map((item, index) => {
                  const sourceName =
                    typeof item.nguoiNhap === 'object'
                      ? item.nguoiNhap?.fullName
                      : item.nguoiNhap || item.donVi || 'Gentech Lab';

                  const createdDate = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('vi-VN')
                    : item.ngayNhanMau || '';

                  // Tự động lật hướng menu lên trên nếu là các dòng ở cuối bảng
                  const isLastRows = paginatedCases.length > 2
                    ? index >= paginatedCases.length - 2
                    : index === paginatedCases.length - 1;

                  // Tính toán thời gian trả / dự kiến & trạng thái quá hạn
                  const turnaround = getCaseTurnaroundInfo(item, turnaroundMap);

                  // Kiểm tra ca Combo & Bác sĩ đang xem
                  const isComboItem = Boolean(
                    item.loaiXetNghiem?.toLowerCase()?.startsWith('combo_') ||
                    (item.bacSiDoc2 && item.bacSiDoc2.trim() !== '' && item.bacSiDoc2 !== item.bacSiDoc)
                  );

                  const userUsername = currentUser?.username?.toLowerCase() || '';
                  const userFullName = currentUser?.fullName?.toLowerCase() || '';

                  // Đánh giá xem người dùng đang đăng nhập là BS 2 (ví dụ bacsi_lanh2)
                  const isUserDoctor2 = Boolean(
                    isComboItem &&
                    ((item.bacSiDoc2Username && userUsername === item.bacSiDoc2Username.toLowerCase()) ||
                     (item.bacSiDoc2 && (userFullName.includes(item.bacSiDoc2.toLowerCase()) || userUsername.includes('lanh2'))))
                  );

                  // Đánh giá xem người dùng đang đăng nhập là BS 1
                  const isUserDoctor1 = Boolean(
                    (item.bacSiDocUsername && userUsername === item.bacSiDocUsername.toLowerCase()) ||
                    (item.bacSiDoc && userFullName.includes(item.bacSiDoc.toLowerCase()))
                  );

                  // Màu dòng và viền cạnh trái theo trạng thái
                  let rowBgClass = 'bg-white hover:bg-sky-50/40';
                  let firstCellBorder = '';

                  if (turnaround.isOverdue) {
                    rowBgClass = 'bg-rose-50/70 hover:bg-rose-100/70';
                    firstCellBorder = 'border-l-4 border-l-red-500';
                  } else if (turnaround.isUnaccepted) {
                    rowBgClass = 'bg-amber-50/60 hover:bg-amber-100/60';
                    firstCellBorder = 'border-l-4 border-l-amber-400';
                  } else if (turnaround.isCompleted) {
                    rowBgClass = 'bg-white hover:bg-slate-50/80';
                  }

                  return (
                    <tr
                      key={item._id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
                          return;
                        }
                        window.open(`/results/${item._id}`, '_blank');
                      }}
                      className={`${rowBgClass} transition-colors cursor-pointer group`}
                    >
                      {/* Mã số */}
                      <td className={`py-3 px-3.5 relative ${firstCellBorder}`}>
                        <Link
                          href={`/results/${item._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs font-bold text-[#0070f3] leading-tight hover:underline focus:outline-none"
                        >
                          {item.maSo}
                        </Link>
                        {item.loaiXetNghiem && (
                          <span className="inline-block text-[9.5px] font-medium text-slate-500 bg-slate-100/90 border border-slate-200/80 px-1.5 py-0.5 rounded-md mt-1 select-none">
                            {CATEGORY_NAMES_MAP[item.loaiXetNghiem] || item.loaiXetNghiem}
                          </span>
                        )}
                      </td>

                      {/* Họ và tên */}
                      <td className="py-3 px-3.5">
                        <Link
                          href={`/results/${item._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs font-bold text-slate-800 uppercase hover:text-[#0070f3] hover:underline focus:outline-none"
                        >
                          {item.hoTen}
                        </Link>
                      </td>

                      {/* Năm sinh (chỉ hiển thị khi không phải ca Combo) */}
                      {!isComboCategory && (
                        <td className="py-3 px-3 text-center text-xs font-medium text-slate-600">
                          {item.namSinh || '---'}
                        </td>
                      )}

                      {/* Nguồn (Chỉ hiển thị với Admin) */}
                      {isAdmin && (
                        <td className="py-3 px-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <UserIcon className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[120px]">{sourceName}</span>
                          </span>
                        </td>
                      )}

                      {/* Bác sĩ đọc kết quả 1 (hoặc hiển thị thông minh theo tài khoản / ca Combo) */}
                      {isComboCategory ? (
                        <>
                          {/* Trong tab chuyên biệt Combo: Hiển thị 2 cột riêng */}
                          <td className="py-3 px-3.5">
                            <div className="text-xs font-semibold text-slate-700 leading-tight">
                              {item.bacSiDoc || 'Chưa phân công'}
                            </div>
                            {item.daKy ? (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-1 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>BS 1 đã đọc</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-1 rounded-full text-[9.5px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-2.5 h-2.5 text-amber-500" />
                                <span>BS 1 chưa đọc</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3.5">
                            <div className="text-xs font-semibold text-slate-700 leading-tight">
                              {item.bacSiDoc2 || 'Chưa phân công'}
                            </div>
                            {item.daKy2 ? (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-1 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>BS 2 đã đọc</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-1 rounded-full text-[9.5px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-2.5 h-2.5 text-amber-500" />
                                <span>BS 2 chưa đọc</span>
                              </div>
                            )}
                          </td>
                        </>
                      ) : (
                        /* Trong các danh mục khác (Tất cả dịch vụ...): Ô đơn hiển thị thông minh */
                        <td className="py-3 px-3.5">
                          {!isComboItem ? (
                            /* Ca đơn thường */
                            <>
                              <div className="text-xs font-semibold text-slate-700 leading-tight">
                                {item.bacSiDoc || 'Chưa phân công'}
                              </div>
                              {item.daKy && (
                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-1 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Bác sĩ đã đọc</span>
                                </div>
                              )}
                            </>
                          ) : isAdmin ? (
                            /* Ca Combo - Tài khoản Admin: Cùng màu chữ bác sĩ (slate-700) và cùng màu trạng thái (emerald cho đã đọc, amber cho chưa đọc) */
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1.5 text-xs">
                                <div className="font-semibold text-slate-700 truncate max-w-[130px]" title={item.bacSiDoc || 'Chưa phân công'}>
                                  {item.bacSiDoc || 'Chưa phân công'}
                                </div>
                                {item.daKy ? (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Đã đọc
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                    Chưa đọc
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-1.5 text-xs pt-1 border-t border-slate-100">
                                <div className="font-semibold text-slate-700 truncate max-w-[130px]" title={item.bacSiDoc2 || 'Chưa phân công'}>
                                  {item.bacSiDoc2 || 'Chưa phân công'}
                                </div>
                                {item.daKy2 ? (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Đã đọc
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                    Chưa đọc
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : isUserDoctor2 ? (
                            /* Ca Combo - Bác sĩ đang đăng nhập là BS 2 (BS Lánh) */
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800 leading-tight">
                                  {item.bacSiDoc2 || 'Chưa phân công'}
                                </span>
                              </div>

                              <div className="mt-1">
                                {item.daKy2 ? (
                                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Bạn đã đọc</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-2.5 h-2.5 text-amber-500" />
                                    <span>Chưa đọc</span>
                                  </div>
                                )}
                              </div>

                              {item.bacSiDoc && (
                                <div className="text-[10px] text-slate-400 font-medium mt-1 truncate max-w-[170px]" title={`Cùng đọc: ${item.bacSiDoc}`}>
                                  Cùng đọc: <span className="text-slate-600">{item.bacSiDoc}</span> {item.daKy ? '✓' : ''}
                                </div>
                              )}
                            </>
                          ) : (
                            /* Ca Combo - Bác sĩ 1 hoặc xem mặc định */
                            <>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800 leading-tight">
                                  {item.bacSiDoc || 'Chưa phân công'}
                                </span>
                              </div>

                              <div className="mt-1">
                                {item.daKy ? (
                                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>{isUserDoctor1 ? 'Bạn đã đọc' : 'Đã đọc'}</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-2.5 h-2.5 text-amber-500" />
                                    <span>Chưa đọc</span>
                                  </div>
                                )}
                              </div>

                              {item.bacSiDoc2 && (
                                <div className="text-[10px] text-slate-400 font-medium mt-1 truncate max-w-[170px]" title={`Cùng đọc: ${item.bacSiDoc2}`}>
                                  Cùng đọc: <span className="text-slate-600 font-medium">{item.bacSiDoc2}</span> {item.daKy2 ? '✓' : ''}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                      )}

                      {/* Trạng thái */}
                      <td className="py-3 px-3.5 text-center">
                        {item.trangThai === 'da_tra_ket_qua' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đã trả kết quả</span>
                          </span>
                        ) : item.trangThai === 'chay_ket_qua' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <FlaskConical className="w-3 h-3 text-blue-600" />
                            <span>Chạy kết quả</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Nhập thông tin</span>
                          </span>
                        )}
                      </td>

                      {/* Thời gian trả / Dự kiến */}
                      <td className="py-3 px-3.5 text-xs font-medium">
                        {turnaround.isCompleted ? (
                          <div>
                            <div className="font-bold text-slate-800 text-xs">
                              {turnaround.timeStr}
                            </div>
                            <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{turnaround.subLabel}</span>
                            </div>
                          </div>
                        ) : turnaround.isUnaccepted ? (
                          <div>
                            <div className="font-semibold text-slate-500 text-xs">
                              {turnaround.timeStr}
                            </div>
                            <div className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>{turnaround.subLabel}</span>
                            </div>
                          </div>
                        ) : turnaround.isOverdue ? (
                          <div>
                            <div className="font-bold text-slate-800 text-xs">
                              {turnaround.timeStr}
                            </div>
                            <div className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-red-500" />
                              <span>{turnaround.subLabel}</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-800 text-xs">
                              {turnaround.timeStr}
                            </div>
                            <div className="text-[10px] font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span>{turnaround.subLabel}</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Ngày tạo */}
                      <td className="py-3 px-3 text-center text-slate-500 font-medium text-xs">
                        {createdDate}
                      </td>

                      {/* Thao tác */}
                      <td
                        className="py-3 px-3.5 text-right relative pr-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          {/* Nút Nhận mẫu (Chỉ hiển thị với Admin khi trạng thái là Nhập thông tin) */}
                          {isAdmin && item.trangThai === 'nhap_thong_tin' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionId(null);
                                setSelectedCaseForAccept(item);
                                setSelectedDoctorForAccept(item.bacSiDocUsername || (doctorList.find(d => d.fullName === item.bacSiDoc)?.username) || doctorList[0]?.username || 'bacsi_lanh');
                                const defaultDoc2 = doctorList.length > 2 ? doctorList[2]?.username : (doctorList[1]?.username || 'bacsi_duong');
                                setSelectedDoctorForAccept2((item as any).bacSiDoc2Username || (doctorList.find(d => d.fullName === (item as any).bacSiDoc2)?.username) || defaultDoc2);
                                setShowAcceptModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#00a86b] hover:bg-[#008f5a] text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95 leading-tight text-left"
                              title="Nhận mẫu & Phân công bác sĩ"
                            >
                              <FileText className="w-3 h-3 shrink-0" />
                              <span>
                                Nhận<br />mẫu
                              </span>
                            </button>
                          )}

                          {/* 3 dots menu button - mở menu nổi cố định (Portal) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openActionId === item._id) {
                                setOpenActionId(null);
                                setActionMenuPos(null);
                                setActionMenuCase(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const right = Math.max(16, window.innerWidth - rect.right);
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const ESTIMATED_MENU_HEIGHT = 160;

                                let top: number;
                                if (spaceBelow < ESTIMATED_MENU_HEIGHT && rect.top > ESTIMATED_MENU_HEIGHT) {
                                  top = rect.top - ESTIMATED_MENU_HEIGHT - 4;
                                } else {
                                  top = rect.bottom + 4;
                                }

                                setActionMenuPos({ top, right });
                                setActionMenuCase(item);
                                setOpenActionId(item._id);
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 font-medium">
          {/* Info & Page Size */}
          <div className="flex flex-wrap items-center gap-4">
            <span>
              Hiển thị{' '}
              <strong className="text-slate-800 font-bold">
                {filteredCases.length > 0 ? startIndex + 1 : 0} - {endIndex}
              </strong>{' '}
              trên tổng số{' '}
              <strong className="text-slate-800 font-bold">{filteredCases.length}</strong> ca xét nghiệm
              {filteredCases.length !== cases.length && (
                <span className="text-slate-400 font-normal ml-1">
                  (lọc từ {cases.length} ca)
                </span>
              )}
            </span>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <span className="text-slate-500 font-medium">Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-sm font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3] cursor-pointer shadow-2xs"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>

              {pageNumbers.map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400 font-medium select-none text-sm">
                      ...
                    </span>
                  );
                }
                const isCurrent = currentPage === p;
                return (
                  <button
                    key={`page-${p}`}
                    onClick={() => setCurrentPage(p as number)}
                    className={`min-w-9 h-9 px-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${isCurrent
                        ? 'bg-[#0070f3] text-white shadow-xs'
                        : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang tiếp theo"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL TIẾP NHẬN MẪU & PHÂN BÁC SĨ (DÀNH CHO ADMIN) */}
      {showAcceptModal && selectedCaseForAccept && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowAcceptModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00a86b] text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    Tiếp nhận mẫu xét nghiệm
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Mã số: <span className="font-bold text-slate-800">{selectedCaseForAccept.maSo}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 border border-slate-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Bệnh nhân:</span>
                  <span className="font-bold text-slate-800 uppercase">
                    {selectedCaseForAccept.hoTen} ({selectedCaseForAccept.namSinh || '---'})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Dịch vụ xét nghiệm:</span>
                  <span className="font-bold text-blue-700 uppercase">
                    {selectedCaseForAccept.loaiXetNghiem}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nguồn gửi mẫu:</span>
                  <span className="font-semibold text-slate-700">
                    {selectedCaseForAccept.donVi || 'Gentech Lab'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Ngày nhận mẫu:</span>
                  <span className="font-semibold text-slate-700">
                    {selectedCaseForAccept.ngayNhanMau || new Date().toISOString().split('T')[0]}
                  </span>
                </div>
              </div>

              {/* Phân công bác sĩ */}
              {selectedCaseForAccept.loaiXetNghiem?.toLowerCase()?.startsWith('combo_') ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Bác sĩ 1 (Đọc kết quả HPV) *</span>
                    </label>
                    <select
                      value={selectedDoctorForAccept}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedDoctorForAccept(val);
                      }}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer shadow-2xs"
                    >
                      {doctorList.map((doc) => (
                        <option key={`accept-doc1-${doc.username || doc.fullName}`} value={doc.username}>
                          {doc.fullName} ({doc.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Bác sĩ 2 (Đọc kết quả Tế bào / ThinPrep) *</span>
                    </label>
                    <select
                      value={selectedDoctorForAccept2}
                      onChange={(e) => setSelectedDoctorForAccept2(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer shadow-2xs"
                    >
                      {doctorList.map((doc) => (
                        <option key={`accept-doc2-${doc.username || doc.fullName}`} value={doc.username}>
                          {doc.fullName} ({doc.username})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ca Combo có thể phân công 2 Bác sĩ khác nhau hoặc cùng 1 Bác sĩ đọc toàn bộ.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phân công Bác sĩ đọc kết quả:
                  </label>
                  <select
                    value={selectedDoctorForAccept}
                    onChange={(e) => setSelectedDoctorForAccept(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer shadow-2xs"
                  >
                    {doctorList.map((doc) => (
                      <option key={`accept-doc-${doc.username || doc.fullName}`} value={doc.username}>
                        {doc.fullName} ({doc.username})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sau khi tiếp nhận, ca xét nghiệm sẽ chuyển sang trạng thái <strong>Chạy kết quả</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={isAccepting}
                onClick={() => handleAcceptCase(false)}
                className="px-4 py-2 bg-[#00a86b] hover:bg-[#008f5a] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isAccepting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Tiếp nhận mẫu</span>
              </button>

              <button
                type="button"
                disabled={isAccepting}
                onClick={() => handleAcceptCase(true)}
                className="px-4 py-2 bg-[#0070f3] hover:bg-[#005bb5] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isAccepting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Tiếp nhận & Vào nhập kết quả</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION MENU VIA REACT PORTAL */}
      {openActionId && actionMenuCase && actionMenuPos && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed w-44 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[9999] text-left animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: `${actionMenuPos.top}px`,
            right: `${actionMenuPos.right}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Tải kết quả (PDF) */}
          <button
            disabled={downloadingCaseId === actionMenuCase._id}
            onClick={async (e) => {
              e.stopPropagation();
              const targetCase = actionMenuCase;
              setOpenActionId(null);
              setActionMenuPos(null);
              setActionMenuCase(null);
              try {
                setDownloadingCaseId(targetCase._id);
                toast.info(`Đang tải PDF phiếu ${targetCase.maSo || ''}...`, 'Đang xử lý');
                await downloadCasePdf({
                  caseId: targetCase._id,
                  patientName: targetCase.hoTen,
                  maSo: targetCase.maSo,
                });
                toast.success(`Đã tải PDF phiếu ${targetCase.maSo || ''} thành công!`, 'Tải hoàn tất');
              } catch (err: any) {
                console.error('Lỗi khi tải PDF:', err);
                toast.error(err.message || 'Không thể tải file PDF!', 'Lỗi tải xuống');
              } finally {
                setDownloadingCaseId(null);
              }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {downloadingCaseId === actionMenuCase._id ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <Download className="w-4 h-4 text-emerald-600" />
            )}
            <span>
              {downloadingCaseId === actionMenuCase._id ? 'Đang tải PDF...' : 'Tải kết quả (PDF)'}
            </span>
          </button>

          {/* 1.5 Lịch sử thao tác (Chỉ hiển thị cho Admin / Super Admin) */}
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const targetCase = actionMenuCase;
                setOpenActionId(null);
                setActionMenuPos(null);
                setActionMenuCase(null);
                setSelectedCaseForHistory(targetCase);
                setShowHistoryModal(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer text-left"
            >
              <History className="w-4 h-4 text-amber-600" />
              <span>Lịch sử thao tác</span>
            </button>
          )}

          {/* 2. Sửa thông tin phiếu */}
          <Link
            href={`/results/${actionMenuCase._id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              setOpenActionId(null);
              setActionMenuPos(null);
              setActionMenuCase(null);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-purple-600" />
            <span>Sửa thông tin phiếu</span>
          </Link>

          {/* 3. Xóa phiếu (Chỉ dành cho Admin phòng Lab) */}
          {isAdmin && (
            <>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const targetCase = actionMenuCase;
                  setOpenActionId(null);
                  setActionMenuPos(null);
                  setActionMenuCase(null);
                  handleDelete(targetCase._id, targetCase.maSo);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Xóa phiếu này</span>
              </button>
            </>
          )}
        </div>,
        document.body
      )}

      {/* MODAL LỊCH SỬ THAO TÁC PHIẾU */}
      <CaseHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedCaseForHistory(null);
        }}
        caseItem={selectedCaseForHistory}
      />
    </div>
  );
}