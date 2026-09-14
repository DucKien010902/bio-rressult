import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AuthFetchInterceptor from '@/components/common/AuthFetchInterceptor';

const plusJakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  title: 'GenTech - Hệ Thống Quản Lý & Xuất Kết Quả Xét Nghiệm',
  description:
    'Hệ thống nhập liệu, quản lý và xuất kết quả xét nghiệm GenTech: CELL, HPV 40 Types, HPV 20 Types, ThinPrep, Soi tươi, Giải phẫu bệnh',
  icons: {
    icon: '/logo_gentech.png',
    shortcut: '/logo_gentech.png',
    apple: '/logo_gentech.png',
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
        <link rel="icon" href="/logo_gentech.png" type="image/png" />
        <link rel="shortcut icon" href="/logo_gentech.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo_gentech.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#f1f5f9] text-slate-800">
        <AuthFetchInterceptor />
        {children}
      </body>
    </html>
  );
}
