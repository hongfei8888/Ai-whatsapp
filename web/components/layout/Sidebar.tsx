'use client';

import { usePathname, useRouter } from 'next/navigation';
import { WhatsAppColors } from './WhatsAppLayout';
import { useState } from 'react';

// 左侧功能导航栏组件

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: '仪表盘', icon: '📊', path: '/dashboard' },
  { id: 'chat', label: '聊天/会话', icon: '💬', path: '/chat' },
  { id: 'contacts', label: '联系人', icon: '👥', path: '/contacts' },
  { id: 'templates', label: '模板', icon: '📝', path: '/templates' },
  { id: 'batch', label: '批量操作', icon: '📤', path: '/batch' },
  { id: 'knowledge', label: '知识库', icon: '📚', path: '/knowledge' },
  { id: 'settings', label: '设置', icon: '⚙️', path: '/settings' },
];

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: WhatsAppColors.sidebarBackground,
  },
  header: {
    padding: '16px 0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  logo: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00a884 0%, #008069 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  nav: {
    flex: 1,
    padding: '8px 0',
    overflowY: 'auto' as const,
  },
  navItem: (isActive: boolean) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 8px',
    margin: '4px 8px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: isActive ? WhatsAppColors.selected : 'transparent',
    position: 'relative' as const,
  }),
  navIcon: {
    fontSize: '24px',
    marginBottom: '4px',
  },
  navLabel: {
    fontSize: '10px',
    color: WhatsAppColors.textSecondary,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },
  badge: {
    position: 'absolute' as const,
    top: '8px',
    right: '12px',
    backgroundColor: '#ff4444',
    color: '#fff',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '10px',
    fontWeight: 'bold' as const,
    minWidth: '18px',
    textAlign: 'center' as const,
  },
  footer: {
    padding: '16px 0',
    borderTop: `1px solid ${WhatsAppColors.border}`,
  },
  profileButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: WhatsAppColors.accent,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    cursor: 'pointer',
    fontSize: '20px',
    transition: 'transform 0.2s',
  },
  tooltip: {
    position: 'absolute' as const,
    left: '90px',
    backgroundColor: WhatsAppColors.panelBackground,
    color: WhatsAppColors.textPrimary,
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    whiteSpace: 'nowrap' as const,
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    pointerEvents: 'none' as const,
  },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (path: string) => {
    if (path === '/chat') {
      return pathname === '/chat' || pathname.startsWith('/chat/');
    }
    return pathname === path;
  };

  const handleNavigation = (path: string) => {
    if (path === '/chat' && (pathname === '/chat' || pathname.startsWith('/chat/'))) {
      // 如果已经在聊天页面，不做任何操作
      return;
    }
    router.push(path);
  };

  return (
    <div style={styles.container}>
      {/* Logo/Header */}
      <div style={styles.header}>
        <div 
          style={styles.logo}
          onClick={() => router.push('/dashboard')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          W
        </div>
      </div>

      {/* 导航菜单 */}
      <div style={styles.nav}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <div
              key={item.id}
              style={styles.navItem(active)}
              onClick={() => handleNavigation(item.path)}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
                }
                setHoveredItem(item.id);
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
                setHoveredItem(null);
              }}
            >
              <div style={styles.navIcon}>{item.icon}</div>
              <div style={styles.navLabel}>{item.label}</div>
              {item.badge && <div style={styles.badge}>{item.badge}</div>}
              
              {/* Tooltip */}
              {hoveredItem === item.id && (
                <div style={styles.tooltip}>
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 用户资料 */}
      <div style={styles.footer}>
        <div
          style={styles.profileButton}
          onClick={() => router.push('/settings')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          👤
        </div>
      </div>
    </div>
  );
}

