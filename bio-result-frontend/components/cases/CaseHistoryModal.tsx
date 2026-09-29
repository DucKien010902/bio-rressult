'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  History,
  X,
  User,
  Clock,
  ArrowRight,
  PlusCircle,
  FileEdit,
  CheckCircle2,
  FileCheck,
  Undo2,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  Loader2,
  Activity,
  Layers,
} from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '@/lib/config';
import { CaseItem } from './CaseTable';

interface HistoryChange {
  truong: string;
  fieldKey: string;
  giaTriCu?: any;
  giaTriMoi?: any;
}

interface HistoryItem {
  id?: string;
  nguoiThucHien: string;
  username?: string;
  vaiTro?: string;
  thoiGian: string;
  hanhDong: string;
  moTa: string;
  chiTiet?: HistoryChange[];
}

interface CaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CaseItem | null;
}

export default function CaseHistoryModal({
  isOpen,
  onClose,
  caseItem,
}: CaseHistoryModalProps) {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  // Lấy lịch sử thao tác khi mở modal
  useEffect(() => {
    if (!isOpen || !caseItem?._id) {
      setHistoryList([]);
      setSearchTerm('');
      setActionFilter('all');
      return;
    }

    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(getApiUrl(`/cases/${caseItem._id}/history`), {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setHistoryList(Array.isArray(data) ? data : []);
          }
        } else {
          // Fallback từ trường trong caseItem nếu có
          const localHistory =
            (caseItem as any).lichSuThaoTac || (caseItem as any).lichSuChinhSua || [];
          if (isMounted) {
            setHistoryList(Array.isArray(localHistory) ? localHistory : []);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải lịch sử thao tác:', err);
        const localHistory =
          (caseItem as any).lichSuThaoTac || (caseItem as any).lichSuChinhSua || [];
        if (isMounted) {
          setHistoryList(Array.isArray(localHistory) ? localHistory : []);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [isOpen, caseItem?._id]);

  // Bắt phím Escape để đóng modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Định dạng ngày giờ chi tiết
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '--/--/----';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      const secs = String(d.getSeconds()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${hours}:${mins}:${secs} - ${day}/${month}/${year}`;
    } catch {
      return isoString;
    }
  };

  // Tính khoảng thời gian tương đối
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const diffMs = Date.now() - d.getTime();
      if (diffMs < 0) return 'Vừa xong';
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return 'Vừa xong';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays} ngày trước`;
      return '';
    } catch {
      return '';
    }
  };

  // Phân loại icon và màu sắc theo hành động
  const getActionBadge = (hanhDong?: string) => {
    switch (hanhDong) {
      case 'create':
        return {
          label: 'Tạo phiếu mới',
          icon: PlusCircle,
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dotClass: 'bg-emerald-500 ring-emerald-100',
        };
      case 'accept':
        return {
          label: 'Tiếp nhận mẫu',
          icon: CheckCircle2,
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          dotClass: 'bg-blue-500 ring-blue-100',
        };
      case 'sign':
        return {
          label: 'Ký duyệt kết quả',
          icon: FileCheck,
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
          dotClass: 'bg-purple-500 ring-purple-100',
        };
      case 'release':
        return {
          label: 'Trả kết quả (Đóng dấu)',
          icon: CheckCircle2,
          badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
          dotClass: 'bg-teal-500 ring-teal-100',
        };
      case 'cancel_release':
        return {
          label: 'Hủy trả kết quả',
          icon: Undo2,
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          dotClass: 'bg-amber-500 ring-amber-100',
        };
      case 'status_change':
        return {
          label: 'Đổi trạng thái',
          icon: RefreshCw,
          badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
          dotClass: 'bg-sky-500 ring-sky-100',
        };
      case 'update':
      default:
        return {
          label: 'Chỉnh sửa thông tin',
          icon: FileEdit,
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          dotClass: 'bg-slate-500 ring-slate-100',
        };
    }
  };

  // Badge vai trò người thao tác
  const getRoleBadge = (vaiTro?: string) => {
    switch (vaiTro?.toLowerCase()) {
      case 'admin':
      case 'superadmin':
        return { label: 'Quản trị viên (Admin)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'doctor':
      case 'bacsy':
        return { label: 'Bác sĩ đọc KQ', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'lab':
        return { label: 'Nguồn gửi mẫu', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: vaiTro || 'Người dùng', color: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
  };

  // Lọc lịch sử theo tìm kiếm & bộ lọc hành động
  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      if (actionFilter !== 'all' && item.hanhDong !== actionFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const kw = searchTerm.toLowerCase();
        const matchUser = item.nguoiThucHien?.toLowerCase().includes(kw);
        const matchDesc = item.moTa?.toLowerCase().includes(kw);
        const matchField = item.chiTiet?.some(
          (c) =>
            c.truong?.toLowerCase().includes(kw) ||
            String(c.giaTriCu || '').toLowerCase().includes(kw) ||
            String(c.giaTriMoi || '').toLowerCase().includes(kw)
        );
        return matchUser || matchDesc || matchField;
      }
      return true;
    });
  }, [historyList, actionFilter, searchTerm]);

  if (!isOpen || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/15">
              <History className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Nhật ký & Lịch sử thao tác
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-bold font-mono bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-md">
                  {caseItem.maSo}
                </span>
                <span className="px-2 py-0.5 text-[11px] font-medium bg-white/10 text-slate-200 rounded-md">
                  {caseItem.hoTen}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                <span>Dịch vụ: <strong className="text-white">{caseItem.loaiXetNghiem?.toUpperCase()}</strong></span>
                <span>•</span>
                <span>Đơn vị: <strong className="text-white">{caseItem.donVi || 'Trực tiếp'}</strong></span>
                <span>•</span>
                <span>Tổng số bản ghi: <strong className="text-amber-300">{historyList.length}</strong></span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOOLBAR FILTER & SEARCH */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo người thực hiện, trường sửa, giá trị cũ/mới..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" />
              Lọc thao tác:
            </span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:outline-hidden focus:border-blue-500 text-xs cursor-pointer"
            >
              <option value="all">Tất cả ({historyList.length})</option>
              <option value="create">Tạo phiếu</option>
              <option value="update">Chỉnh sửa</option>
              <option value="accept">Tiếp nhận mẫu</option>
              <option value="sign">Ký duyệt KQ</option>
              <option value="release">Trả kết quả</option>
              <option value="status_change">Đổi trạng thái</option>
            </select>
          </div>
        </div>

        {/* BODY TIMELINE */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Đang tải nhật ký thao tác...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-3">
                <History className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {searchTerm || actionFilter !== 'all'
                  ? 'Không tìm thấy thao tác nào phù hợp với bộ lọc'
                  : 'Chưa có nhật ký thao tác nào được ghi nhận'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Mọi hành động tạo đơn, sửa trường thông tin bệnh nhân, nhập kết quả, tiếp nhận mẫu và ký duyệt sẽ được lưu trữ tự động tại đây.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {filteredHistory.map((item, index) => {
                const actionInfo = getActionBadge(item.hanhDong);
                const roleInfo = getRoleBadge(item.vaiTro);
                const ActionIcon = actionInfo.icon;
                const relativeTime = getRelativeTime(item.thoiGian);

                return (
                  <div key={item.id || index} className="relative group">
                    {/* Node trên trục timeline */}
                    <div
                      className={`absolute -left-[27px] top-1.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-xs ring-4 ${actionInfo.dotClass} text-white`}
                    >
                      <ActionIcon className="w-3 h-3" />
                    </div>

                    {/* Khung nội dung sự kiện */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden">
                      {/* Tiêu đề & Thông tin người sửa */}
                      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${actionInfo.badgeClass}`}
                          >
                            {actionInfo.label}
                          </span>
                          <span className="font-semibold text-slate-800 text-sm">
                            {item.moTa || actionInfo.label}
                          </span>
                        </div>

                        {/* Thời gian */}
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{formatDateTime(item.thoiGian)}</span>
                          {relativeTime && (
                            <span className="text-[11px] text-slate-400 font-sans">
                              ({relativeTime})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Người thực hiện & Chi tiết trường */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Người thực hiện:</span>
                          <strong className="text-slate-900 font-semibold">
                            {item.nguoiThucHien || 'Hệ thống'}
                          </strong>
                          {item.username && (
                            <span className="text-slate-400 font-mono text-[11px]">
                              (@{item.username})
                            </span>
                          )}
                          <span
                            className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleInfo.color}`}
                          >
                            {roleInfo.label}
                          </span>
                        </div>

                        {/* Bảng chi tiết các trường bị chỉnh sửa */}
                        {item.chiTiet && item.chiTiet.length > 0 && (
                          <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200">
                                  <th className="px-3 py-2 w-1/4">Trường thông tin</th>
                                  <th className="px-3 py-2 w-[35%]">Giá trị trước</th>
                                  <th className="px-2 py-2 w-[5%] text-center"></th>
                                  <th className="px-3 py-2 w-[35%]">Giá trị sau khi sửa</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {item.chiTiet.map((ch, cIdx) => (
                                  <tr
                                    key={cIdx}
                                    className="hover:bg-slate-50/80 transition-colors"
                                  >
                                    <td className="px-3 py-2 font-medium text-slate-800">
                                      <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 text-[11px] font-semibold">
                                        {ch.truong}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-slate-600 font-mono text-[11px] break-all">
                                      {ch.giaTriCu ? (
                                        <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100 inline-block line-through opacity-85">
                                          {String(ch.giaTriCu)}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic">
                                          (Trống)
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-2 py-2 text-center text-slate-400">
                                      <ArrowRight className="w-3.5 h-3.5 inline-block text-blue-500" />
                                    </td>
                                    <td className="px-3 py-2 text-slate-900 font-mono text-[11px] font-medium break-all">
                                      <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 inline-block font-semibold">
                                        {String(ch.giaTriMoi || '(Để trống)')}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Mọi thay đổi được bảo mật và theo dõi theo tiêu chuẩn kiểm toán Lab.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
