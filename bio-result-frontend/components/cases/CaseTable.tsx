'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Calendar,
  User as UserIcon,
  MoreVertical,
  Eye,
  Download,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  FlaskConical,
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
        const res = await fetch(`http://localhost:5002/api/cases/${id}`, {
          method: 'DELETE',
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStatusTab === 'all'
                  ? 'bg-[#0070f3] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Tất cả</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStatusTab === 'nhap_thong_tin'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Nhập thông tin</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStatusTab === 'chay_ket_qua'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Chạy kết quả</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStatusTab === 'da_tra_ket_qua'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Đã trả kết quả</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
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
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo Tên, Mã số, SĐT..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0070f3] transition-all font-medium"
            />
          </div>
        </div>

        {/* Row 2: Date filter & Source filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Lọc theo ngày tạo:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Từ ngày:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Đến ngày:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs focus:bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <UserIcon className="w-3.5 h-3.5 text-purple-600" />
              Lọc theo nguồn:
            </span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">-- Tất cả nguồn tạo --</option>
              {sources.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. DATA TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 font-bold">MÃ SỐ</th>
                <th className="py-3.5 px-4 font-bold">HỌ VÀ TÊN</th>
                <th className="py-3.5 px-3 font-bold text-center">NĂM SINH</th>
                <th className="py-3.5 px-4 font-bold">NGUỒN</th>
                <th className="py-3.5 px-4 font-bold">BS ĐỌC KQ</th>
                <th className="py-3.5 px-4 font-bold text-center">TRẠNG THÁI</th>
                <th className="py-3.5 px-4 font-bold">THỜI GIAN TRẢ / DỰ KIẾN</th>
                <th className="py-3.5 px-3 font-bold text-center">NGÀY TẠO</th>
                <th className="py-3.5 px-3 font-bold text-center">THAO TÁC</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Đang tải danh sách phiếu xét nghiệm...
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
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
                      className="hover:bg-sky-50/30 transition-colors group"
                    >
                      {/* Mã số -> Link sang /results/[id] */}
                      <td className="py-3.5 px-4 font-bold text-[#0070f3] hover:underline cursor-pointer">
                        <Link href={`/results/${item._id}`}>
                          {item.maSo}
                        </Link>
                      </td>

                      {/* Họ và tên */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 uppercase">
                        {item.hoTen}
                      </td>

                      {/* Năm sinh */}
                      <td className="py-3.5 px-3 text-center font-medium text-slate-600">
                        {item.namSinh || '---'}
                      </td>

                      {/* Nguồn */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <UserIcon className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[120px]">{sourceName}</span>
                        </span>
                      </td>

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

                      {/* Thao tác Dropdown */}
                      <td className="py-3.5 px-3 text-center relative">
                        <button
                          onClick={() =>
                            setOpenActionId(openActionId === item._id ? null : item._id)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openActionId === item._id && (
                          <div
                            className="absolute right-4 top-10 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 text-left animate-in fade-in slide-in-from-top-1"
                            onMouseLeave={() => setOpenActionId(null)}
                          >
                            {/* 1. Xem chi tiết -> /results/[id] */}
                            <button
                              onClick={() => {
                                setOpenActionId(null);
                                router.push(`/results/${item._id}`);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0070f3] transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-[#0070f3]" />
                              <span>Xem chi tiết</span>
                            </button>

                            {/* 2. Tải kết quả (PDF) */}
                            <button
                              onClick={() => {
                                setOpenActionId(null);
                                window.open(
                                  `http://localhost:5002/api/cases/${item._id}/export-pdf`,
                                  '_blank'
                                );
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Download className="w-4 h-4 text-emerald-600" />
                              <span>Tải kết quả (PDF)</span>
                            </button>

                            {/* 3. Sửa thông tin phiếu -> /results/[id] */}
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

                            {/* 4. Xóa phiếu (Chỉ dành cho Admin phòng Lab) */}
                            {currentUser?.role === 'admin' && (
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
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
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

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="text-slate-500">Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3] cursor-pointer shadow-2xs"
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {pageNumbers.map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400 font-medium select-none">
                      ...
                    </span>
                  );
                }
                const isCurrent = currentPage === p;
                return (
                  <button
                    key={`page-${p}`}
                    onClick={() => setCurrentPage(p as number)}
                    className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Trang tiếp theo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
