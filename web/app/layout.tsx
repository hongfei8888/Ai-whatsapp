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
      // 先检查WhatsApp服务状态
      const status = await api.getStatus();
      console.log('WhatsApp服务状态:', status);
      
      if (status.status === 'QR' || status.status === 'INITIALIZING') {
        // 如果已经在显示QR码或初始化中，不需要重复启动
        console.log('WhatsApp服务已经在运行');
      } else if (status.status === 'DISCONNECTED' || status.status === 'FAILED') {
        // 如果服务离线或失败，启动登录流程
        console.log('启动新的登录流程');
        await api.startLogin();
      } else {
        // 其他状态（如READY），不需要启动
        console.log('WhatsApp服务状态:', status.status);
      }
    } catch (error) {
      console.error('启动登录失败:', error);
    }
  };

  const handleRefresh = () => {
    // 刷新所有页面数据
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
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
