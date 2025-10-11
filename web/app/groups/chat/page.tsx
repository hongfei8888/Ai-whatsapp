'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WhatsAppLayout from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import GroupsNavigation from '@/components/groups/Navigation';
import { api } from '@/lib/api';

const THEME_COLOR = '#00a884';
const WHITE = '#ffffff';
const BORDER_COLOR = '#e9edef';
const TEXT_PRIMARY = '#111b21';
const TEXT_SECONDARY = '#667781';
const HOVER_BG = '#f5f6f6';

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: WHITE,
  },
  header: {
    padding: '20px 24px',
    borderBottom: `1px solid ${BORDER_COLOR}`,
  },
  title: {
    fontSize: '24px',
    fontWeight: '600' as const,
    color: TEXT_PRIMARY,
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: TEXT_SECONDARY,
  },
  content: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px',
  },
  groupGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  groupCard: {
    backgroundColor: WHITE,
    border: `1px solid ${BORDER_COLOR}`,
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  groupAvatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: THEME_COLOR,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    marginBottom: '12px',
    color: WHITE,
  },
  groupName: {
    fontSize: '16px',
    fontWeight: '500' as const,
    color: TEXT_PRIMARY,
    marginBottom: '4px',
  },
  groupMembers: {
    fontSize: '13px',
    color: TEXT_SECONDARY,
  },
};

export default function GroupChatSelectorPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await api.groups.list({ isActive: true, limit: 1000 });
      // ✅ API 返回 { groups: [], total: number }，需要提取 groups 数组
      setGroups(data?.groups || []);
    } catch (error) {
      console.error('❌ 加载群组失败:', error);
      setGroups([]); // 确保错误时也设置为空数组
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (groupId: string) => {
    console.log('🔀 跳转到群组聊天:', groupId);
    router.push(`/chat/group/${groupId}`);
  };

  return (
    <WhatsAppLayout
      sidebar={<Sidebar />}
      mainContent={
        <div style={styles.container}>
          <GroupsNavigation />
          
          <div style={styles.header}>
            <div style={styles.title}>💬 选择群组聊天</div>
            <div style={styles.subtitle}>
              {loading ? '加载中...' : `共 ${groups.length} 个群组`}
            </div>
          </div>

          <div style={styles.content}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: TEXT_SECONDARY }}>
                加载群组列表...
              </div>
            ) : groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: TEXT_SECONDARY }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <div style={{ fontSize: '16px' }}>暂无群组</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  请先在"群组管理"中同步群组
                </div>
              </div>
            ) : (
              <div style={styles.groupGrid}>
                {groups.map((group) => (
                  <div
                    key={group.id}
                    style={styles.groupCard}
                    onClick={() => handleGroupClick(group.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = HOVER_BG;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = WHITE;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={styles.groupAvatar}>
                      {group.name?.charAt(0) || '👥'}
                    </div>
                    <div style={styles.groupName}>
                      {group.name || '未命名群组'}
                    </div>
                    <div style={styles.groupMembers}>
                      {group.memberCount || 0} 个成员
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}
