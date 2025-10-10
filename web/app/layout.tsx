'use client';

import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <title>WhatsApp Web - 自动回复系统</title>
        <meta name="description" content="WhatsApp Web AI 自动回复养号系统" />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
