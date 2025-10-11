'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { AccountPanel } from '@/components/account/AccountPanel';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * 主布局组件 - WADesk风格
 * 三栏布局：账号面板 + 功能导航 + 主内容
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* 左侧：账号面板 */}
      <div className="w-[280px] flex-shrink-0">
        <AccountPanel />
      </div>

      {/* 中间：功能导航栏 */}
      <div className="w-20 flex-shrink-0">
        <Sidebar />
      </div>

      {/* 右侧：主内容区 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

