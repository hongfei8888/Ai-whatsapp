'use client';

import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

import './globals.css';
import AppBar from '@/components/layout/AppBar';
import { api } from '@/lib/api';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

// 样式字典
const S = {
  container: { maxWidth: 1200, margin: "0 auto", padding: "0 24px" }
};

// Note: Metadata cannot be exported from Client Components
// Metadata is now handled by the parent Server Component

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const handleAddAccount = async () => {
    try {
      await api.startLogin();
      console.log('开始登录流程');
      // 这里可以打开一个对话框显示二维码
      // TODO: 实现二维码显示对话框
    } catch (error) {
      console.error('启动登录失败:', error);
    }
  };

  const handleRefresh = () => {
    // 刷新所有页面数据
    window.location.reload();
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif' }}>
        <AppBar onAddAccount={handleAddAccount} onRefresh={handleRefresh} />
        <div style={S.container}>
          {children}
        </div>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
