'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface LabMetric {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  alert: 'normal' | 'warning' | 'danger';
}

interface BioCase {
  _id: string;
  patientCode: string;
  patientName: string;
  age: number;
  gender: string;
  testType: string;
  sampleDate: string;
  sampleType: string;
  status: 'pending' | 'tested' | 'diagnosed';
  labMetrics: LabMetric[];
  diagnosis: string;
  doctorNotes: string;
  technicianName: string;
  doctorName: string;
  createdAt: string;
}

interface BioUser {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'bacsy' | 'lab';
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<BioUser | null>(null);
  const [cases, setCases] = useState<BioCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Selected case for quick viewing / details
  const [selectedCase, setSelectedCase] = useState<BioCase | null>(null);

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'view' | 'newCase' | 'editLab' | 'editDiagnosis' | null
  >(null);

  // Form states
  const [newCaseData, setNewCaseData] = useState({
    patientCode: '',
    patientName: '',
    age: 30,
    gender: 'Nam',
    testType: 'Sàng lọc đột biến gen di truyền',
    sampleDate: new Date().toISOString().split('T')[0],
    sampleType: 'Máu toàn phần',
  });

  const [labMetricsInput, setLabMetricsInput] = useState<LabMetric[]>([]);
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [doctorNotesInput, setDoctorNotesInput] = useState('');

  const [isPending, startTransition] = useTransition();

  // Load User & Cases
  useEffect(() => {
    const token = localStorage.getItem('bio_token');
    const storedUser = localStorage.getItem('bio_user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      router.push('/login');
      return;
    }

    fetchCases();
  }, [router]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5002/api/cases');
      if (res.ok) {
        const data = await res.json();
        setCases(data);
        if (data.length > 0 && !selectedCase) {
          setSelectedCase(data[0]);
        }
      }
    } catch (err) {
      console.error('Không thể tải danh sách ca:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bio_token');
    localStorage.removeItem('bio_user');
    router.push('/login');
  };

  // Open Lab Edit Modal
  const handleOpenLabModal = (c: BioCase) => {
    setSelectedCase(c);
    if (c.labMetrics && c.labMetrics.length > 0) {
      setLabMetricsInput(JSON.parse(JSON.stringify(c.labMetrics)));
    } else {
      setLabMetricsInput([
        {
          name: 'Chỉ số ADN / Gen',
          value: '',
          unit: '%',
          referenceRange: 'Âm tính',
          alert: 'normal',
        },
      ]);
    }
    setActiveModal('editLab');
  };

  // Save Lab Metrics
  const handleSaveLabResult = async () => {
    if (!selectedCase) return;
    startTransition(async () => {
      try {
        const res = await fetch(
          `http://localhost:5002/api/cases/${selectedCase._id}/lab-result`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              labMetrics: labMetricsInput,
              technicianName: user?.fullName || 'KTV Lab',
            }),
          }
        );
        if (res.ok) {
          const updated = await res.json();
          setSelectedCase(updated);
          setActiveModal(null);
          await fetchCases();
        } else {
          alert('Lỗi khi cập nhật kết quả lab');
        }
      } catch {
        alert('Lỗi kết nối backend');
      }
    });
  };

  // Open Diagnosis Modal
  const handleOpenDiagnosisModal = (c: BioCase) => {
    setSelectedCase(c);
    setDiagnosisInput(c.diagnosis || '');
    setDoctorNotesInput(c.doctorNotes || '');
    setActiveModal('editDiagnosis');
  };

  // Save Diagnosis
  const handleSaveDiagnosis = async () => {
    if (!selectedCase) return;
    if (!diagnosisInput.trim()) {
      alert('Vui lòng nhập kết luận chẩn đoán');
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(
          `http://localhost:5002/api/cases/${selectedCase._id}/diagnosis`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              diagnosis: diagnosisInput,
              doctorNotes: doctorNotesInput,
              doctorName: user?.fullName || 'BS Chẩn đoán',
            }),
          }
        );
        if (res.ok) {
          const updated = await res.json();
          setSelectedCase(updated);
          setActiveModal(null);
          await fetchCases();
        } else {
          alert('Lỗi khi lưu kết luận bác sĩ');
        }
      } catch {
        alert('Lỗi kết nối backend');
      }
    });
  };

  // Create New Case
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseData.patientCode || !newCaseData.patientName) {
      alert('Vui lòng điền đủ mã và tên bệnh nhân');
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch('http://localhost:5002/api/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCaseData),
        });
        if (res.ok) {
          const created = await res.json();
          setActiveModal(null);
          setSelectedCase(created);
          setNewCaseData({
            patientCode: `BN-2026-00${cases.length + 2}`,
            patientName: '',
            age: 30,
            gender: 'Nam',
            testType: 'Sàng lọc đột biến gen di truyền',
            sampleDate: new Date().toISOString().split('T')[0],
            sampleType: 'Máu toàn phần',
          });
          await fetchCases();
        } else {
          alert('Lỗi tạo ca mới (Mã bệnh nhân có thể đã tồn tại)');
        }
      } catch {
        alert('Lỗi kết nối backend');
      }
    });
  };

  // Delete Case
  const handleDeleteCase = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ca xét nghiệm này?')) return;
    try {
      const res = await fetch(`http://localhost:5002/api/cases/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCases();
        if (selectedCase?._id === id) {
          setSelectedCase(null);
        }
      } else {
        alert('Không thể xóa ca');
      }
    } catch {
      alert('Lỗi kết nối backend');
    }
  };

  // Filtered cases
  const filteredCases = cases.filter((item) => {
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchKeyword =
      !searchKeyword.trim() ||
      item.patientName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.patientCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.testType.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchStatus && matchKeyword;
  });

  const getStatusBadge = (status: BioCase['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Chờ phân tích Lab
          </span>
        );
      case 'tested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            Đã có KQ (Chờ Bác sĩ)
          </span>
        );
      case 'diagnosed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đã hoàn tất chẩn đoán
          </span>
        );
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return { title: 'Quản Trị Viên', icon: '👑', color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'bacsy':
        return { title: 'Bác Sĩ Chẩn Đoán', icon: '🩺', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'lab':
        return { title: 'Kỹ Thuật Viên Lab', icon: '🔬', color: 'text-sky-600 bg-sky-50 border-sky-200' };
      default:
        return { title: 'Thành viên', icon: '👤', color: 'text-slate-600 bg-slate-50 border-slate-200' };
    }
  };

  const currentRole = getRoleLabel(user?.role);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* ================= CỘT TRÁI: LOGO, PROFILE & SIDEBAR QUẢN TRỊ ================= */}
      <div className="w-80 sm:w-96 flex flex-col h-full bg-slate-50 border-r border-slate-200 shrink-0">
        
        {/* Khối Logo & Brand */}
        <div className="p-5 border-b border-slate-200 bg-white flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-sky-500/20">
            🧬
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-normal text-slate-900">
                BIO-RESULT
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-700">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Cổng Quản lý & Trả Kết Quả Sinh Học
            </p>
          </div>
        </div>

        {/* Khối Thông tin Người dùng & Quyền hạn */}
        <div className="p-4 mx-4 my-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tài Khoản Hiện Tại
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${currentRole.color}`}
            >
              <span>{currentRole.icon}</span>
              <span>{currentRole.title}</span>
            </span>
          </div>

          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-slate-900">
              {user?.fullName}
            </h3>
            <p className="text-xs text-sky-600 font-medium">
              @{user?.username}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Phiên làm việc bảo mật
            </span>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Navigation & Menu Section */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Điều Hướng
          </div>

          <button
            onClick={() => setStatusFilter('all')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-sky-100/70 text-sky-800 font-semibold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>📁</span>
              <span>Tất cả hồ sơ</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-700">
              {cases.length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-100/70 text-amber-800 font-semibold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>⏳</span>
              <span>Chờ phân tích Lab</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
              {cases.filter((c) => c.status === 'pending').length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('tested')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'tested'
                ? 'bg-sky-100/70 text-sky-800 font-semibold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>🧪</span>
              <span>Đã có KQ (Chờ Bác sĩ)</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">
              {cases.filter((c) => c.status === 'tested').length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('diagnosed')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'diagnosed'
                ? 'bg-emerald-100/70 text-emerald-800 font-semibold'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span>✅</span>
              <span>Đã hoàn tất chẩn đoán</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
              {cases.filter((c) => c.status === 'diagnosed').length}
            </span>
          </button>
        </div>

        {/* Footer thông số hệ thống */}
        <div className="p-3 border-t border-slate-200 bg-white text-[11px] text-slate-400 flex items-center justify-between">
          <span>Hệ thống: MongoDB Atlas</span>
          <span className="text-emerald-600 font-medium">● Online</span>
        </div>

      </div>

      {/* ================= CỘT PHẢI: KHU VỰC DANH SÁCH CA & THAO TÁC ================= */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
        
        {/* Top Header thanh tìm kiếm & bộ lọc */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Danh Sách Ca Xét Nghiệm
              </h1>
              <p className="text-xs text-slate-500">
                Tổng cộng {cases.length} ca trong hệ thống Bio-Result
              </p>
            </div>

            {/* Nút tiếp nhận ca mới dành cho Lab / Admin */}
            {(user?.role === 'lab' || user?.role === 'admin') && (
              <button
                onClick={() => {
                  setNewCaseData({
                    patientCode: `BN-2026-00${cases.length + 1}`,
                    patientName: '',
                    age: 32,
                    gender: 'Nam',
                    testType: 'Giải trình tự gen đột biến',
                    sampleDate: new Date().toISOString().split('T')[0],
                    sampleType: 'Máu toàn phần',
                  });
                  setActiveModal('newCase');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium shadow-xs shadow-sky-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span> Tiếp nhận ca mới
              </button>
            )}
          </div>

          {/* Ô tìm kiếm & Bộ lọc trạng thái */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm mã BN, họ tên hoặc loại xét nghiệm..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white transition-all"
              />
              <svg
                className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 focus:outline-none focus:border-sky-400"
            >
              <option value="all">Tất cả ({cases.length})</option>
              <option value="pending">Chờ phân tích Lab</option>
              <option value="tested">Đã có KQ (Chờ Bác sĩ)</option>
              <option value="diagnosed">Đã hoàn tất</option>
            </select>

            <button
              onClick={fetchCases}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs"
              title="Làm mới"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Danh sách ca (Dạng bảng danh sách hiện đại) */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Đang tải danh sách ca...</span>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Không có ca xét nghiệm nào phù hợp.
            </div>
          ) : (
            filteredCases.map((c) => {
              const isSelected = selectedCase?._id === c._id;
              return (
                <div
                  key={c._id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-4 transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-sky-50/70 border-l-4 border-l-sky-500'
                      : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded-md">
                        {c.patientCode}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {c.patientName}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({c.gender}, {c.age} tuổi)
                      </span>
                    </div>
                    <div>{getStatusBadge(c.status)}</div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-700 line-clamp-1">
                      {c.testType}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      Mẫu: {c.sampleDate}
                    </span>
                  </div>

                  {/* Hàng nút thao tác riêng theo vai trò */}
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100/80">
                    <div className="text-[11px] text-slate-400">
                      {c.technicianName ? `Lab: ${c.technicianName}` : 'Chưa có KTV'}
                      {c.doctorName ? ` • BS: ${c.doctorName}` : ''}
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* Nút xem chi tiết phiếu */}
                      <button
                        onClick={() => {
                          setSelectedCase(c);
                          setActiveModal('view');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                      >
                        Phiếu KQ
                      </button>

                      {/* Lab / Admin: Nhập / Sửa chỉ số */}
                      {(user?.role === 'lab' || user?.role === 'admin') && (
                        <button
                          onClick={() => handleOpenLabModal(c)}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-medium transition-colors cursor-pointer"
                        >
                          🔬 Nhập KQ Lab
                        </button>
                      )}

                      {/* Bacsy / Admin: Chẩn đoán */}
                      {(user?.role === 'bacsy' || user?.role === 'admin') && (
                        <button
                          onClick={() => handleOpenDiagnosisModal(c)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium transition-colors cursor-pointer"
                        >
                          🩺 Chẩn đoán
                        </button>
                      )}

                      {/* Admin: Xóa ca */}
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteCase(c._id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs transition-colors cursor-pointer"
                          title="Xóa ca"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. Modal: Xem chi tiết phiếu kết quả */}
      {activeModal === 'view' && selectedCase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-sky-50/60">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">
                  Phiếu Kết Quả Xét Nghiệm Sinh Học
                </span>
                <h3 className="text-base font-semibold text-slate-900">
                  {selectedCase.patientName} ({selectedCase.patientCode})
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center border border-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Tuổi / Giới tính</span>
                  <strong className="text-slate-800 font-semibold">{selectedCase.age} tuổi • {selectedCase.gender}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mẫu xét nghiệm</span>
                  <strong className="text-slate-800 font-semibold">{selectedCase.sampleType}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngày lấy mẫu</span>
                  <strong className="text-slate-800 font-semibold">{selectedCase.sampleDate}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Trạng thái</span>
                  <div>{getStatusBadge(selectedCase.status)}</div>
                </div>
              </div>

              {/* Bảng chỉ số kỹ thuật */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <span>🔬</span> Bảng Chỉ Số Phân Tích Kỹ Thuật (Lab)
                </h4>
                {selectedCase.labMetrics && selectedCase.labMetrics.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                        <tr>
                          <th className="p-2.5">Tên chỉ số / Gen</th>
                          <th className="p-2.5">Kết quả đo</th>
                          <th className="p-2.5">Đơn vị</th>
                          <th className="p-2.5">Khoảng tham chiếu</th>
                          <th className="p-2.5">Cảnh báo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedCase.labMetrics.map((m, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-medium text-slate-800">{m.name}</td>
                            <td className="p-2.5 font-semibold text-sky-700">{m.value}</td>
                            <td className="p-2.5 text-slate-500">{m.unit || '—'}</td>
                            <td className="p-2.5 text-slate-500">{m.referenceRange || '—'}</td>
                            <td className="p-2.5">
                              {m.alert === 'danger' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-700">
                                  Nguy cơ / Bất thường
                                </span>
                              )}
                              {m.alert === 'warning' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                                  Lưu ý (VUS)
                                </span>
                              )}
                              {m.alert === 'normal' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                                  Bình thường
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                    Chưa có kết quả phân tích từ phòng Lab.
                  </div>
                )}
                <div className="text-[11px] text-slate-500 text-right">
                  Kỹ thuật viên thực hiện: <strong>{selectedCase.technicianName || 'Chưa cập nhật'}</strong>
                </div>
              </div>

              {/* Kết luận & Lời dặn Bác sĩ */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <span>🩺</span> Kết Luận Chẩn Đoán Của Bác Sĩ
                </h4>
                {selectedCase.diagnosis ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-800 uppercase block">
                        Kết luận lâm sàng:
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {selectedCase.diagnosis}
                      </p>
                    </div>
                    {selectedCase.doctorNotes && (
                      <div className="pt-2 border-t border-emerald-100">
                        <span className="text-[11px] font-semibold text-emerald-800 uppercase block">
                          Lời dặn / Hướng điều trị:
                        </span>
                        <p className="text-slate-600 leading-relaxed">
                          {selectedCase.doctorNotes}
                        </p>
                      </div>
                    )}
                    <div className="text-[11px] text-emerald-800 text-right font-medium pt-1">
                      Bác sĩ ký duyệt: {selectedCase.doctorName || 'BS. Nguyễn Văn A'}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                    Bác sĩ chưa nhập kết luận chẩn đoán cho ca này.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Tiếp nhận ca mới (Lab / Admin) */}
      {activeModal === 'newCase' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <span>➕</span> Tiếp Nhận Ca Xét Nghiệm Mới
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-600 block mb-1">Mã bệnh nhân</label>
                  <input
                    type="text"
                    required
                    value={newCaseData.patientCode}
                    onChange={(e) =>
                      setNewCaseData({ ...newCaseData, patientCode: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-600 block mb-1">Họ tên bệnh nhân</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={newCaseData.patientName}
                    onChange={(e) =>
                      setNewCaseData({ ...newCaseData, patientName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-600 block mb-1">Tuổi</label>
                  <input
                    type="number"
                    value={newCaseData.age}
                    onChange={(e) =>
                      setNewCaseData({ ...newCaseData, age: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-600 block mb-1">Giới tính</label>
                  <select
                    value={newCaseData.gender}
                    onChange={(e) =>
                      setNewCaseData({ ...newCaseData, gender: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-600 block mb-1">Loại xét nghiệm</label>
                <input
                  type="text"
                  required
                  value={newCaseData.testType}
                  onChange={(e) =>
                    setNewCaseData({ ...newCaseData, testType: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-600 block mb-1">Loại mẫu</label>
                  <input
                    type="text"
                    value={newCaseData.sampleType}
                    onChange={(e) =>
                      setNewCaseData({ ...newCaseData, sampleType: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-600 block mb-1">Ngày lấy mẫu</label>
                  <input
                    type="date"
                    value={newCaseData.sampleDate}
                    onChange={(e) =>
                      setNewCaseData({ ...newCaseData, sampleDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium cursor-pointer"
                >
                  {isPending ? 'Đang tạo...' : 'Xác Nhận Tạo Ca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Nhập / Sửa chỉ số xét nghiệm (Lab / Admin) */}
      {activeModal === 'editLab' && selectedCase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-sky-600 uppercase">
                  Dành cho Kỹ Thuật Viên Phòng Lab
                </span>
                <h3 className="text-base font-semibold text-slate-800">
                  Nhập Kết Quả Xét Nghiệm: {selectedCase.patientName}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Danh sách thông số đo lường</span>
                <button
                  type="button"
                  onClick={() =>
                    setLabMetricsInput([
                      ...labMetricsInput,
                      {
                        name: '',
                        value: '',
                        unit: '',
                        referenceRange: 'Âm tính',
                        alert: 'normal',
                      },
                    ])
                  }
                  className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-700 font-medium hover:bg-sky-200 cursor-pointer"
                >
                  + Thêm chỉ số
                </button>
              </div>

              {labMetricsInput.map((metric, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Chỉ số #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setLabMetricsInput(labMetricsInput.filter((_, i) => i !== idx))
                      }
                      className="text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-500 block mb-1">Tên chỉ số / Gen</label>
                      <input
                        type="text"
                        placeholder="vd: Exon 19 Deletion"
                        value={metric.name}
                        onChange={(e) => {
                          const arr = [...labMetricsInput];
                          arr[idx].name = e.target.value;
                          setLabMetricsInput(arr);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Kết quả đo</label>
                      <input
                        type="text"
                        placeholder="vd: Dương tính (25%)"
                        value={metric.value}
                        onChange={(e) => {
                          const arr = [...labMetricsInput];
                          arr[idx].value = e.target.value;
                          setLabMetricsInput(arr);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-sky-700"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Đơn vị</label>
                      <input
                        type="text"
                        placeholder="vd: % hoặc Z-score"
                        value={metric.unit}
                        onChange={(e) => {
                          const arr = [...labMetricsInput];
                          arr[idx].unit = e.target.value;
                          setLabMetricsInput(arr);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Khoảng tham chiếu</label>
                      <input
                        type="text"
                        placeholder="vd: Âm tính"
                        value={metric.referenceRange}
                        onChange={(e) => {
                          const arr = [...labMetricsInput];
                          arr[idx].referenceRange = e.target.value;
                          setLabMetricsInput(arr);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1">Mức độ cảnh báo</label>
                      <select
                        value={metric.alert}
                        onChange={(e: any) => {
                          const arr = [...labMetricsInput];
                          arr[idx].alert = e.target.value;
                          setLabMetricsInput(arr);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200"
                      >
                        <option value="normal">Bình thường</option>
                        <option value="warning">Cảnh báo / Biến thể (VUS)</option>
                        <option value="danger">Bất thường / Nguy cơ cao</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveLabResult}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium cursor-pointer"
              >
                {isPending ? 'Đang lưu...' : 'Lưu Kết Quả & Đổi Thành Đã Có KQ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Chẩn đoán & Ký duyệt (Bác sĩ / Admin) */}
      {activeModal === 'editDiagnosis' && selectedCase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold text-emerald-600 uppercase">
                  Dành cho Bác Sĩ Chẩn Đoán Lâm Sàng
                </span>
                <h3 className="text-base font-semibold text-slate-800">
                  Kết luận ca: {selectedCase.patientName} ({selectedCase.patientCode})
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 text-slate-700">
                <span className="font-semibold text-sky-800 block mb-1">Tóm tắt KQ Lab hiện tại:</span>
                {selectedCase.labMetrics && selectedCase.labMetrics.length > 0 ? (
                  <ul className="list-disc list-inside space-y-0.5">
                    {selectedCase.labMetrics.map((m, i) => (
                      <li key={i}>
                        {m.name}: <strong>{m.value}</strong> ({m.referenceRange})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="italic text-amber-700">Chưa có chỉ số từ Lab</span>
                )}
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Kết luận chẩn đoán lâm sàng <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập kết luận chuyên môn dựa trên các chỉ số gen / sinh học..."
                  value={diagnosisInput}
                  onChange={(e) => setDiagnosisInput(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Lời dặn & Hướng điều trị / Tái khám
                </label>
                <textarea
                  rows={2}
                  placeholder="Nhập lời khuyên dinh dưỡng, dùng thuốc hoặc thời gian tái khám định kỳ..."
                  value={doctorNotesInput}
                  onChange={(e) => setDoctorNotesInput(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveDiagnosis}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs cursor-pointer"
              >
                {isPending ? 'Đang ký duyệt...' : '🩺 Ký Duyệt & Hoàn Tất Ca'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

