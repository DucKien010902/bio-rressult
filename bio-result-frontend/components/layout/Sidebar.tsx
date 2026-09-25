'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Activity,
  FlaskConical,
  FileText,
  Microscope,
  ClipboardList,
  Layers,
  Dna,
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
  { id: 'cell', label: 'Xét nghiệm Cell', icon: Activity },
  { id: 'thinprep', label: 'Xét nghiệm ThinPrep', icon: FlaskConical },
  { id: 'hpv40', label: 'Xét nghiệm HPV 40', icon: FileText },
  { id: 'hpv20', label: 'Xét nghiệm HPV 20', icon: FileText },
  { id: 'hpv23', label: 'Xét nghiệm HPV 23', icon: FileText },
  { id: 'soituoi', label: 'Xét nghiệm Soi tươi', icon: Microscope },
  { id: 'giaiphaubenh', label: 'Giải Phẫu Bệnh', icon: ClipboardList },
  { id: 'combo_hpv20_cell', label: 'Combo: HPV 20 + Cell', icon: Layers },
  { id: 'combo_hpv40_cell', label: 'Combo: HPV 40 + Cell', icon: Layers },
  { id: 'combo_hpv23_cell', label: 'Combo: HPV 23 + Cell', icon: Layers },
  { id: 'combo_hpv20_thinprep', label: 'Combo: HPV 20 + ThinPrep', icon: Layers },
  { id: 'combo_hpv40_thinprep', label: 'Combo: HPV 40 + ThinPrep', icon: Layers },
  { id: 'combo_hpv23_thinprep', label: 'Combo: HPV 23 + ThinPrep', icon: Layers },
];

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

  const handleCategoryClick = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
  };

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-72' : 'w-20'
      } bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 transition-all duration-200 z-30 select-none shadow-2xs`}
    >
      {/* Logo Header */}
      <Link
        href="/"
        className="h-20 px-5 flex items-center gap-3.5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors shrink-0"
      >
        <div className="w-11 h-11 shrink-0 relative flex items-center justify-center">
          <Image
            src="/logo_gentech.png"
            alt="Logo Gentech"
            width={44}
            height={44}
            className="object-contain"
            priority
          />
        </div>
        {sidebarOpen && (
          <div className="leading-none flex flex-col">
            <span className="font-black text-[#003399] tracking-tight text-lg">
              GENTECH
            </span>
            <span className="text-xs font-bold text-slate-400 tracking-wider mt-1">
              VIỆT NAM
            </span>
          </div>
        )}
      </Link>

      {/* Navigation Categories */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 custom-scrollbar">
        {MENU_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = pathname === '/' && activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              title={cat.label}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer relative ${
                isActive
                  ? 'text-[#0070f3] bg-sky-50/90 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1.5 bg-[#0070f3] rounded-r-full" />
              )}

              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-[#0070f3]' : 'text-slate-500'
                }`}
              />

              {sidebarOpen && (
                <span className="truncate text-left font-medium leading-tight text-[13.5px] sm:text-sm">
                  {cat.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom User Profile Pin */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 truncate">
          <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 text-[#003399] flex items-center justify-center font-bold text-sm shrink-0">
            {currentUser?.fullName?.charAt(0) || 'A'}
          </div>
          {sidebarOpen && (
            <div className="truncate">
              <div className="text-sm font-bold text-slate-900 truncate leading-tight">
                {currentUser?.fullName || 'Admin phòng Lab'}
              </div>
              <div className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                {currentUser?.role === 'admin'
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
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
