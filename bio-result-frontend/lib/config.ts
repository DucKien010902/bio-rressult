// Gọi về proxy /api trên cùng domain của frontend (giấu URL backend OnRender)
export const API_BASE_URL = '/api';

/**
 * Trả về URL API chuẩn hóa dạng /api/...
 */
export const getApiUrl = (path: string = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/api/')) {
    return cleanPath;
  }
  return `/api${cleanPath}`;
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
