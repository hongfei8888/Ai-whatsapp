'use client';

import { usePathname, useRouter } from 'next/navigation';
import { WhatsAppColors } from './WhatsAppLayout';
import { useState, useRef } from 'react';
import { useAccount } from '@/lib/account-context';
import { AccountSwitcher } from '@/components/account/AccountSwitcher';
import { AddAccountDialog } from '@/components/account/AddAccountDialog';

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
  { id: 'chat', label: '对话', icon: '💬', path: '/chat' },
  { id: 'contacts', label: '通讯录', icon: '👥', path: '/contacts' },
  { id: 'templates', label: '消息模板', icon: '📝', path: '/templates' },
  { id: 'batch', label: '消息群发', icon: '📤', path: '/batch' },
  { id: 'knowledge', label: '知识库', icon: '📚', path: '/knowledge' },
  { 
    id: 'groups', 
    label: '社群营销', 
    icon: '📱', 
    path: '/groups',
  },
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
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const accountButtonRef = useRef<HTMLDivElement>(null);
  
  const { accounts, currentAccountId, refreshAccounts } = useAccount();
  
  // 获取当前账号
  const currentAccount = accounts.find(acc => acc.id === currentAccountId);
  
  // 获取账号缩写
  const getAccountInitials = (account: any) => {
    if (!account || !account.name) return '?';
    const words = account.name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return account.name.substring(0, 2).toUpperCase();
  };

  const isActive = (path: string) => {
    if (path === '/chat') {
      return pathname === '/chat' || pathname.startsWith('/chat/');
    }
    if (path === '/groups') {
      return pathname.startsWith('/groups');
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
    <>
      <div style={styles.container}>
        {/* 账号切换器 */}
        <div style={{
          padding: '12px 0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: `1px solid ${WhatsAppColors.border}`,
        }}>
          <div 
            ref={accountButtonRef}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: currentAccount?.status === 'online' 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '700',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.3s',
              position: 'relative',
              boxShadow: accountSwitcherOpen 
                ? '0 0 0 3px rgba(59, 130, 246, 0.3)'
                : '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
            onClick={() => setAccountSwitcherOpen(!accountSwitcherOpen)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = accountSwitcherOpen
                ? '0 0 0 3px rgba(59, 130, 246, 0.3)'
                : '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            {currentAccount ? getAccountInitials(currentAccount) : '?'}
            
            {/* 在线状态点 */}
            {currentAccount?.status === 'online' && (
              <div style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                border: '2px solid #fff',
                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
              }} />
            )}
            
            {/* 账号数量徽章 */}
            {accounts.length > 1 && (
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                minWidth: '20px',
                height: '20px',
                borderRadius: '10px',
                backgroundColor: '#ef4444',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700',
                padding: '0 5px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}>
                {accounts.length}
              </div>
            )}
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
          ⚙️
        </div>
      </div>
    </div>
    
    {/* 账号切换器弹出窗口 */}
    <AccountSwitcher
      isOpen={accountSwitcherOpen}
      onClose={() => setAccountSwitcherOpen(false)}
      triggerRef={accountButtonRef}
      onOpenAddDialog={() => setAddDialogOpen(true)}
    />
    
    {/* 添加账号对话框 */}
    <AddAccountDialog 
      open={addDialogOpen} 
      onOpenChange={setAddDialogOpen}
      onSuccess={() => {
        setAddDialogOpen(false);
        refreshAccounts();
        // 添加账号成功后，关闭账号切换窗口
        setAccountSwitcherOpen(false);
      }}
    />
    </>
  );
}

