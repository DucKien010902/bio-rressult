'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';

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
  daKy: boolean;
  trangThai: 'nhap_thong_tin' | 'chay_ket_qua' | 'da_tra_ket_qua';
  createdAt: string;
}

import { getApiUrl, getAuthHeaders } from '@/lib/config';

interface CaseTableProps {
  cases: CaseItem[];
  loading: boolean;
  onRefresh: () => void;
  currentUser?: any;
  filterDoctorInitial?: string;
}

export default function CaseTable({
  cases,
  loading,
  onRefresh,
  currentUser,
  filterDoctorInitial = '',
}: CaseTableProps) {
  const router = useRouter();

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

  // Admin permission
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'admin';

  // Accept sample modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedCaseForAccept, setSelectedCaseForAccept] = useState<CaseItem | null>(null);
  const [selectedDoctorForAccept, setSelectedDoctorForAccept] = useState('TS.BS Nguyễn Sỹ Lãnh');
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAcceptCase = async (goToDetail: boolean = false) => {
    if (!selectedCaseForAccept) return;
    setIsAccepting(true);
    try {
      const res = await fetch(getApiUrl(`/cases/${selectedCaseForAccept._id}/accept`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ bacSiDoc: selectedDoctorForAccept }),
      });
      if (res.ok) {
        setShowAcceptModal(false);
        if (goToDetail) {
          router.push(`/results/${selectedCaseForAccept._id}`);
        } else {
          onRefresh();
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Không thể tiếp nhận ca xét nghiệm!');
      }
    } catch (err) {
      console.error('Error accepting case:', err);
      alert('Không thể kết nối đến máy chủ!');
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
        if (!matchName && !matchCode && !matchPhone) return false;
      }
      if (selectedSource !== 'all') {
        const sourceName =
          typeof item.nguoiNhap === 'object'
            ? item.nguoiNhap?.fullName
            : item.nguoiNhap || item.donVi;
        if (sourceName !== selectedSource) return false;
      }
      if (selectedDoctor && selectedDoctor.trim() !== '') {
        const docName = (item.bacSiDoc || '').toLowerCase();
        if (!docName.includes(selectedDoctor.toLowerCase())) return false;
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
          onRefresh();
        }
      } catch (err) {
        console.error('Error deleting case:', err);
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
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeStatusTab === 'all'
                  ? 'bg-[#0070f3] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Tất cả</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                  activeStatusTab === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveStatusTab('nhap_thong_tin')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeStatusTab === 'nhap_thong_tin'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Nhập thông tin</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                  activeStatusTab === 'nhap_thong_tin'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {counts.nhap_thong_tin}
              </span>
            </button>

            <button
              onClick={() => setActiveStatusTab('chay_ket_qua')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeStatusTab === 'chay_ket_qua'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Chạy kết quả</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                  activeStatusTab === 'chay_ket_qua'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {counts.chay_ket_qua}
              </span>
            </button>

            <button
              onClick={() => setActiveStatusTab('da_tra_ket_qua')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeStatusTab === 'da_tra_ket_qua'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Đã trả kết quả</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                  activeStatusTab === 'da_tra_ket_qua'
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
              placeholder="Tìm theo Tên, Mã số, SĐT..."
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-xs">
                <th className="py-3.5 px-4 font-bold">MÃ SỐ</th>
                <th className="py-3.5 px-4 font-bold">HỌ VÀ TÊN</th>
                <th className="py-3.5 px-3 font-bold text-center">NĂM SINH</th>
                {isAdmin && <th className="py-3.5 px-4 font-bold">NGUỒN</th>}
                <th className="py-3.5 px-4 font-bold">BS ĐỌC KQ</th>
                <th className="py-3.5 px-4 font-bold text-center">TRẠNG THÁI</th>
                <th className="py-3.5 px-4 font-bold">THỜI GIAN TRẢ / DỰ KIẾN</th>
                <th className="py-3.5 px-3 font-bold text-center">NGÀY TẠO</th>
                <th className="py-3.5 px-4 font-bold text-right pr-6">THAO TÁC</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-slate-400 font-medium">
                    Đang tải danh sách phiếu xét nghiệm...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy ca xét nghiệm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedCases.map((item) => {
                  const sourceName =
                    typeof item.nguoiNhap === 'object'
                      ? item.nguoiNhap?.fullName
                      : item.nguoiNhap || item.donVi || 'Gentech Lab';

                  const createdDate = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('vi-VN')
                    : item.ngayNhanMau || '';

                  return (
                    <tr
                      key={item._id}
                      onClick={() => router.push(`/results/${item._id}`)}
                      className="hover:bg-sky-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Mã số */}
                      <td className="py-3.5 px-4 font-bold text-[#0070f3] hover:underline">
                        <span>{item.maSo}</span>
                      </td>

                      {/* Họ và tên */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 uppercase">
                        {item.hoTen}
                      </td>

                      {/* Năm sinh */}
                      <td className="py-3.5 px-3 text-center font-medium text-slate-600">
                        {item.namSinh || '---'}
                      </td>

                      {/* Nguồn (Chỉ hiển thị với Admin) */}
                      {isAdmin && (
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <UserIcon className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[120px]">{sourceName}</span>
                          </span>
                        </td>
                      )}

                      {/* Bác sĩ đọc kết quả */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 leading-tight">
                          {item.bacSiDoc || 'Chưa phân công'}
                        </div>
                        {item.daKy && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Bác sĩ đã đọc</span>
                          </div>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        {item.trangThai === 'da_tra_ket_qua' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã trả kết quả</span>
                          </span>
                        ) : item.trangThai === 'chay_ket_qua' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
                            <span>Chạy kết quả</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Nhập thông tin</span>
                          </span>
                        )}
                      </td>

                      {/* Thời gian trả / Dự kiến */}
                      <td className="py-3.5 px-4 text-xs font-medium">
                        {item.trangThai === 'da_tra_ket_qua' ? (
                          <div>
                            <div className="font-bold text-slate-800">
                              {item.ngayTraKetQua || '12/09/2026'}
                            </div>
                            <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Đã trả kết quả</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-slate-600">
                              {item.ngayDuKienTra || 'Dự kiến: 2-3 ngày'}
                            </div>
                            <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                              Đang xử lý mẫu
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Ngày tạo */}
                      <td className="py-3.5 px-3 text-center text-slate-500 font-medium text-xs">
                        {createdDate}
                      </td>

                      {/* Thao tác */}
                      <td
                        className="py-3.5 px-4 text-right relative pr-4"
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
                                setSelectedDoctorForAccept(item.bacSiDoc || 'TS.BS Nguyễn Sỹ Lãnh');
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

                          {/* 3 dots menu button - luôn cố định sát lề phải */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionId(openActionId === item._id ? null : item._id);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {openActionId === item._id && (
                          <div
                            className="absolute right-4 top-10 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 text-left animate-in fade-in slide-in-from-top-1"
                            onMouseLeave={() => setOpenActionId(null)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* 1. Tải kết quả (PDF) */}
                            <button
                              onClick={() => {
                                setOpenActionId(null);
                                window.open(
                                  getApiUrl(`/cases/${item._id}/export-pdf`),
                                  '_blank'
                                );
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Download className="w-4 h-4 text-emerald-600" />
                              <span>Tải kết quả (PDF)</span>
                            </button>

                            {/* 2. Sửa thông tin phiếu */}
                            <button
                              onClick={() => {
                                setOpenActionId(null);
                                router.push(`/results/${item._id}`);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4 text-purple-600" />
                              <span>Sửa thông tin phiếu</span>
                            </button>

                            {/* 3. Xóa phiếu (Chỉ dành cho Admin phòng Lab) */}
                            {isAdmin && (
                              <>
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                  onClick={() => {
                                    setOpenActionId(null);
                                    handleDelete(item._id, item.maSo);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                  <span>Xóa phiếu này</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
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
                    className={`min-w-9 h-9 px-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                      isCurrent
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
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Phân công Bác sĩ đọc kết quả:
                </label>
                <select
                  value={selectedDoctorForAccept}
                  onChange={(e) => setSelectedDoctorForAccept(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none cursor-pointer shadow-2xs"
                >
                  <option value="TS.BS Nguyễn Sỹ Lãnh">TS.BS Nguyễn Sỹ Lãnh</option>
                  <option value="TS . BS Nguyễn Khánh Dương">TS . BS Nguyễn Khánh Dương</option>
                  <option value="BS CK1 PHẠM THẾ HÙNG">BS CK1 PHẠM THẾ HÙNG</option>
                  <option value="BS CK1 NGUYỄN VĂN TRỰC">BS CK1 NGUYỄN VĂN TRỰC</option>
                  <option value="BS PHẠM THẾ ĐƯƠNG">BS PHẠM THẾ ĐƯƠNG</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sau khi tiếp nhận, ca xét nghiệm sẽ chuyển sang trạng thái <strong>Chạy kết quả</strong>.
                </p>
              </div>
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
    </div>
  );
}
