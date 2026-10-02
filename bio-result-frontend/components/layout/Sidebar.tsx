'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PlusCircle,
  BarChart3,
  Activity,
  FlaskConical,
  FileText,
  Microscope,
  ClipboardList,
  Layers,
  LayoutGrid,
  LogOut,
} from 'lucide-react';

export interface CategoryItem {
  id: string;
  label: string;
  icon: any;
  isSpecial?: boolean;
}

export const MENU_CATEGORIES: CategoryItem[] = [
  { id: 'dashboard', label: 'Báo cáo & Thống kê', icon: BarChart3, isSpecial: true },
  { id: 'all', label: 'Tất cả dịch vụ', icon: LayoutGrid },
  { id: 'cell', label: 'Xét nghiệm Cell', icon: Activity },
  { id: 'thinprep', label: 'Xét nghiệm ThinPrep', icon: FlaskConical },
  { id: 'hpv40', label: 'Xét nghiệm HPV 40', icon: FileText },
  { id: 'hpv20', label: 'Xét nghiệm HPV 20', icon: FileText },
  { id: 'hpv23', label: 'Xét nghiệm HPV 23', icon: FileText },
  { id: 'hpv24', label: 'Xét nghiệm HPV 24', icon: FileText },
  { id: 'soituoi', label: 'Xét nghiệm Soi tươi', icon: Microscope },
  { id: 'giaiphaubenh', label: 'Giải Phẫu Bệnh', icon: ClipboardList },
  { id: 'giaiphaubenh_mobenh', label: 'Giải Phẫu Bệnh - Mô Bệnh', icon: ClipboardList },
  { id: 'giaiphaubenh_tebaohoc', label: 'Giải Phẫu Bệnh - Tế Bào Học', icon: ClipboardList },
  { id: 'combo_hpv20_cell', label: 'Combo: HPV 20 + Cell', icon: Layers },
  { id: 'combo_hpv40_cell', label: 'Combo: HPV 40 + Cell', icon: Layers },
  { id: 'combo_hpv23_cell', label: 'Combo: HPV 23 + Cell', icon: Layers },
  { id: 'combo_hpv20_thinprep', label: 'Combo: HPV 20 + ThinPrep', icon: Layers },
  { id: 'combo_hpv40_thinprep', label: 'Combo: HPV 40 + ThinPrep', icon: Layers },
  { id: 'combo_hpv23_thinprep', label: 'Combo: HPV 23 + ThinPrep', icon: Layers },
];

export const COMBO_REQUIRED_MAP: Record<string, [string, string]> = {
  combo_hpv20_cell: ['hpv20', 'cell'],
  combo_hpv40_cell: ['hpv40', 'cell'],
  combo_hpv23_cell: ['hpv23', 'cell'],
  combo_hpv20_thinprep: ['hpv20', 'thinprep'],
  combo_hpv40_thinprep: ['hpv40', 'thinprep'],
  combo_hpv23_thinprep: ['hpv23', 'thinprep'],
};

export function isCategoryPermitted(catId: string, user?: any): boolean {
  if (!user) return true;
  const role = user.role;
  if (
    role === 'admin' ||
    role === 'superadmin' ||
    user.username === 'admin' ||
    user.username === 'superadmin'
  ) {
    return true;
  }
  // Các mục điều hướng chung luôn hiển thị
  if (catId === 'dashboard' || catId === 'all') {
    return true;
  }
  const allowed: string[] = Array.isArray(user.allowedCategories) ? user.allowedCategories : [];
  if (allowed.length === 0) {
    return false;
  }
  // Nếu là gói Combo: BẮT BUỘC CẢ 2 DỊCH VỤ THÀNH PHẦN PHẢI NẰM TRONG allowedCategories
  if (catId.startsWith('combo_')) {
    const required = COMBO_REQUIRED_MAP[catId];
    if (!required) return false;
    return allowed.includes(required[0]) && allowed.includes(required[1]);
  }
  // Dịch vụ đơn lẻ: phải nằm trong allowedCategories
  return allowed.includes(catId);
}

interface SidebarProps {
  sidebarOpen: boolean;
  activeCategory?: string;
  onSelectCategory?: (id: string) => void;
  currentUser?: any;
  onLogout?: () => void;
}

export default function Sidebar({
  sidebarOpen,
  activeCategory = 'hpv40',
  onSelectCategory,
  currentUser,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();

  const [effectiveUser, setEffectiveUser] = React.useState<any>(currentUser || null);

  React.useEffect(() => {
    if (currentUser) {
      setEffectiveUser(currentUser);
    } else if (typeof window !== 'undefined') {
      try {
        const u = JSON.parse(localStorage.getItem('bio_user') || 'null');
        setEffectiveUser(u);
      } catch {}
    }
  }, [currentUser]);

  // Luôn lắng nghe nếu có sự thay đổi quyền từ máy chủ hoặc sự kiện storage
  React.useEffect(() => {
    const handleStorageChange = () => {
      try {
        const u = JSON.parse(localStorage.getItem('bio_user') || 'null');
        if (u) setEffectiveUser(u);
      } catch {}
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bio_user_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bio_user_updated', handleStorageChange);
    };
  }, []);

  const isSuperAdmin =
    effectiveUser?.role === 'superadmin' || effectiveUser?.username === 'superadmin';
  const isAdmin =
    effectiveUser?.role === 'admin' || effectiveUser?.username === 'admin' || isSuperAdmin;
  const isLab = effectiveUser?.role === 'lab';
  // Chỉ Admin, Super Admin và tài khoản nguồn (lab) mới được tạo mẫu
  const canCreate = isAdmin || isLab;

  // Lọc danh mục theo quyền hạn của tài khoản bác sĩ hoặc nguồn
  const visibleCategories = React.useMemo(() => {
    return MENU_CATEGORIES.filter((cat) => isCategoryPermitted(cat.id, effectiveUser));
  }, [effectiveUser]);

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-[255px]' : 'w-16'
      } bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 transition-all duration-200 z-30 select-none shadow-2xs`}
    >
      {/* Logo Header */}
      <Link
        href="/"
        className="h-[74px] px-4.5 flex items-center gap-3.5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors shrink-0"
      >
        <div className="w-11 h-11 shrink-0 relative flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Logo GENHD"
            width={44}
            height={44}
            className="object-contain"
            priority
          />
        </div>
        {sidebarOpen && (
          <div className="leading-tight flex flex-col">
            <span className="font-black text-[#003399] tracking-tight text-[18px]">GENHD</span>
            <span className="text-[11px] font-black text-slate-500 tracking-wider mt-0.5">
              VIỆT NAM
            </span>
          </div>
        )}
      </Link>

      {/* Nút Tạo phiếu mới */}
      {canCreate && (
        <div className="px-3 pt-3 pb-1.5 shrink-0">
          <Link
            href="/results/new"
            className={`flex items-center justify-center gap-2.5 w-full py-2.5 bg-[#0070f3] hover:bg-[#005bb5] active:scale-[0.98] text-white font-extrabold text-[13.5px] rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer ${
              pathname === '/results/new' ? 'ring-2 ring-offset-2 ring-[#0070f3]' : ''
            } ${sidebarOpen ? 'px-3.5' : 'px-2'}`}
            title="Tạo phiếu mới"
          >
            <PlusCircle className="w-4.5 h-4.5 shrink-0 stroke-[2.5]" />
            {sidebarOpen && <span className="tracking-wide">Tạo phiếu mới</span>}
          </Link>
        </div>
      )}

      {/* Navigation Categories — dùng Link để hoạt động từ mọi trang kể cả settings */}
      <div className="flex-1 overflow-y-auto py-2.5 px-2.5 space-y-1 custom-scrollbar">
        {visibleCategories.map((cat) => {
          const Icon = cat.icon;
          // Active khi ở trang chủ VÀ đúng category
          const isActive = pathname === '/' && activeCategory === cat.id;

          return (
            <Link
              key={cat.id}
              href={`/?category=${cat.id}`}
              onClick={() => onSelectCategory?.(cat.id)}
              title={cat.label}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-bold transition-all cursor-pointer relative ${
                isActive
                  ? 'text-[#0070f3] bg-sky-50/90 font-black shadow-2xs'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#0070f3] rounded-r-full" />
              )}
              <Icon
                className={`w-[19px] h-[19px] shrink-0 transition-colors ${
                  isActive ? 'text-[#0070f3]' : 'text-slate-600'
                }`}
              />
              {sidebarOpen && (
                <span className="truncate text-left leading-tight text-[13.5px]">
                  {cat.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom User Profile Pin */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 truncate">
          <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 text-[#003399] flex items-center justify-center font-black text-xs shrink-0">
            {currentUser?.fullName?.charAt(0) || 'A'}
          </div>
          {sidebarOpen && (
            <div className="truncate">
              <div className="text-[13px] font-black text-slate-900 truncate leading-tight">
                {currentUser?.fullName || 'Admin phòng Lab'}
              </div>
              <div className="text-xs text-slate-600 truncate mt-0.5 font-bold">
                {isSuperAdmin
                  ? 'Super Admin'
                  : isAdmin
                  ? 'Quản lý Lab'
                  : currentUser?.role === 'doctor'
                  ? 'Bác sĩ đọc KQ'
                  : 'Đơn vị gửi mẫu'}
              </div>
            </div>
          )}
        </div>
        {sidebarOpen && onLogout && (
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        )}
      </div>
    </aside>
  );
}
