'use client';

import { useRouter, usePathname } from 'next/navigation';

const THEME_COLOR = '#00a884';
const TEXT_SECONDARY = '#667781';
const BORDER_COLOR = '#e9edef';
const WHITE = '#ffffff';

const styles = {
  tabBar: {
    display: 'flex',
    borderBottom: `2px solid ${BORDER_COLOR}`,
    backgroundColor: WHITE,
    overflowX: 'auto' as const,
  },
  tab: (isActive: boolean) => ({
    flex: 1,
    minWidth: '120px',
    padding: '16px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    color: isActive ? THEME_COLOR : TEXT_SECONDARY,
    borderBottom: isActive ? `3px solid ${THEME_COLOR}` : '3px solid transparent',
    fontWeight: isActive ? '600' as const : '400' as const,
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  }),
};

export default function GroupsNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { path: '/groups', label: '📊 概览', exact: true },
    { path: '/groups/chat', label: '💬 群组聊天' },
    { path: '/groups/manage', label: '⚙️ 群组管理' },
    { path: '/groups/join-batch', label: '📱 批量进群' },
    { path: '/groups/broadcast', label: '📢 群组群发' },
    { path: '/groups/monitoring', label: '👁️ 消息监控' },
  ];

  const isActive = (tabPath: string, exact?: boolean) => {
    if (exact) {
      return pathname === tabPath;
    }
    return pathname.startsWith(tabPath);
  };

  return (
    <div style={styles.tabBar}>
      {tabs.map((tab) => (
        <button
          key={tab.path}
          style={styles.tab(isActive(tab.path, tab.exact))}
          onClick={() => router.push(tab.path)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

