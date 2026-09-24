'use client';

import { useEffect } from 'react';
import { API_BASE_URL } from '@/lib/config';

export default function AuthFetchInterceptor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;

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
