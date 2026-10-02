import { getApiUrl, getAuthHeaders } from './config';

export type DoctorOption = {
  _id?: string;
  username: string;
  fullName: string;
  donVi?: string;
  role?: string;
};

export const DEFAULT_DOCTOR_LIST: DoctorOption[] = [
  { username: 'bacsi_hung', fullName: 'BS CK1 PHẠM THẾ HÙNG', donVi: 'Khoa Xét Nghiệm - GPB' },
  { username: 'bacsi_truc', fullName: 'BSCK1 . Nguyễn Trung Trực', donVi: 'Khoa Tế Bào Học' },
  { username: 'bacsi_duong', fullName: 'TS . BS Nguyễn Khánh Dương', donVi: 'Khoa Tế Bào Học' },
  { username: 'bacsi_lanh', fullName: 'TS.BS Nguyễn Sỹ Lánh', donVi: 'Khoa GPB & Tế Bào' },
  { username: 'bacsi_lanh2', fullName: 'TS.BS NGUYỄN SỸ LÁNH', donVi: 'Khoa Xét Nghiệm & Tế Bào' },
  { username: 'bacsi_son', fullName: 'ThS.BSNT Trịnh Ngọc Sơn', donVi: 'Khoa Giải Phẫu Bệnh' },
];

/**
 * Tải danh sách bác sĩ thực tế từ hệ thống (kết hợp cache localStorage)
 */
export async function fetchDoctorsList(): Promise<DoctorOption[]> {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem('bio_doctors_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const hasOutdatedDoc = parsed.some(
          (d: any) =>
            d.username === 'bacsi_theduong' ||
            (d.fullName && (d.fullName.includes('Văn Trực') || d.fullName.includes('THẾ ĐƯƠNG')))
        );
        if (Array.isArray(parsed) && parsed.length >= 5 && !hasOutdatedDoc) {
          // Trả về cache ngay và ngầm cập nhật phiên bản mới nhất
          updateDoctorsCache();
          return parsed;
        }
      } catch {}
    }
  }

  return updateDoctorsCache();
}

async function updateDoctorsCache(): Promise<DoctorOption[]> {
  try {
    const res = await fetch(getApiUrl('/users/doctors'), {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('bio_doctors_cache', JSON.stringify(data));
        }
        return data;
      }
    }
  } catch (err) {
    console.warn('[Doctors] Sử dụng danh sách bác sĩ mặc định do chưa tải được API:', err);
  }
  return DEFAULT_DOCTOR_LIST;
}
