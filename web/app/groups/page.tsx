'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WhatsAppLayout from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import StatCard from '@/components/StatCard';
import LineChart from '@/components/charts/LineChart';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';
import ErrorState from '@/components/groups/ErrorState';
import SkeletonCard from '@/components/groups/SkeletonCard';
import { api } from '@/lib/api';
import { useWebSocket } from '@/lib/useWebSocket';

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
    backgroundColor: BG_COLOR,
  },
  header: {
    padding: '24px 32px',
    backgroundColor: WHITE,
    borderBottom: `1px solid ${BORDER_COLOR}`,
  },
  title: {
    fontSize: '28px',
    fontWeight: '700' as const,
    color: TEXT_PRIMARY,
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '15px',
    color: TEXT_SECONDARY,
  },
  content: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '24px 32px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600' as const,
    color: TEXT_PRIMARY,
    marginBottom: '16px',
  },
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  quickActionCard: {
    backgroundColor: WHITE,
    borderRadius: '12px',
    padding: '24px',
    border: `1px solid ${BORDER_COLOR}`,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center' as const,
  },
  quickActionIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  quickActionTitle: {
    fontSize: '16px',
    fontWeight: '600' as const,
    color: TEXT_PRIMARY,
    marginBottom: '8px',
  },
  quickActionDesc: {
    fontSize: '13px',
    color: TEXT_SECONDARY,
  },
  taskList: {
    backgroundColor: WHITE,
    borderRadius: '12px',
    border: `1px solid ${BORDER_COLOR}`,
  },
  taskItem: {
    padding: '16px 20px',
    borderBottom: `1px solid ${BORDER_COLOR}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: '15px',
    fontWeight: '500' as const,
    color: TEXT_PRIMARY,
    marginBottom: '4px',
  },
  taskMeta: {
    fontSize: '13px',
    color: TEXT_SECONDARY,
  },
  taskStatus: {
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600' as const,
  },
};

export default function GroupsOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 统计数据
  const [groupStats, setGroupStats] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);
  const [joinTasksStats, setJoinTasksStats] = useState<any>(null);
  const [broadcastsStats, setBroadcastsStats] = useState<any>(null);

  // WebSocket 实时更新
  useWebSocket({
    onJoinTaskProgress: () => loadData(),
    onBroadcastProgress: () => loadData(),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        overviewData,
        groupsData,
        joinTasksData,
        broadcastsData,
        joinStatsData,
        broadcastStatsData,
      ] = await Promise.all([
        api.stats.overview().catch(() => null),
        api.groups.list({ limit: 10 }).catch(() => ({ groups: [] })),
        api.groups.listJoinTasks({ limit: 5 }).catch(() => ({ tasks: [] })),
        api.groups.listBroadcasts({ limit: 5 }).catch(() => ({ broadcasts: [] })),
        api.groups.getJoinTasksStats('7d').catch(() => null),
        api.groups.getBroadcastsStats('7d').catch(() => null),
      ]);

      // 设置统计数据
      if (overviewData) {
        setGroupStats(overviewData.groups || {});
      }
      
      setRecentTasks(joinTasksData.tasks || []);
      setRecentBroadcasts(broadcastsData.broadcasts || []);
      setJoinTasksStats(joinStatsData);
      setBroadcastsStats(broadcastStatsData);

    } catch (err: any) {
      console.error('加载数据失败:', err);
      setError(err.message || '加载数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // 每30秒刷新一次
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: { text: '等待中', color: '#f39c12' },
      running: { text: '进行中', color: THEME_COLOR },
      completed: { text: '已完成', color: '#00a884' },
      failed: { text: '失败', color: '#e74c3c' },
      cancelled: { text: '已取消', color: '#95a5a6' },
      paused: { text: '已暂停', color: '#f39c12' },
      scheduled: { text: '已排期', color: '#3498db' },
    };
    
    const badge = badges[status] || { text: status, color: '#667781' };
    return {
      style: {
        ...styles.taskStatus,
        backgroundColor: `${badge.color}20`,
        color: badge.color,
      },
      text: badge.text,
    };
  };

  const mainContent = (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>社群营销概览</div>
        <div style={styles.subtitle}>管理您的WhatsApp群组营销活动</div>
      </div>

      <div style={styles.content}>
        {error ? (
          <ErrorState
            message={error}
            onRetry={loadData}
          />
        ) : loading ? (
          <>
            <div style={styles.statsGrid}>
              <SkeletonCard type="stat" count={4} />
            </div>
            <SkeletonCard type="card" count={3} />
          </>
        ) : (
          <>
            {/* 统计卡片 */}
            <div style={styles.statsGrid}>
              <div onClick={() => router.push('/groups/manage')}>
                <StatCard
                  title="群组总数"
                  value={groupStats?.total || 0}
                  icon="📱"
                  color="#9b59b6"
                  subtitle={`监控中：${groupStats?.monitoring || 0}`}
                />
              </div>
              
              <div onClick={() => router.push('/groups/manage')}>
                <StatCard
                  title="活跃群组"
                  value={groupStats?.active || 0}
                  icon="🔥"
                  color="#e67e22"
                  subtitle="最近7天有消息"
                />
              </div>
              
              <div onClick={() => router.push('/groups/join-batch')}>
                <StatCard
                  title="进群任务"
                  value={recentTasks.length}
                  icon="➕"
                  color="#3498db"
                  subtitle={`运行中：${recentTasks.filter((t: any) => t.status === 'running').length}`}
                />
              </div>
              
              <div onClick={() => router.push('/groups/broadcast')}>
                <StatCard
                  title="群发任务"
                  value={recentBroadcasts.length}
                  icon="📢"
                  color="#1abc9c"
                  subtitle={`运行中：${recentBroadcasts.filter((b: any) => b.status === 'running').length}`}
                />
              </div>
            </div>

            {/* 快捷操作 */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>快捷操作</div>
              <div style={styles.quickActionsGrid}>
                <div
                  style={styles.quickActionCard}
                  onClick={() => router.push('/groups/join-batch')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={styles.quickActionIcon}>📱</div>
                  <div style={styles.quickActionTitle}>批量进群</div>
                  <div style={styles.quickActionDesc}>批量加入WhatsApp群组</div>
                </div>

                <div
                  style={styles.quickActionCard}
                  onClick={() => router.push('/groups/broadcast')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={styles.quickActionIcon}>📢</div>
                  <div style={styles.quickActionTitle}>群组群发</div>
                  <div style={styles.quickActionDesc}>向多个群组发送消息</div>
                </div>

                <div
                  style={styles.quickActionCard}
                  onClick={() => router.push('/groups/monitoring')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={styles.quickActionIcon}>👁️</div>
                  <div style={styles.quickActionTitle}>消息监控</div>
                  <div style={styles.quickActionDesc}>监控群组消息和关键词</div>
                </div>

                <div
                  style={styles.quickActionCard}
                  onClick={() => router.push('/groups/manage')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={styles.quickActionIcon}>⚙️</div>
                  <div style={styles.quickActionTitle}>群组管理</div>
                  <div style={styles.quickActionDesc}>管理所有群组和设置</div>
                </div>
              </div>
            </div>

            {/* 数据图表 */}
            {(joinTasksStats?.dailyTrend || broadcastsStats?.dailyTrend) && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>数据趋势</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  {/* 进群趋势图 */}
                  {joinTasksStats?.dailyTrend && (
                    <div style={{ backgroundColor: WHITE, borderRadius: '12px', padding: '20px', border: `1px solid ${BORDER_COLOR}` }}>
                      <LineChart
                        data={joinTasksStats.dailyTrend.map((d: any) => ({
                          date: new Date(d.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
                          成功: d.joined,
                          失败: d.failed,
                        }))}
                        lines={[
                          { dataKey: '成功', name: '成功进群', color: THEME_COLOR },
                          { dataKey: '失败', name: '进群失败', color: '#e74c3c' },
                        ]}
                        title="进群任务趋势（最近7天）"
                        height={250}
                      />
                    </div>
                  )}

                  {/* 群发趋势图 */}
                  {broadcastsStats?.dailyTrend && (
                    <div style={{ backgroundColor: WHITE, borderRadius: '12px', padding: '20px', border: `1px solid ${BORDER_COLOR}` }}>
                      <LineChart
                        data={broadcastsStats.dailyTrend.map((d: any) => ({
                          date: new Date(d.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
                          成功: d.sent,
                          失败: d.failed,
                        }))}
                        lines={[
                          { dataKey: '成功', name: '成功发送', color: '#3498db' },
                          { dataKey: '失败', name: '发送失败', color: '#e74c3c' },
                        ]}
                        title="群发任务趋势（最近7天）"
                        height={250}
                      />
                    </div>
                  )}
                </div>

                {/* 成功率饼图 */}
                {(joinTasksStats || broadcastsStats) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {joinTasksStats && (
                      <div style={{ backgroundColor: WHITE, borderRadius: '12px', padding: '20px', border: `1px solid ${BORDER_COLOR}` }}>
                        <PieChart
                          data={[
                            { name: '成功', value: joinTasksStats.totalJoined || 0, color: THEME_COLOR },
                            { name: '失败', value: joinTasksStats.totalFailed || 0, color: '#e74c3c' },
                          ]}
                          title={`进群成功率：${joinTasksStats.successRate}%`}
                          height={250}
                        />
                      </div>
                    )}

                    {broadcastsStats && (
                      <div style={{ backgroundColor: WHITE, borderRadius: '12px', padding: '20px', border: `1px solid ${BORDER_COLOR}` }}>
                        <PieChart
                          data={[
                            { name: '成功', value: broadcastsStats.totalSent || 0, color: '#3498db' },
                            { name: '失败', value: broadcastsStats.totalFailed || 0, color: '#e74c3c' },
                          ]}
                          title={`群发成功率：${broadcastsStats.successRate}%`}
                          height={250}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 最近的进群任务 */}
            {recentTasks.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>最近的进群任务</div>
                <div style={styles.taskList}>
                  {recentTasks.slice(0, 5).map((task: any) => (
                    <div
                      key={task.id}
                      style={styles.taskItem}
                      onClick={() => router.push('/groups/join-batch')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = BG_COLOR;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={styles.taskInfo}>
                        <div style={styles.taskTitle}>{task.title}</div>
                        <div style={styles.taskMeta}>
                          进度：{task.joinedCount}/{task.totalLinks} · 
                          创建于 {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <div style={getStatusBadge(task.status).style}>
                        {getStatusBadge(task.status).text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 最近的群发任务 */}
            {recentBroadcasts.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>最近的群发任务</div>
                <div style={styles.taskList}>
                  {recentBroadcasts.slice(0, 5).map((broadcast: any) => (
                    <div
                      key={broadcast.id}
                      style={styles.taskItem}
                      onClick={() => router.push('/groups/broadcast')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = BG_COLOR;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={styles.taskInfo}>
                        <div style={styles.taskTitle}>{broadcast.title}</div>
                        <div style={styles.taskMeta}>
                          进度：{broadcast.sentCount}/{broadcast.totalGroups} · 
                          创建于 {new Date(broadcast.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <div style={getStatusBadge(broadcast.status).style}>
                        {getStatusBadge(broadcast.status).text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
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
