import { getApiUrl } from './config';

export interface DownloadCasePdfOptions {
  caseId: string;
  templateId?: string;
  patientName?: string;
  maSo?: string;
}

/**
 * Tải trực tiếp file PDF kết quả xét nghiệm về máy người dùng
 * KHÔNG mở tab mới (no window.open), tải ngay trên trang hiện tại thông qua Blob stream.
 */
export async function downloadCasePdf({
  caseId,
  templateId,
  patientName,
  maSo,
}: DownloadCasePdfOptions): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bio_token') || '' : '';
  const params = new URLSearchParams();
  if (token) params.set('token', token);
  if (templateId) params.set('template', templateId);
  params.set('download', '1');

  const url = getApiUrl(`/cases/${caseId}/export-pdf?${params.toString()}`);

  const res = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    let errMsg = `Tải PDF thất bại (Mã lỗi: ${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.message) errMsg = errJson.message;
    } catch {}
    throw new Error(errMsg);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);

  // Tạo tên file tải về đẹp mắt và an toàn
  const safeMaSo = maSo ? maSo.replace(/[/\\?%*:|"<>]/g, '_') : caseId;
  const safeName = patientName
    ? `_${patientName.trim().replace(/\s+/g, '_').replace(/[/\\?%*:|"<>]/g, '')}`
    : '';
  const fileName = `KQ_${safeMaSo}${safeName}.pdf`;

  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  // Dọn dẹp DOM và giải phóng bộ nhớ blob URL
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    window.URL.revokeObjectURL(blobUrl);
  }, 300);
}

export interface DownloadCasesExcelOptions {
  category?: string;
  month?: string; // 'all' hoặc 'YYYY-MM'
  doctor?: string;
  donVi?: string;
}

/**
 * Tải trực tiếp file Excel (CSV UTF-8 BOM) danh sách ca bệnh về máy
 */
export async function downloadCasesExcel({
  category = 'all',
  month = 'all',
  doctor = '',
  donVi = '',
}: DownloadCasesExcelOptions): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bio_token') || '' : '';
  const params = new URLSearchParams();
  if (token) params.set('token', token);
  if (category) params.set('category', category);
  if (month) params.set('month', month);
  if (doctor) params.set('doctor', doctor);
  if (donVi) params.set('donVi', donVi);

  const url = getApiUrl(`/cases/export-excel?${params.toString()}`);

  const res = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    let errMsg = `Tải file Excel thất bại (Mã lỗi: ${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.message) errMsg = errJson.message;
    } catch {}
    throw new Error(errMsg);
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);

  const cleanCategory = category || 'all';
  const cleanMonth = month || 'all';
  const fileName = `Danh_sach_ca_${cleanCategory}_${cleanMonth}.xlsx`;

  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    window.URL.revokeObjectURL(blobUrl);
  }, 300);
}
