export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

/**
 * Trả về URL API chuẩn chuẩn hóa (không có dấu / ở cuối)
 */
export const getApiUrl = (path: string = '') => {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Tự động tạo headers có chứa Bearer Token JWT cho các request API
 */
export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bio_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};
