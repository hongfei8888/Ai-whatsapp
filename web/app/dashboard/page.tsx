'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import WhatsAppLayout, { WhatsAppColors } from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import StatCard from '@/components/StatCard';
import LineChart from '@/components/charts/LineChart';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';
import { api } from '@/lib/api';
import QRCodeDialog from '@/components/QRCodeDialog';
import { useWebSocket } from '@/lib/useWebSocket';

const styles = {
  // 左侧面板样式
  listHeader: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '16px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  headerTitle: {
    color: WhatsAppColors.textPrimary,
    fontSize: '20px',
    fontWeight: '600' as const,
    marginBottom: '8px',
  },
  headerSubtitle: {
    color: WhatsAppColors.textSecondary,
    fontSize: '14px',
  },
  statsGrid: {
    padding: '16px',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
  },
  statCard: {
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '12px',
    padding: '16px',
    border: `1px solid ${WhatsAppColors.border}`,
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '2px',
  },
  statHint: {
    fontSize: '11px',
    color: WhatsAppColors.textSecondary,
    opacity: 0.7,
  },
  statusSection: {
    padding: '16px',
    borderTop: `1px solid ${WhatsAppColors.border}`,
  },
  sectionTitle: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '12px',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  statusCard: {
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '12px',
    padding: '16px',
    border: `1px solid ${WhatsAppColors.border}`,
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  statusLabel: {
    fontSize: '14px',
    color: WhatsAppColors.textSecondary,
  },
  statusValue: {
    fontSize: '14px',
    color: WhatsAppColors.textPrimary,
    fontWeight: '500' as const,
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600' as const,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(0, 168, 132, 0.2)',
    color: WhatsAppColors.accent,
  },
  badgeWarning: {
    backgroundColor: 'rgba(243, 156, 18, 0.2)',
    color: '#f39c12',
  },
  badgeError: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    color: '#e74c3c',
  },
  actionButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '12px',
  },
  quickActionButton: {
    width: '100%',
    padding: '10px 16px',
    backgroundColor: WhatsAppColors.background,
    color: WhatsAppColors.textPrimary,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  // 主内容区样式
  mainPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: WhatsAppColors.background,
  },
  mainHeader: {
    padding: '30px 40px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    backgroundColor: WhatsAppColors.panelBackground,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: '32px',
    fontWeight: '700' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '8px',
  },
  mainSubtitle: {
    fontSize: '16px',
    color: WhatsAppColors.textSecondary,
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  lastUpdate: {
    fontSize: '12px',
    color: WhatsAppColors.textSecondary,
    marginTop: '4px',
  },
  mainBody: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '30px 40px',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  chartsSection: {
    marginBottom: '30px',
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  chartContainer: {
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${WhatsAppColors.border}`,
  },
  activitySection: {
    marginBottom: '30px',
  },
  activityHeader: {
    fontSize: '18px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '16px',
  },
  activityCard: {
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '12px',
    padding: '16px',
    border: `1px solid ${WhatsAppColors.border}`,
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activityIcon: {
    fontSize: '24px',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: WhatsAppColors.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: '14px',
    color: WhatsAppColors.textPrimary,
    marginBottom: '4px',
    fontWeight: '500' as const,
  },
  activityDetail: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '2px',
  },
  activityTime: {
    fontSize: '12px',
    color: WhatsAppColors.textSecondary,
  },
  loadingText: {
    textAlign: 'center' as const,
    padding: '40px',
    color: WhatsAppColors.textSecondary,
    fontSize: '15px',
  },
  clickableCard: {
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // 在客户端挂载后初始化时间
  useEffect(() => {
    setLastUpdate(new Date());
  }, []);
  
  // 统计数据状态
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [messageStats, setMessageStats] = useState<any>(null);
  const [activityStats, setActivityStats] = useState<any>(null);
  const [batchStats, setBatchStats] = useState<any>(null);

  // 加载所有数据
  const loadAllData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [statusData, overviewData, messagesData, activityData, batchData] = await Promise.all([
        api.getStatus().catch(() => null),
        api.stats.overview().catch(() => null),
        api.stats.messages().catch(() => null),
        api.stats.activity().catch(() => null),
        api.batch.getStats().catch(() => null),
      ]);
      
      if (statusData) setStatus(statusData);
      if (overviewData) setOverviewStats(overviewData);
      if (messagesData) setMessageStats(messagesData);
      if (activityData) setActivityStats(activityData);
      if (batchData) setBatchStats(batchData);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    
    // 每 30 秒自动刷新
    const interval = setInterval(() => {
      loadAllData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadAllData]);

  // WebSocket 实时更新
  useWebSocket({
    onStatusUpdate: (newStatus) => {
      console.log('收到 WhatsApp 状态更新:', newStatus);
      setStatus((prev: any) => ({ ...prev, ...newStatus }));
    },
    onNewMessage: () => {
      console.log('收到新消息，刷新统计数据');
      loadAllData(true);
    },
  });

  const handleLogin = async () => {
    try {
      await api.startLogin();
      console.log('登录流程已启动');
      setShowQRDialog(true);
    } catch (error) {
      console.error('启动登录失败:', error);
      alert('启动登录失败，请重试');
    }
  };

  const getStatusBadge = () => {
    if (!status) return { text: '未知', style: styles.badgeError };
    
    const statusText = String(status.status || '').toUpperCase();
    if (statusText === 'READY') {
      return { text: '已连接', style: styles.badgeSuccess };
    }
    if (statusText === 'QR') {
      return { text: '待扫码', style: styles.badgeWarning };
    }
    return { text: '离线', style: styles.badgeError };
  };

  const statusBadge = getStatusBadge();

  // 格式化时间
  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // 格式化相对时间
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return `${days} 天前`;
  };

  // 准备图表数据
  const messagesTrendData = useMemo(() => {
    if (!messageStats?.weeklyTrend) return [];
    return messageStats.weeklyTrend.map((day: any) => ({
      date: new Date(day.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
      消息数: day.count,
    }));
  }, [messageStats]);

  const successRateData = useMemo(() => {
    if (!messageStats?.today) return [];
    const { success = 0, failed = 0 } = messageStats.today;
    return [
      { name: '成功', value: success, color: WhatsAppColors.accent },
      { name: '失败', value: failed, color: '#e74c3c' },
    ];
  }, [messageStats]);

  const batchOperationsData = useMemo(() => {
    if (!batchStats?.byType) return [];
    return Object.entries(batchStats.byType).map(([name, value]: [string, any]) => ({
      name: name === 'import' ? '导入' : name === 'send' ? '发送' : name === 'tag' ? '标签' : name === 'delete' ? '删除' : name,
      数量: value,
    }));
  }, [batchStats]);

  // 准备活动流数据
  const activities = useMemo(() => {
    const result: any[] = [];
    
    // 添加最近联系人活动
    if (activityStats?.recentContacts) {
      activityStats.recentContacts.slice(0, 5).forEach((contact: any) => {
        result.push({
          type: 'contact',
          icon: '👤',
          text: `与 ${contact.name} 的对话`,
          detail: `${contact.messageCount} 条消息`,
          time: contact.lastActivity,
          onClick: () => router.push('/chat'),
        });
      });
    }
    
    // 添加最近批量操作
    if (activityStats?.recentBatches) {
      activityStats.recentBatches.slice(0, 5).forEach((batch: any) => {
        result.push({
          type: 'batch',
          icon: '⚡',
          text: batch.title || '批量操作',
          detail: `${batch.successCount}/${batch.totalCount} 成功`,
          time: batch.createdAt,
          onClick: () => router.push('/batch'),
        });
      });
    }
    
    // 按时间排序
    result.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    
    return result.slice(0, 10);
  }, [activityStats, router]);

  // 左侧面板
  const listPanel = (
    <>
      <div style={styles.listHeader}>
        <div style={styles.headerTitle}>仪表盘</div>
        <div style={styles.headerSubtitle}>系统概览</div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>总联系人</div>
          <div style={styles.statValue}>{overviewStats?.contacts?.total || 0}</div>
          <div style={styles.statHint}>活跃：{overviewStats?.contacts?.active || 0}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>今日消息</div>
          <div style={styles.statValue}>{messageStats?.today?.total || 0}</div>
          <div style={styles.statHint}>发送：{messageStats?.today?.sent || 0}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>批量操作</div>
          <div style={styles.statValue}>{batchStats?.total || 0}</div>
          <div style={styles.statHint}>成功率：{batchStats?.successRate || 0}%</div>
        </div>
      </div>

      <div style={styles.statusSection}>
        <div style={styles.sectionTitle}>系统状态</div>
        <div style={styles.statusCard}>
          <div style={styles.statusRow}>
            <span style={styles.statusLabel}>WhatsApp</span>
            <span style={{ ...styles.badge, ...statusBadge.style }}>
              {statusBadge.text}
            </span>
          </div>
          {status?.phoneE164 && (
            <div style={styles.statusRow}>
              <span style={styles.statusLabel}>账号</span>
              <span style={styles.statusValue}>{status.phoneE164}</span>
            </div>
          )}
          
          {statusBadge.text !== '已连接' && (
            <button
              style={styles.actionButton}
              onClick={handleLogin}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
              }}
            >
              扫码登录
            </button>
          )}
        </div>
      </div>

      {/* 快捷操作 */}
      <div style={styles.statusSection}>
        <div style={styles.sectionTitle}>快捷操作</div>
        <button
          style={styles.quickActionButton}
          onClick={() => router.push('/chat')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.background;
          }}
        >
          <span>💬</span> 对话
        </button>
        <button
          style={styles.quickActionButton}
          onClick={() => router.push('/contacts')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.background;
          }}
        >
          <span>👥</span> 联系人
        </button>
        <button
          style={styles.quickActionButton}
          onClick={() => router.push('/batch')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.background;
          }}
        >
          <span>⚡</span> 批量操作
        </button>
        <button
          style={styles.quickActionButton}
          onClick={() => router.push('/templates')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.background;
          }}
        >
          <span>📄</span> 模板
        </button>
        <button
          style={styles.quickActionButton}
          onClick={() => router.push('/knowledge')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.background;
          }}
        >
          <span>💡</span> 知识库
        </button>
        <button
          style={styles.quickActionButton}
          onClick={() => router.push('/settings')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.background;
          }}
        >
          <span>⚙️</span> 设置
        </button>
      </div>
    </>
  );

  // 主内容区
  const mainContent = (
    <div style={styles.mainPanel}>
      <div style={styles.mainHeader}>
        <div>
          <div style={styles.mainTitle}>WhatsApp 自动化系统</div>
          <div style={styles.mainSubtitle}>
            智能客服 · 自动养号 · 批量营销
          </div>
          <div style={styles.lastUpdate}>
            最后更新：{formatTime(lastUpdate)}
          </div>
        </div>
        <button
          style={styles.refreshButton}
          onClick={() => loadAllData(true)}
          disabled={refreshing}
          onMouseEnter={(e) => {
            if (!refreshing) {
              e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!refreshing) {
              e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
            }
          }}
        >
          <span>{refreshing ? '刷新中...' : '🔄 刷新数据'}</span>
        </button>
      </div>

      <div style={styles.mainBody}>
        {loading ? (
          <div style={styles.loadingText}>加载数据中...</div>
        ) : (
          <>
            {/* 核心统计卡片网格 */}
            <div style={styles.cardsGrid}>
              <div
                onClick={() => router.push('/chat')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                style={styles.clickableCard}
              >
                <StatCard
                  title="今日发送"
                  value={messageStats?.today?.sent || 0}
                  icon="📤"
                  color={WhatsAppColors.accent}
                  subtitle="点击查看对话"
                />
              </div>
              
              <div
                onClick={() => router.push('/chat')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                style={styles.clickableCard}
              >
                <StatCard
                  title="今日接收"
                  value={messageStats?.today?.received || 0}
                  icon="📥"
                  color="#3498db"
                  subtitle="点击查看对话"
                />
              </div>
              
              <div
                onClick={() => router.push('/chat')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                style={styles.clickableCard}
              >
                <StatCard
                  title="消息成功率"
                  value={`${messageStats?.today?.successRate || 100}%`}
                  icon="✅"
                  color="#00a884"
                  subtitle="本周表现"
                />
              </div>
              
              <div
                onClick={() => router.push('/contacts')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                style={styles.clickableCard}
              >
                <StatCard
                  title="联系人总数"
                  value={overviewStats?.contacts?.total || 0}
                  icon="👥"
                  color="#9b59b6"
                  subtitle={`活跃：${overviewStats?.contacts?.active || 0}`}
                />
              </div>
              
              <div
                onClick={() => router.push('/templates')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                style={styles.clickableCard}
              >
                <StatCard
                  title="模板数量"
                  value={overviewStats?.templates?.total || 0}
                  icon="📄"
                  color="#f39c12"
                  subtitle="点击查看模板"
                />
              </div>
              
              <div
                onClick={() => router.push('/batch')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                style={styles.clickableCard}
              >
                <StatCard
                  title="批量操作"
                  value={batchStats?.total || 0}
                  icon="⚡"
                  color="#e67e22"
                  subtitle={`成功率：${batchStats?.successRate || 0}%`}
                />
              </div>
              
              <div
                onClick={() => router.push('/knowledge')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                style={styles.clickableCard}
              >
                <StatCard
                  title="知识库"
                  value={overviewStats?.knowledge?.total || 0}
                  icon="💡"
                  color="#1abc9c"
                  subtitle="点击查看知识库"
                />
              </div>
              
              <div
                onClick={() => router.push('/chat')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                style={styles.clickableCard}
              >
                <StatCard
                  title="活跃会话"
                  value={overviewStats?.threads?.total || 0}
                  icon="🔄"
                  color="#3498db"
                  subtitle="点击查看会话"
                />
              </div>
            </div>

            {/* 图表区域 */}
            <div style={styles.chartsSection}>
              <div style={styles.chartRow}>
                {messagesTrendData.length > 0 && (
                  <div style={styles.chartContainer}>
                    <LineChart
                      data={messagesTrendData}
                      lines={[
                        { dataKey: '消息数', name: '消息数', color: WhatsAppColors.accent },
                      ]}
                      title="本周消息趋势"
                      height={250}
                    />
                  </div>
                )}
                
                {successRateData.length > 0 && successRateData.some(d => d.value > 0) && (
                  <div style={styles.chartContainer}>
                    <PieChart
                      data={successRateData}
                      title="今日消息成功率"
                      height={250}
                    />
                  </div>
                )}
              </div>
              
              {batchOperationsData.length > 0 && (
                <div style={styles.chartContainer}>
                  <BarChart
                    data={batchOperationsData}
                    bars={[
                      { dataKey: '数量', name: '操作数量', color: WhatsAppColors.accent },
                    ]}
                    title="批量操作统计"
                    height={250}
                    layout="vertical"
                  />
                </div>
              )}
            </div>

            {/* 最近活动 */}
            {activities.length > 0 && (
              <div style={styles.activitySection}>
                <div style={styles.activityHeader}>最近活动</div>
                {activities.map((activity, index) => (
                  <div
                    key={index}
                    style={styles.activityCard}
                    onClick={activity.onClick}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = WhatsAppColors.background;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = WhatsAppColors.panelBackground;
                    }}
                  >
                    <div style={styles.activityIcon}>{activity.icon}</div>
                    <div style={styles.activityContent}>
                      <div style={styles.activityText}>{activity.text}</div>
                      <div style={styles.activityDetail}>{activity.detail}</div>
                      <div style={styles.activityTime}>{formatRelativeTime(activity.time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
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
      <QRCodeDialog
        isOpen={showQRDialog}
        onClose={() => setShowQRDialog(false)}
        onSuccess={() => {
          setShowQRDialog(false);
          loadAllData();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }}
      />
    </>
  );
}
