'use client';

import { useEffect } from 'react';
import { API_BASE_URL } from '@/lib/config';

export default function AuthFetchInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;

    // Tự động làm mới thông tin quyền allowedCategories từ máy chủ khi vào trang
    const token = localStorage.getItem('bio_token');
    if (token) {
      originalFetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((freshUser) => {
          if (freshUser && freshUser.username) {
            try {
              const oldUserStr = localStorage.getItem('bio_user');
              const oldUser = oldUserStr ? JSON.parse(oldUserStr) : {};
              const merged = { ...oldUser, ...freshUser };
              localStorage.setItem('bio_user', JSON.stringify(merged));
              window.dispatchEvent(new Event('bio_user_updated'));
            } catch {}
          }
        })
        .catch(() => {});
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else if (input && typeof input === 'object' && 'url' in input) {
        url = (input as Request).url;
      }

      // Tự động gắn Authorization token & thông tin user cho mọi request gọi tới backend
      if (url.includes(API_BASE_URL) || url.includes('/api/')) {
        const token = localStorage.getItem('bio_token');
        const userStr = localStorage.getItem('bio_user');

        const headers = new Headers(
          init?.headers || (input instanceof Request ? input.headers : undefined)
        );

        if (token && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        if (userStr && !headers.has('X-User')) {
          try {
            const u = JSON.parse(userStr);
            if (u.username) {
              headers.set('X-User', u.username);
            }
          } catch {}
        }

        return originalFetch(input, {
          ...init,
          headers,
        });
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
