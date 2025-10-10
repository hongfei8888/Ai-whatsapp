'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WhatsAppLayout, { WhatsAppColors } from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import { api } from '@/lib/api';

const styles = {
  listHeader: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '10px 16px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  headerTitle: {
    color: WhatsAppColors.textPrimary,
    fontSize: '20px',
    fontWeight: '600' as const,
  },
  searchBar: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '8px 12px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  searchInput: {
    width: '100%',
    backgroundColor: WhatsAppColors.inputBackground,
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px 8px 40px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
  },
  threadList: {
    overflowY: 'auto' as const,
    flex: 1,
  },
  threadItem: {
    padding: '12px 16px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    cursor: 'pointer',
    display: 'flex',
    gap: '12px',
    transition: 'background-color 0.2s',
  },
  threadAvatar: {
    width: '49px',
    height: '49px',
    borderRadius: '50%',
    backgroundColor: '#6b7c85',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '20px',
    fontWeight: '500' as const,
    flexShrink: 0,
  },
  threadInfo: {
    flex: 1,
    minWidth: 0,
  },
  threadName: {
    color: WhatsAppColors.textPrimary,
    fontSize: '16px',
    fontWeight: '400' as const,
    marginBottom: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  threadStats: {
    color: WhatsAppColors.textSecondary,
    fontSize: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  threadBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600' as const,
    flexShrink: 0,
  },
  badgeAI: {
    backgroundColor: 'rgba(0, 168, 132, 0.2)',
    color: WhatsAppColors.accent,
  },
  badgeManual: {
    backgroundColor: 'rgba(134, 150, 160, 0.2)',
    color: WhatsAppColors.textSecondary,
  },
  detailPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  },
  detailHeader: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '20px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  detailAvatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#6b7c85',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '40px',
    fontWeight: '500' as const,
    margin: '0 auto 16px',
  },
  detailName: {
    fontSize: '24px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: '6px',
  },
  detailPhone: {
    fontSize: '14px',
    color: WhatsAppColors.textSecondary,
    textAlign: 'center' as const,
  },
  detailBody: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px',
  },
  infoSection: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '10px',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  statCard: {
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: WhatsAppColors.textSecondary,
  },
  infoItem: {
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: '14px',
    color: WhatsAppColors.textSecondary,
  },
  infoValue: {
    fontSize: '14px',
    color: WhatsAppColors.textPrimary,
    fontWeight: '500' as const,
  },
  actionButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginBottom: '8px',
  },
  toggleSwitch: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    position: 'relative' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  toggleKnob: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    position: 'absolute' as const,
    top: '2px',
    transition: 'left 0.2s',
  },
};

export default function ThreadsPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const data = await api.getThreads();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('加载会话失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredThreads = threads.filter(thread => {
    const name = thread.contact?.name || thread.contact?.phoneE164 || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleOpenChat = (threadId: string) => {
    router.push(`/chat/${threadId}`);
  };

  const handleToggleAI = async (threadId: string, currentState: boolean) => {
    try {
      await api.updateThread(threadId, { aiEnabled: !currentState });
      // 重新加载
      loadThreads();
      if (selectedThread?.id === threadId) {
        setSelectedThread({ ...selectedThread, aiEnabled: !currentState });
      }
    } catch (error) {
      console.error('更新AI状态失败:', error);
    }
  };

  // 列表面板
  const listPanel = (
    <>
      <div style={styles.listHeader}>
        <div style={styles.headerTitle}>会话</div>
        <div style={{ fontSize: '14px', color: WhatsAppColors.textSecondary }}>
          {threads.length} 个
        </div>
      </div>

      <div style={styles.searchBar}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: WhatsAppColors.textSecondary }}>🔍</span>
          <input
            type="text"
            placeholder="搜索会话"
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.threadList}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: WhatsAppColors.textSecondary }}>
            加载中...
          </div>
        ) : filteredThreads.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: WhatsAppColors.textSecondary }}>
            {searchQuery ? '未找到匹配的会话' : '暂无会话'}
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <div
              key={thread.id}
              style={styles.threadItem}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => setSelectedThread(thread)}
            >
              <div style={styles.threadAvatar}>
                {getInitials(thread.contact?.name || thread.contact?.phoneE164)}
              </div>
              <div style={styles.threadInfo}>
                <div style={styles.threadName}>
                  {thread.contact?.name || thread.contact?.phoneE164}
                </div>
                <div style={styles.threadStats}>
                  {thread.messagesCount} 条消息 · {formatDate(thread.updatedAt)}
                </div>
              </div>
              <div style={{
                ...styles.threadBadge,
                ...(thread.aiEnabled ? styles.badgeAI : styles.badgeManual)
              }}>
                {thread.aiEnabled ? 'AI' : '手动'}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  // 详情面板
  const mainContent = selectedThread ? (
    <div style={styles.detailPanel}>
      <div style={styles.detailHeader}>
        <div style={styles.detailAvatar}>
          {getInitials(selectedThread.contact?.name || selectedThread.contact?.phoneE164)}
        </div>
        <div style={styles.detailName}>
          {selectedThread.contact?.name || '未命名'}
        </div>
        <div style={styles.detailPhone}>
          {selectedThread.contact?.phoneE164}
        </div>
      </div>

      <div style={styles.detailBody}>
        {/* 操作按钮 */}
        <div style={styles.infoSection}>
          <button
            style={styles.actionButton}
            onClick={() => handleOpenChat(selectedThread.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
            }}
          >
            💬 打开聊天
          </button>
        </div>

        {/* 统计数据 */}
        <div style={styles.infoSection}>
          <div style={styles.sectionTitle}>会话统计</div>
          <div style={styles.infoGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{selectedThread.messagesCount}</div>
              <div style={styles.statLabel}>消息数量</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {selectedThread.aiEnabled ? '✓' : '✗'}
              </div>
              <div style={styles.statLabel}>AI状态</div>
            </div>
          </div>
        </div>

        {/* AI设置 */}
        <div style={styles.infoSection}>
          <div style={styles.sectionTitle}>AI 自动回复</div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>自动回复</span>
            <div
              style={{
                ...styles.toggleSwitch,
                backgroundColor: selectedThread.aiEnabled ? WhatsAppColors.accent : WhatsAppColors.textSecondary,
              }}
              onClick={() => handleToggleAI(selectedThread.id, selectedThread.aiEnabled)}
            >
              <div
                style={{
                  ...styles.toggleKnob,
                  left: selectedThread.aiEnabled ? '22px' : '2px',
                }}
              />
            </div>
          </div>
        </div>

        {/* 时间信息 */}
        <div style={styles.infoSection}>
          <div style={styles.sectionTitle}>时间信息</div>
          {selectedThread.lastHumanAt && (
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>最后用户消息</span>
              <span style={styles.infoValue}>
                {formatDate(selectedThread.lastHumanAt)}
              </span>
            </div>
          )}
          {selectedThread.lastBotAt && (
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>最后AI回复</span>
              <span style={styles.infoValue}>
                {formatDate(selectedThread.lastBotAt)}
              </span>
            </div>
          )}
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>创建时间</span>
            <span style={styles.infoValue}>
              {formatDate(selectedThread.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <WhatsAppLayout
      sidebar={<Sidebar />}
      listPanel={listPanel}
      mainContent={mainContent}
    />
  );
}
