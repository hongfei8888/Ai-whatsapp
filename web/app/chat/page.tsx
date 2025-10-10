'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WhatsAppLayout, { WhatsAppColors } from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import { useWebSocket } from '@/lib/useWebSocket';
import NewMessageToast from '@/components/NewMessageToast';

// 聊天/会话整合页面 - 包含聊天列表和会话管理功能

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
  filterTabs: {
    display: 'flex',
    gap: '8px',
  },
  filterTab: (active: boolean) => ({
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: active ? WhatsAppColors.accent : WhatsAppColors.inputBackground,
    color: active ? '#ffffff' : WhatsAppColors.textSecondary,
    transition: 'all 0.2s',
  }),
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
  chatList: {
    overflowY: 'auto' as const,
    flex: 1,
  },
  chatItem: {
    padding: '12px 16px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    cursor: 'pointer',
    display: 'flex',
    gap: '12px',
    transition: 'background-color 0.2s',
    alignItems: 'center',
  },
  chatAvatar: {
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
  chatInfo: {
    flex: 1,
    minWidth: 0,
  },
  chatName: {
    color: WhatsAppColors.textPrimary,
    fontSize: '16px',
    fontWeight: '400' as const,
    marginBottom: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  chatLastMessage: {
    color: WhatsAppColors.textSecondary,
    fontSize: '13px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  messagePreview: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  chatMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '4px',
    flexShrink: 0,
  },
  chatTime: {
    color: WhatsAppColors.textSecondary,
    fontSize: '12px',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600' as const,
  },
  badgeAI: {
    backgroundColor: 'rgba(0, 168, 132, 0.2)',
    color: WhatsAppColors.accent,
  },
  badgeManual: {
    backgroundColor: 'rgba(134, 150, 160, 0.2)',
    color: WhatsAppColors.textSecondary,
  },
  aiToggle: {
    width: '36px',
    height: '20px',
    borderRadius: '10px',
    position: 'relative' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  aiToggleKnob: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    position: 'absolute' as const,
    top: '2px',
    transition: 'left 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
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
  },
};

export default function ChatPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'ai' | 'manual'>('all');
  const [newMessageToast, setNewMessageToast] = useState<any>(null);

  const loadThreads = useCallback(async () => {
    try {
      const data = await api.getThreads();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('加载会话列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // WebSocket 实时更新
  useWebSocket({
    onNewMessage: (message) => {
      console.log('📨 [聊天页面] 收到新消息！', message);
      console.log('📨 [聊天页面] 正在刷新会话列表...');
      
      // 立即刷新会话列表
      loadThreads().then(() => {
        console.log('📨 [聊天页面] ✅ 会话列表已刷新');
      }).catch(err => {
        console.error('📨 [聊天页面] ❌ 刷新失败:', err);
      });
      
      // 显示新消息通知（仅非自己发送的消息）
      if (!message.fromMe) {
        console.log('📨 [聊天页面] 显示新消息通知');
        const displayName = message.from?.replace('@c.us', '') || '新消息';
        setNewMessageToast({
          from: displayName,
          body: message.body || '',
          timestamp: message.timestamp || Date.now(),
        });
      }
    },
    onStatusUpdate: (status) => {
      console.log('📊 [聊天页面] WhatsApp 状态更新:', status);
    },
    onConnect: () => {
      console.log('🔌 [聊天页面] WebSocket 已连接，加载初始数据');
      loadThreads();
    },
    onDisconnect: () => {
      console.log('🔌 [聊天页面] WebSocket 已断开');
    },
  });

  const handleToggleAI = async (threadId: string, currentState: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.setThreadAiEnabled(threadId, !currentState);
      // 更新本地状态
      setThreads(threads.map(t => 
        t.id === threadId ? { ...t, aiEnabled: !currentState } : t
      ));
    } catch (error) {
      console.error('更新AI状态失败:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  const filteredThreads = threads
    .filter(thread => {
      const name = thread.contact?.name || thread.contact?.phoneE164 || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = 
        filter === 'all' ? true :
        filter === 'ai' ? thread.aiEnabled :
        !thread.aiEnabled;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // 按最后更新时间倒序排序（最新的在最前面）
      const timeA = new Date(a.updatedAt || 0).getTime();
      const timeB = new Date(b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

  // 列表面板
  const listPanel = (
    <>
      <div style={styles.listHeader}>
        <div style={styles.headerTitle}>聊天</div>
        <div style={styles.filterTabs}>
          <button 
            style={styles.filterTab(filter === 'all')}
            onClick={() => setFilter('all')}
          >
            全部 ({threads.length})
          </button>
          <button 
            style={styles.filterTab(filter === 'ai')}
            onClick={() => setFilter('ai')}
          >
            🤖 AI ({threads.filter(t => t.aiEnabled).length})
          </button>
          <button 
            style={styles.filterTab(filter === 'manual')}
            onClick={() => setFilter('manual')}
          >
            👤 手动 ({threads.filter(t => !t.aiEnabled).length})
          </button>
        </div>
      </div>

      <div style={styles.searchBar}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: WhatsAppColors.textSecondary }}>🔍</span>
          <input
            type="text"
            placeholder="搜索聊天"
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.chatList}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: WhatsAppColors.textSecondary }}>
            加载中...
          </div>
        ) : filteredThreads.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: WhatsAppColors.textSecondary }}>
            {searchQuery ? '未找到匹配的聊天' : '暂无聊天记录'}
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <div
              key={thread.id}
              style={styles.chatItem}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => router.push(`/chat/${thread.id}`)}
            >
              <div style={styles.chatAvatar}>
                {getInitials(thread.contact?.name || thread.contact?.phoneE164)}
              </div>
              <div style={styles.chatInfo}>
                <div style={styles.chatName}>
                  {thread.contact?.name || thread.contact?.phoneE164}
                </div>
                <div style={styles.chatLastMessage}>
                  {thread.lastMessage?.fromMe && <span>✓✓</span>}
                  <span style={styles.messagePreview}>
                    {thread.lastMessage?.body || `${thread.messagesCount} 条消息`}
                  </span>
                </div>
              </div>
              <div style={styles.chatMeta}>
                <div style={styles.chatTime}>
                  {thread.updatedAt ? formatTime(thread.updatedAt) : ''}
                </div>
                {/* AI 开关 */}
                <div
                  style={{
                    ...styles.aiToggle,
                    backgroundColor: thread.aiEnabled ? WhatsAppColors.accent : WhatsAppColors.textSecondary,
                  }}
                  onClick={(e) => handleToggleAI(thread.id, thread.aiEnabled, e)}
                  title={thread.aiEnabled ? '点击关闭AI自动回复' : '点击开启AI自动回复'}
                >
                  <div
                    style={{
                      ...styles.aiToggleKnob,
                      left: thread.aiEnabled ? '18px' : '2px',
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  // 主内容区 - 空状态提示
  const mainContent = (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>💬</div>
      <div style={styles.emptyTitle}>WhatsApp Web</div>
      <div style={styles.emptyDescription}>
        点击左侧聊天开始对话<br />
        使用右侧开关控制 AI 自动回复
      </div>
    </div>
  );

  return (
    <>
      <WhatsAppLayout
        sidebar={<Sidebar />}
        listPanel={listPanel}
        mainContent={mainContent}
      />
      <NewMessageToast
        message={newMessageToast}
        onClose={() => setNewMessageToast(null)}
      />
    </>
  );
}
