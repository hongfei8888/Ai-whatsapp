'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import WhatsAppLayout, { WhatsAppColors } from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import StatCard from '@/components/StatCard';
// 使用动态导入避免 SSR 问题
import { 
  LineChart,
  PieChart,
  BarChart,
  AreaChart,
  StackedBarChart,
  HeatMap
} from '@/components/charts/ClientOnlyChart';
import TopList from '@/components/TopList';
import DateRangePicker, { DateRange } from '@/components/DateRangePicker';
import ThemeToggle from '@/components/ThemeToggle';
import AlertSettings from '@/components/AlertSettings';
import { api } from '@/lib/api';
import QRCodeDialog from '@/components/QRCodeDialog';
import { useWebSocket } from '@/lib/useWebSocket';
import { useTheme } from '@/lib/theme-context';
import { AccountGuard } from '@/components/AccountGuard';
import { useAccount } from '@/lib/account-context';
import { useAccountSwitchRefresh } from '@/hooks/useAccountSwitch';

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
  errorContainer: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    border: '1px solid rgba(231, 76, 60, 0.3)',
    borderRadius: '12px',
    padding: '20px',
    margin: '20px',
    textAlign: 'center' as const,
  },
  errorIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  errorTitle: {
    fontSize: '18px',
    fontWeight: '600' as const,
    color: '#e74c3c',
    marginBottom: '8px',
  },
  errorMessage: {
    fontSize: '14px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '16px',
  },
  retryButton: {
    padding: '10px 24px',
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  skeletonCard: {
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${WhatsAppColors.border}`,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  skeletonBar: {
    height: '12px',
    backgroundColor: WhatsAppColors.border,
    borderRadius: '6px',
    marginBottom: '8px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 在客户端挂载后初始化时间
  useEffect(() => {
    setLastUpdate(new Date());
  }, []);
  
  // 统计数据状态
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [messageStats, setMessageStats] = useState<any>(null);
  const [activityStats, setActivityStats] = useState<any>(null);
  const [batchStats, setBatchStats] = useState<any>(null);
  const [groupStats, setGroupStats] = useState<any>(null);

  // 新增：时间范围状态
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 6)),
    endDate: new Date(),
    preset: '7days',
  });

  // 新增：TOP榜单数据
  const [topGroups, setTopGroups] = useState<any[]>([]);
  const [topContacts, setTopContacts] = useState<any[]>([]);
  const [topTemplates, setTopTemplates] = useState<any[]>([]);
  const [topResponseTimes, setTopResponseTimes] = useState<any[]>([]);
  const [topBatchSuccess, setTopBatchSuccess] = useState<any[]>([]);
  
  // 新增：热力图数据
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  // 新增：显示告警设置面板
  const [showAlertSettings, setShowAlertSettings] = useState(false);

  // 加载所有数据
  const { currentAccountId, currentAccount, hasAccounts } = useAccount();

  const loadAllData = useCallback(async (isRefresh = false) => {
    // 🔥 如果没有账号，不尝试加载数据
    if (!hasAccounts || !currentAccountId) {
      console.log('没有可用账号，跳过数据加载');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // 🔥 检查当前账号是否在线（防止使用已停止的账号）
    if (!currentAccount || currentAccount.status === 'offline' || currentAccount.status === 'DISCONNECTED' || currentAccount.status === 'FAILED') {
      console.warn(`当前账号 ${currentAccountId} 不在线，跳过数据加载。状态: ${currentAccount?.status}`);
      setLoading(false);
      setRefreshing(false);
      setError('当前账号未连接，请先启动账号或选择其他在线账号');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null); // 清除之前的错误

      const [statusData, overviewData, messagesData, activityData, batchData, groupData] = await Promise.all([
        currentAccountId ? api.accounts.getStatus(currentAccountId).catch((err) => {
          console.error('获取状态失败:', err);
          return null;
        }) : Promise.resolve(null),
        api.stats.overview().catch((err) => {
          console.error('获取总览统计失败:', err);
          return null;
        }),
        api.stats.messages().catch((err) => {
          console.error('获取消息统计失败:', err);
          return null;
        }),
        api.stats.activity().catch((err) => {
          console.error('获取活动统计失败:', err);
          return null;
        }),
        api.batch.getStats().catch((err) => {
          console.error('获取批量操作统计失败:', err);
          return null;
        }),
        api.groups.getOverviewStats().catch((err) => {
          console.error('获取群组统计失败:', err);
          return null;
        }),
      ]);
      
      // 检查是否所有请求都失败了
      if (!statusData && !overviewData && !messagesData && !activityData && !batchData && !groupData) {
        setError('无法连接到后端服务，请检查网络连接或确保后端服务正常运行');
      } else {
        if (statusData) setStatus(statusData.data || statusData);
        if (overviewData) setOverviewStats(overviewData);
        if (messagesData) setMessageStats(messagesData);
        if (activityData) setActivityStats(activityData);
        if (batchData) setBatchStats(batchData);
        if (groupData) setGroupStats(groupData);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setError(error instanceof Error ? error.message : '加载数据失败，请重试');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hasAccounts, currentAccountId, currentAccount]);

  // 新增：加载TOP榜单和热力图数据
  const loadTopData = useCallback(async () => {
    try {
      const params = {
        startDate: dateRange.startDate?.toISOString(),
        endDate: dateRange.endDate?.toISOString(),
      };

      const [groups, contacts, templates, responseTimes, batchSuccess, heatmap] = await Promise.all([
        api.stats.topGroups(params).catch((err) => {
          console.warn('加载top groups失败:', err);
          return [];
        }),
        api.stats.topContacts(params).catch((err) => {
          console.warn('加载top contacts失败:', err);
          return [];
        }),
        api.stats.topTemplates(params).catch((err) => {
          console.warn('加载top templates失败:', err);
          return [];
        }),
        api.stats.topResponseTimes(params).catch((err) => {
          console.warn('加载top response times失败:', err);
          return [];
        }),
        api.stats.topBatchSuccess(params).catch((err) => {
          console.warn('加载top batch success失败:', err);
          return [];
        }),
        api.stats.heatmap(params).catch((err) => {
          console.warn('加载heatmap失败:', err);
          return [];
        }),
      ]);

      setTopGroups(groups);
      setTopContacts(contacts);
      setTopTemplates(templates);
      setTopResponseTimes(responseTimes);
      setTopBatchSuccess(batchSuccess);
      setHeatmapData(heatmap);
    } catch (error) {
      console.error('加载TOP数据失败:', error);
    }
  }, [dateRange]);

  // 监听账号切换事件
  useAccountSwitchRefresh(() => {
    if (hasAccounts && currentAccountId) {
      loadAllData();
      loadTopData();
    }
  });

  useEffect(() => {
    // 🔥 只有在有账号时才加载数据
    if (hasAccounts && currentAccountId) {
      loadAllData();
      loadTopData();
    }
    
    // 每 30 秒自动刷新
    const interval = setInterval(() => {
      if (hasAccounts && currentAccountId) {
        loadAllData(true);
        loadTopData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadAllData, loadTopData, hasAccounts, currentAccountId]);

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
      await api.auth.startLogin();
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
          <div style={styles.statLabel}>群组总数</div>
          <div style={styles.statValue}>{groupStats?.totalGroups || overviewStats?.groups?.total || 0}</div>
          <div style={styles.statHint}>监控：{groupStats?.monitoringGroups || overviewStats?.groups?.monitoring || 0}</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statLabel}>群组成员</div>
          <div style={styles.statValue}>{groupStats?.totalMembers || 0}</div>
          <div style={styles.statHint}>活跃：{groupStats?.activeMembers || 0}</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.statLabel}>群组消息</div>
          <div style={styles.statValue}>{groupStats?.totalMessages || 0}</div>
          <div style={styles.statHint}>今日：{groupStats?.todayMessages || 0}</div>
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
      <div style={{ ...styles.statusSection, paddingBottom: '24px' }}>
        <div style={styles.sectionTitle}>快捷操作</div>
        <button
          style={{
            ...styles.quickActionButton,
            backgroundColor: colors.background,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
          }}
          onClick={() => router.push('/chat')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.background;
          }}
        >
          <span>💬</span> 对话
        </button>
        <button
          style={{
            ...styles.quickActionButton,
            backgroundColor: colors.background,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
          }}
          onClick={() => router.push('/contacts')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.background;
          }}
        >
          <span>👥</span> 通讯录
        </button>
        <button
          style={{
            ...styles.quickActionButton,
            backgroundColor: colors.background,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
          }}
          onClick={() => router.push('/batch')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.background;
          }}
        >
          <span>⚡</span> 消息群发
        </button>
        <button
          style={{
            ...styles.quickActionButton,
            backgroundColor: colors.background,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
          }}
          onClick={() => router.push('/templates')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.background;
          }}
        >
          <span>📄</span> 消息模板
        </button>
        <button
          style={{
            ...styles.quickActionButton,
            backgroundColor: colors.background,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
          }}
          onClick={() => router.push('/knowledge')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.background;
          }}
        >
          <span>💡</span> 知识库
        </button>
        <button
          style={{
            ...styles.quickActionButton,
            backgroundColor: colors.background,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
          }}
          onClick={() => router.push('/groups')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.background;
          }}
        >
          <span>📱</span> 社群营销
        </button>
        <button
          style={{
            ...styles.quickActionButton,
            backgroundColor: colors.background,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
          }}
          onClick={() => router.push('/settings')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.background;
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
            智能客服 · 自动养号 · 批量营销 · 群组管理
          </div>
          <div style={styles.lastUpdate}>
            最后更新：{formatTime(lastUpdate)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <ThemeToggle />
          <button
            style={{
              ...styles.refreshButton,
              padding: '10px 16px',
            }}
            onClick={() => setShowAlertSettings(!showAlertSettings)}
            title="告警设置"
          >
            <span>📢</span>
          </button>
          <button
            style={styles.refreshButton}
            onClick={() => {
              loadAllData(true);
              loadTopData();
            }}
            disabled={refreshing}
            onMouseEnter={(e) => {
              if (!refreshing) {
                e.currentTarget.style.backgroundColor = colors.accentHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!refreshing) {
                e.currentTarget.style.backgroundColor = colors.accent;
              }
            }}
          >
            <span>{refreshing ? '刷新中...' : '🔄 刷新数据'}</span>
          </button>
        </div>
      </div>

      <div style={styles.mainBody}>
        {error ? (
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>⚠️</div>
            <div style={styles.errorTitle}>加载失败</div>
            <div style={styles.errorMessage}>{error}</div>
            <button
              style={styles.retryButton}
              onClick={() => loadAllData()}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
              }}
            >
              🔄 重试
            </button>
          </div>
        ) : loading ? (
          <>
            {/* 骨架屏加载效果 */}
            <div style={styles.cardsGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} style={styles.skeletonCard}>
                  <div style={{...styles.skeletonBar, width: '60%', marginBottom: '12px'}}></div>
                  <div style={{...styles.skeletonBar, width: '40%', height: '32px', marginBottom: '8px'}}></div>
                  <div style={{...styles.skeletonBar, width: '80%', height: '10px'}}></div>
                </div>
              ))}
            </div>
          </>
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
                  title="通讯录总数"
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
              
              <div
                onClick={() => router.push('/groups')}
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
                  title="群组管理"
                  value={groupStats?.totalGroups || overviewStats?.groups?.total || 0}
                  icon="📱"
                  color="#e67e22"
                  subtitle={`监控中：${groupStats?.monitoringGroups || overviewStats?.groups?.monitoring || 0}`}
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
                  title="群组成员"
                  value={groupStats?.totalMembers || 0}
                  icon="👥"
                  color="#8e44ad"
                  subtitle={`活跃：${groupStats?.activeMembers || 0}`}
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
                  title="群组消息"
                  value={groupStats?.totalMessages || 0}
                  icon="💬"
                  color="#16a085"
                  subtitle={`今日：${groupStats?.todayMessages || 0}`}
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

            {/* 新增：告警设置面板 */}
            {showAlertSettings && (
              <div style={{ marginBottom: '30px' }}>
                <AlertSettings />
              </div>
            )}

            {/* 新增：热力图 */}
            {heatmapData.length > 0 && (
              <div style={{ ...styles.chartContainer, marginBottom: '30px' }}>
                <HeatMap
                  data={heatmapData}
                  title="📊 消息活动热力图（7天×24小时）"
                  height={300}
                />
              </div>
            )}

            {/* 新增：TOP榜单区域 */}
            <div style={styles.chartsSection}>
              <div style={{ ...styles.chartRow, gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                {topGroups.length > 0 && (
                  <TopList
                    title="🏆 最活跃群组 TOP10"
                    icon="🏘️"
                    items={topGroups.map((g: any) => ({
                      id: g.id,
                      name: g.name,
                      value: g.messageCount,
                      subtitle: `${g.memberCount} 成员`,
                      onClick: () => router.push(`/groups`),
                    }))}
                    valueFormatter={(v) => `${v} 条消息`}
                  />
                )}

                {topContacts.length > 0 && (
                  <TopList
                    title="💬 最多消息联系人 TOP10"
                    icon="👤"
                    items={topContacts.map((c: any) => ({
                      id: c.id,
                      name: c.name || c.phoneE164,
                      value: c.messageCount,
                      subtitle: c.phoneE164,
                      onClick: () => router.push(`/chat`),
                    }))}
                    valueFormatter={(v) => `${v} 条`}
                  />
                )}
              </div>

              <div style={{ ...styles.chartRow, gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', marginTop: '20px' }}>
                {topResponseTimes.length > 0 && (
                  <TopList
                    title="⚡ 响应最快 TOP10"
                    icon="🚀"
                    items={topResponseTimes.map((r: any) => ({
                      id: r.threadId,
                      name: r.name || r.phoneE164,
                      value: r.responseCount,
                      subtitle: `平均 ${r.avgResponseTimeFormatted}`,
                      onClick: () => router.push(`/chat`),
                    }))}
                    valueFormatter={(v) => `${v} 次响应`}
                  />
                )}

                {topBatchSuccess.length > 0 && (
                  <TopList
                    title="✅ 批量操作成功率 TOP5"
                    icon="⚡"
                    items={topBatchSuccess.map((b: any) => ({
                      id: b.id,
                      name: b.title || `${b.type}操作`,
                      value: b.successRate,
                      subtitle: `${b.successCount}/${b.totalCount}`,
                      onClick: () => router.push(`/batch`),
                    }))}
                    valueFormatter={(v) => `${v}%`}
                  />
                )}
              </div>
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
    <AccountGuard
      title="需要账号访问仪表盘"
      description="请先添加一个 WhatsApp 账号以查看仪表盘数据。"
    >
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
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
    </AccountGuard>
  );
}
