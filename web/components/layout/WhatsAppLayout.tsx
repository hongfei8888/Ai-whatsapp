'use client';

import { ReactNode } from 'react';

// WhatsApp Web 风格的主布局组件
// 三栏设计：左侧功能导航 + 中间列表 + 右侧内容

interface WhatsAppLayoutProps {
  // 左侧功能导航栏
  sidebar?: ReactNode;
  // 中间列表区域
  listPanel?: ReactNode;
  // 右侧主内容区
  mainContent?: ReactNode;
  // 是否隐藏列表面板（某些页面可能不需要）
  hideListPanel?: boolean;
}

// WhatsApp Web 配色方案 - 明亮主题
export const WhatsAppColors = {
  // 明亮主题
  background: '#f0f2f5',
  panelBackground: '#ffffff',
  sidebarBackground: '#ffffff',
  border: '#e9edef',
  
  // 文字颜色
  textPrimary: '#111b21',
  textSecondary: '#667781',
  textTertiary: '#8696a0',
  
  // 强调色
  accent: '#00a884',
  accentHover: '#06cf9c',
  accentDark: '#008069',
  
  // 消息气泡
  messageSent: '#d9fdd3',
  messageReceived: '#ffffff',
  
  // 交互状态
  hover: '#f5f6f6',
  active: '#e9edef',
  selected: '#e9edef',
  
  // 其他
  divider: '#e9edef',
  inputBackground: '#f0f2f5',
  success: '#00a884',
  warning: '#f39c12',
  error: '#e74c3c',
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: WhatsAppColors.background,
    fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Lucida Grande, Arial, Ubuntu, Cantarell, Fira Sans, sans-serif',
    overflow: 'hidden',
  },
  sidebar: {
    width: '80px',
    backgroundColor: WhatsAppColors.sidebarBackground,
    borderRight: `1px solid ${WhatsAppColors.border}`,
    display: 'flex',
    flexDirection: 'column' as const,
    flexShrink: 0,
  },
  listPanel: {
    width: '400px',
    backgroundColor: WhatsAppColors.panelBackground,
    borderRight: `1px solid ${WhatsAppColors.border}`,
    display: 'flex',
    flexDirection: 'column' as const,
    flexShrink: 0,
  },
  mainContent: {
    flex: 1,
    backgroundColor: WhatsAppColors.background,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: WhatsAppColors.textSecondary,
    gap: '20px',
  },
  emptyIcon: {
    fontSize: '64px',
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: '32px',
    fontWeight: '300' as const,
    color: WhatsAppColors.textPrimary,
  },
  emptyDescription: {
    fontSize: '14px',
    textAlign: 'center' as const,
    maxWidth: '360px',
    lineHeight: '20px',
    color: WhatsAppColors.textSecondary,
  },
};

export default function WhatsAppLayout({ 
  sidebar, 
  listPanel, 
  mainContent,
  hideListPanel = false 
}: WhatsAppLayoutProps) {
  return (
    <div style={styles.container}>
      {/* 左侧功能导航栏 */}
      {sidebar && (
        <div style={styles.sidebar}>
          {sidebar}
        </div>
      )}

      {/* 中间列表区域 */}
      {!hideListPanel && listPanel && (
        <div style={styles.listPanel}>
          {listPanel}
        </div>
      )}

      {/* 右侧主内容区 */}
      <div style={styles.mainContent}>
        {mainContent || (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <div style={styles.emptyTitle}>WhatsApp Web</div>
            <div style={styles.emptyDescription}>
              在左侧选择一个功能开始使用
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

