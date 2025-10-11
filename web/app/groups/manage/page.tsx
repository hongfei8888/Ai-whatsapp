'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WhatsAppLayout from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import ErrorState from '@/components/groups/ErrorState';
import EmptyState from '@/components/groups/EmptyState';
import SkeletonCard from '@/components/groups/SkeletonCard';
import { api } from '@/lib/api';

const THEME_COLOR = '#00a884';
const BG_COLOR = '#f0f2f5';
const WHITE = '#ffffff';
const BORDER_COLOR = '#e9edef';
const TEXT_PRIMARY = '#111b21';
const TEXT_SECONDARY = '#667781';

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: WHITE,
  },
  // 顶部导航
  tabBar: {
    display: 'flex',
    borderBottom: `2px solid ${BORDER_COLOR}`,
    backgroundColor: WHITE,
  },
  tab: (isActive: boolean) => ({
    flex: 1,
    padding: '16px',
    border: 'none',
    backgroundColor: 'transparent',
    color: isActive ? THEME_COLOR : TEXT_SECONDARY,
    borderBottom: isActive ? `3px solid ${THEME_COLOR}` : '3px solid transparent',
    fontWeight: isActive ? '600' as const : '400' as const,
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  // 工具栏
  toolbar: {
    padding: '16px 24px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    borderBottom: `1px solid ${BORDER_COLOR}`,
    backgroundColor: WHITE,
  },
  searchInput: {
    flex: 1,
    padding: '10px 16px',
    border: `1px solid ${BORDER_COLOR}`,
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  filterSelect: {
    padding: '10px 16px',
    border: `1px solid ${BORDER_COLOR}`,
    borderRadius: '8px',
    fontSize: '15px',
    backgroundColor: WHITE,
    cursor: 'pointer',
    outline: 'none',
  },
  syncButton: {
    padding: '10px 20px',
    backgroundColor: THEME_COLOR,
    color: WHITE,
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  // 内容区
  content: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px',
    backgroundColor: BG_COLOR,
  },
  // 群组网格
  groupsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  groupCard: {
    backgroundColor: WHITE,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${BORDER_COLOR}`,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  groupName: {
    fontSize: '16px',
    fontWeight: '600' as const,
    color: TEXT_PRIMARY,
    marginBottom: '4px',
    wordBreak: 'break-word' as const,
  },
  groupMeta: {
    fontSize: '13px',
    color: TEXT_SECONDARY,
    marginBottom: '12px',
  },
  groupStats: {
    display: 'flex',
    gap: '16px',
    marginBottom: '12px',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: '11px',
    color: TEXT_SECONDARY,
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
  },
  statValue: {
    fontSize: '18px',
    fontWeight: '600' as const,
    color: TEXT_PRIMARY,
  },
  groupActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: `1px solid ${BORDER_COLOR}`,
  },
  actionButton: {
    flex: 1,
    padding: '8px',
    border: `1px solid ${BORDER_COLOR}`,
    backgroundColor: WHITE,
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600' as const,
  },
  badgeActive: {
    backgroundColor: `${THEME_COLOR}20`,
    color: THEME_COLOR,
  },
  badgeInactive: {
    backgroundColor: '#95a5a620',
    color: '#95a5a6',
  },
  badgeMonitoring: {
    backgroundColor: '#3498db20',
    color: '#3498db',
  },
};

interface WhatsAppGroup {
  id: string;
  groupId: string;
  name: string;
  description?: string | null;
  memberCount: number;
  isActive: boolean;
  isMonitoring: boolean;
  keywords?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function GroupsManagePage() {
  const router = useRouter();
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  
  // 筛选和搜索
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = { limit: 1000 };
      if (statusFilter === 'active') filters.isActive = true;
      if (statusFilter === 'inactive') filters.isActive = false;
      if (statusFilter === 'monitoring') filters.isMonitoring = true;
      
      const response = await api.groups.list(filters);
      setGroups(response.groups || []);
    } catch (err: any) {
      console.error('加载群组失败:', err);
      setError(err.message || '加载群组失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [statusFilter]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await api.groups.sync();
      alert(`✅ 同步成功！\n\n同步总数: ${result.syncedCount} 个群组\n新增: ${result.newCount} 个\n更新: ${result.updatedCount} 个`);
      await loadGroups();
    } catch (err: any) {
      alert(`❌ 同步失败：${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleMonitoring = async (group: WhatsAppGroup) => {
    try {
      await api.groups.updateGroupSettings(group.id, {
        isMonitoring: !group.isMonitoring,
      });
      await loadGroups();
    } catch (err: any) {
      alert(`❌ 操作失败：${err.message}`);
    }
  };

  const handleSyncMembers = async (group: WhatsAppGroup) => {
    try {
      const result = await api.groups.syncGroupMembers(group.id);
      alert(`✅ 同步成功！\n\n同步成员数: ${result.syncedCount}\n新增: ${result.newCount}`);
      await loadGroups();
    } catch (err: any) {
      alert(`❌ 同步失败：${err.message}`);
    }
  };

  // 筛选群组
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const mainContent = (
    <div style={styles.container}>
      {/* 顶部导航 */}
      <div style={styles.tabBar}>
        <button
          style={styles.tab(false)}
          onClick={() => router.push('/groups')}
        >
          📊 概览
        </button>
        <button style={styles.tab(true)}>
          ⚙️ 群组管理
        </button>
        <button
          style={styles.tab(false)}
          onClick={() => router.push('/groups/join-batch')}
        >
          📱 批量进群
        </button>
        <button
          style={styles.tab(false)}
          onClick={() => router.push('/groups/broadcast')}
        >
          📢 群组群发
        </button>
        <button
          style={styles.tab(false)}
          onClick={() => router.push('/groups/monitoring')}
        >
          👁️ 群消息监控
        </button>
      </div>

      {/* 工具栏 */}
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="搜索群组名称..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = THEME_COLOR;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = BORDER_COLOR;
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">全部群组</option>
          <option value="active">活跃群组</option>
          <option value="inactive">非活跃</option>
          <option value="monitoring">监控中</option>
        </select>
        <button
          style={styles.syncButton}
          onClick={handleSync}
          disabled={syncing}
          onMouseEnter={(e) => {
            if (!syncing) e.currentTarget.style.backgroundColor = '#00916d';
          }}
          onMouseLeave={(e) => {
            if (!syncing) e.currentTarget.style.backgroundColor = THEME_COLOR;
          }}
        >
          {syncing ? '同步中...' : '🔄 同步群组'}
        </button>
      </div>

      {/* 内容区 */}
      <div style={styles.content}>
        {error ? (
          <ErrorState message={error} onRetry={loadGroups} />
        ) : loading ? (
          <div style={styles.groupsGrid}>
            <SkeletonCard type="card" count={6} />
          </div>
        ) : filteredGroups.length === 0 ? (
          <EmptyState
            icon={searchQuery ? '🔍' : '📭'}
            title={searchQuery ? '未找到匹配的群组' : '暂无群组'}
            message={
              searchQuery
                ? '请尝试其他搜索关键词'
                : '点击右上角"同步群组"按钮获取您的WhatsApp群组'
            }
            actionText={!searchQuery ? '同步群组' : undefined}
            onAction={!searchQuery ? handleSync : undefined}
          />
        ) : (
          <div style={styles.groupsGrid}>
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                style={styles.groupCard}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={styles.groupHeader}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.groupName}>{group.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
                    {group.isActive && (
                      <span style={{...styles.badge, ...styles.badgeActive}}>
                        活跃
                      </span>
                    )}
                    {!group.isActive && (
                      <span style={{...styles.badge, ...styles.badgeInactive}}>
                        非活跃
                      </span>
                    )}
                    {group.isMonitoring && (
                      <span style={{...styles.badge, ...styles.badgeMonitoring}}>
                        监控中
                      </span>
                    )}
                  </div>
                </div>

                {group.description && (
                  <div style={styles.groupMeta}>
                    {group.description.substring(0, 100)}
                    {group.description.length > 100 && '...'}
                  </div>
                )}

                <div style={styles.groupStats}>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>成员数</div>
                    <div style={styles.statValue}>{group.memberCount}</div>
                  </div>
                  {group.keywords && group.keywords.length > 0 && (
                    <div style={styles.statItem}>
                      <div style={styles.statLabel}>关键词</div>
                      <div style={styles.statValue}>{group.keywords.length}</div>
                    </div>
                  )}
                </div>

                <div style={styles.groupMeta}>
                  加入于 {new Date(group.createdAt).toLocaleDateString('zh-CN')}
                </div>

                <div style={styles.groupActions}>
                  <button
                    style={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleMonitoring(group);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = BG_COLOR;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = WHITE;
                    }}
                  >
                    {group.isMonitoring ? '关闭监控' : '开启监控'}
                  </button>
                  <button
                    style={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSyncMembers(group);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = BG_COLOR;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = WHITE;
                    }}
                  >
                    同步成员
                  </button>
                  <button
                    style={styles.actionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/groups/monitoring?groupId=${group.id}`);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = BG_COLOR;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = WHITE;
                    }}
                  >
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <WhatsAppLayout
      sidebar={<Sidebar />}
      mainContent={mainContent}
      hideListPanel={true}
    />
  );
}

