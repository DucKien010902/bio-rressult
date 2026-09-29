import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // 1. Nếu ở local có khai báo NEXT_PUBLIC_API_URL (VD: http://localhost:5003/api) thì chuyển tiếp về local
    // 2. Nếu ở Vercel Production thì mặc định chuyển tiếp về Render và giấu kín domain
    const envApi = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL;
    let target = 'https://bio-rressult.onrender.com/api';

    if (envApi) {
      target = envApi.endsWith('/api') ? envApi : `${envApi.replace(/\/$/, '')}/api`;
    }

    return [
      {
        source: '/api/:path*',
        destination: `${target}/:path*`,
      },
    ];
  },
};

export default nextConfig;
