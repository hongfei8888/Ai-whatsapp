'use client';

import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/lib/theme-context';
import { AccountProvider } from '@/lib/account-context';
import { useAccountHotkeys } from '@/hooks/useAccountHotkeys';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

// 内部组件以使用 hooks
function AppContent({ children }: { children: React.ReactNode }) {
  // 启用全局快捷键
  useAccountHotkeys();
  
  return <>{children}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <title>WhatsApp Web - 自动回复系统</title>
        <meta name="description" content="WhatsApp Web AI 自动回复养号系统" />
        <style dangerouslySetInnerHTML={{ __html: `
          * {
            transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
          }
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        <ThemeProvider>
          <AccountProvider>
            <AppContent>{children}</AppContent>
            <Toaster position="top-right" richColors />
          </AccountProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
