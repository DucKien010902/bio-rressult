import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AuthFetchInterceptor from '@/components/common/AuthFetchInterceptor';
import { ToastProvider } from '@/components/common/Toast';

const plusJakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bio-result-frontend.vercel.app'),
  title: 'GENHD - Hệ Thống Quản Lý & Xuất Kết Quả Xét Nghiệm',
  description:
    'Hệ thống nhập liệu, quản lý và xuất kết quả xét nghiệm GENHD: CELL, HPV 40 Types, HPV 20 Types, ThinPrep, Soi tươi, Giải phẫu bệnh',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'GENHD - Hệ Thống Quản Lý & Xuất Kết Quả Xét Nghiệm',
    description:
      'Hệ thống nhập liệu, quản lý và xuất kết quả xét nghiệm GENHD: CELL, HPV 40 Types, HPV 20 Types, ThinPrep, Soi tươi, Giải phẫu bệnh',
    url: 'https://bio-result-frontend.vercel.app',
    siteName: 'GENHD',
    images: [
      {
        url: '/logo.png',
        width: 600,
        height: 600,
        alt: 'Logo GENHD',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${plusJakarta.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta property="og:image" content="https://bio-result-frontend.vercel.app/logo.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#f1f5f9] text-slate-800">
        <ToastProvider>
          <AuthFetchInterceptor />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
