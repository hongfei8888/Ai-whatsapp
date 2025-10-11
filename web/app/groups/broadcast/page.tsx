'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WhatsAppLayout from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import GroupsNavigation from '@/components/groups/Navigation';
import EmptyState from '@/components/groups/EmptyState';
import SkeletonCard from '@/components/groups/SkeletonCard';
import { api } from '@/lib/api';
import { useWebSocket } from '@/lib/useWebSocket';

const THEME_COLOR = '#00a884';
const BG_COLOR = '#f0f2f5';
const WHITE = '#ffffff';
const BORDER_COLOR = '#e9edef';
const TEXT_PRIMARY = '#111b21';
const TEXT_SECONDARY = '#667781';

type BroadcastStatus = 'pending' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  mediaUrl?: string | null;
  targetGroupIds: string[];
  totalGroups: number;
  status: BroadcastStatus;
  progress: number;
  sentCount: number;
  failedCount: number;
  scheduledAt?: string | null;
  result?: any;
  errorMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

interface WhatsAppGroup {
  id: string;
  groupId: string;
  name: string;
  memberCount: number;
  isActive: boolean;
}

export default function BroadcastPage() {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // 创建任务对话框
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [scheduled, setScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [ratePerMinute, setRatePerMinute] = useState(10);
  const [creating, setCreating] = useState(false);

  // WebSocket 实时更新
  useWebSocket({
    onBroadcastProgress: (data) => {
      setBroadcasts(prev => prev.map(broadcast => 
        broadcast.id === data.broadcastId
          ? { ...broadcast, progress: data.progress, sentCount: data.sentCount, failedCount: data.failedCount }
          : broadcast
      ));
    },
  });

  // 加载任务列表
  const loadBroadcasts = async () => {
    try {
      setLoading(true);
      const response = await api.groups.listBroadcasts({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      });
      setBroadcasts(response.broadcasts || []);
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载群组列表
  const loadGroups = async () => {
    try {
      const response = await api.groups.list({ isActive: true, limit: 1000 });
      setGroups(response.groups || []);
    } catch (error) {
      console.error('加载群组失败:', error);
    }
  };

  // 同步群组
  const handleSyncGroups = async () => {
    try {
      await api.groups.sync();
      alert('群组同步成功');
      loadGroups();
    } catch (error: any) {
      alert('同步失败：' + error.message);
    }
  };

  useEffect(() => {
    loadBroadcasts();
    loadGroups();
    const interval = setInterval(loadBroadcasts, 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  // 创建任务
  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      alert('请输入任务标题');
      return;
    }

    if (!message.trim()) {
      alert('请输入消息内容');
      return;
    }

    if (selectedGroups.length === 0) {
      alert('请至少选择一个群组');
      return;
    }

    try {
      setCreating(true);
      
      let scheduledAt: string | undefined;
      if (scheduled && scheduledDate && scheduledTime) {
        scheduledAt = `${scheduledDate}T${scheduledTime}:00`;
      }

      await api.groups.broadcast({
        title: taskTitle,
        message,
        targetGroupIds: selectedGroups,
        scheduledAt,
        ratePerMinute,
      });
      
      alert(`任务创建成功！将向 ${selectedGroups.length} 个群组发送消息`);
      setShowCreateDialog(false);
      setTaskTitle('');
      setMessage('');
      setSelectedGroups([]);
      setScheduled(false);
      loadBroadcasts();
    } catch (error: any) {
      console.error('创建任务失败:', error);
      alert('创建任务失败：' + error.message);
    } finally {
      setCreating(false);
    }
  };

  // 暂停任务
  const handlePauseBroadcast = async (broadcastId: string) => {
    try {
      await api.groups.pauseBroadcast(broadcastId);
      alert('任务已暂停');
      loadBroadcasts();
    } catch (error: any) {
      alert('暂停任务失败：' + error.message);
    }
  };

  // 恢复任务
  const handleResumeBroadcast = async (broadcastId: string) => {
    try {
      await api.groups.resumeBroadcast(broadcastId);
      alert('任务已恢复');
      loadBroadcasts();
    } catch (error: any) {
      alert('恢复任务失败：' + error.message);
    }
  };

  // 取消任务
  const handleCancelBroadcast = async (broadcastId: string) => {
    if (!confirm('确定要取消这个任务吗？')) {
      return;
    }

    try {
      await api.groups.cancelBroadcast(broadcastId);
      alert('任务已取消');
      loadBroadcasts();
    } catch (error: any) {
      alert('取消任务失败：' + error.message);
    }
  };

  // 状态显示
  const getStatusBadge = (status: BroadcastStatus) => {
    const statusConfig: Record<BroadcastStatus, { text: string; color: string; bg: string }> = {
      pending: { text: '待执行', color: '#54656f', bg: '#f0f2f5' },
      scheduled: { text: '已定时', color: '#0084ff', bg: '#d9edff' },
      running: { text: '发送中', color: THEME_COLOR, bg: '#d1f4dd' },
      paused: { text: '已暂停', color: '#ff9900', bg: '#fff4e5' },
      completed: { text: '已完成', color: '#00a884', bg: '#d1f4dd' },
      failed: { text: '失败', color: '#df3333', bg: '#fddede' },
      cancelled: { text: '已取消', color: '#54656f', bg: '#f0f2f5' },
    };

    const config = statusConfig[status];

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          color: config.color,
          backgroundColor: config.bg,
        }}
      >
        {config.text}
      </span>
    );
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const filteredBroadcasts = broadcasts.filter(broadcast => {
    if (searchQuery && !broadcast.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <WhatsAppLayout
      sidebar={<Sidebar />}
      mainContent={
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: WHITE }}>
        {/* 顶部导航标签 */}
        <GroupsNavigation />

        {/* 顶部工具栏 */}
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            borderBottom: `1px solid ${BORDER_COLOR}`,
            backgroundColor: WHITE,
          }}
        >
          <input
            type="text"
            placeholder="请输入任务名称"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: `1px solid ${BORDER_COLOR}`,
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${BORDER_COLOR}`,
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: WHITE,
              cursor: 'pointer',
            }}
          >
            <option value="all">全部任务</option>
            <option value="pending">待执行</option>
            <option value="scheduled">已定时</option>
            <option value="running">发送中</option>
            <option value="paused">已暂停</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
            <option value="cancelled">已取消</option>
          </select>

          <button
            onClick={() => loadBroadcasts()}
            style={{
              padding: '8px 16px',
              backgroundColor: WHITE,
              border: `1px solid ${BORDER_COLOR}`,
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              color: TEXT_PRIMARY,
            }}
          >
            🔄 搜索
          </button>

          <button
            onClick={handleSyncGroups}
            style={{
              padding: '8px 16px',
              backgroundColor: WHITE,
              border: `1px solid ${BORDER_COLOR}`,
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              color: TEXT_PRIMARY,
            }}
          >
            🔄 同步群组
          </button>

          <button
            onClick={() => setShowCreateDialog(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: THEME_COLOR,
              border: 'none',
              borderRadius: '8px',
              color: WHITE,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            + 创建任务
          </button>
        </div>

        {/* 任务列表表格 */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: BG_COLOR }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: TEXT_SECONDARY }}>
              加载中...
            </div>
          ) : filteredBroadcasts.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: TEXT_SECONDARY }}>
              暂无数据
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: WHITE }}>
              <thead>
                <tr style={{ backgroundColor: BG_COLOR, borderBottom: `1px solid ${BORDER_COLOR}` }}>
                  <th style={tableHeaderStyle}>任务</th>
                  <th style={tableHeaderStyle}>发送账号</th>
                  <th style={tableHeaderStyle}>计划发送</th>
                  <th style={tableHeaderStyle}>已发送</th>
                  <th style={tableHeaderStyle}>失败</th>
                  <th style={tableHeaderStyle}>状态</th>
                  <th style={tableHeaderStyle}>计划开始时间</th>
                  <th style={tableHeaderStyle}>开始时间</th>
                  <th style={tableHeaderStyle}>结束时间</th>
                  <th style={tableHeaderStyle}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredBroadcasts.map((broadcast) => (
                  <tr key={broadcast.id} style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: '500', color: TEXT_PRIMARY }}>{broadcast.title}</div>
                      {broadcast.status === 'running' && (
                        <div style={{ marginTop: '4px', fontSize: '12px', color: TEXT_SECONDARY }}>
                          进度: {broadcast.progress}%
                        </div>
                      )}
                    </td>
                    <td style={tableCellStyle}>系统账号</td>
                    <td style={tableCellStyle}>{broadcast.totalGroups}</td>
                    <td style={tableCellStyle}>
                      <span style={{ color: THEME_COLOR, fontWeight: '500' }}>
                        {broadcast.sentCount}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{ color: '#df3333', fontWeight: '500' }}>
                        {broadcast.failedCount}
                      </span>
                    </td>
                    <td style={tableCellStyle}>{getStatusBadge(broadcast.status)}</td>
                    <td style={tableCellStyle}>{formatTime(broadcast.scheduledAt)}</td>
                    <td style={tableCellStyle}>{formatTime(broadcast.startedAt)}</td>
                    <td style={tableCellStyle}>{formatTime(broadcast.completedAt)}</td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {broadcast.status === 'running' && (
                          <button
                            onClick={() => handlePauseBroadcast(broadcast.id)}
                            style={actionButtonStyle}
                          >
                            暂停
                          </button>
                        )}
                        {broadcast.status === 'paused' && (
                          <button
                            onClick={() => handleResumeBroadcast(broadcast.id)}
                            style={actionButtonStyle}
                          >
                            恢复
                          </button>
                        )}
                        {['pending', 'running', 'paused', 'scheduled'].includes(broadcast.status) && (
                          <button
                            onClick={() => handleCancelBroadcast(broadcast.id)}
                            style={actionButtonStyle}
                          >
                            取消
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 分页 */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: `1px solid ${BORDER_COLOR}`,
            backgroundColor: WHITE,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '14px', color: TEXT_SECONDARY }}>
            共 {filteredBroadcasts.length} 条
          </div>
        </div>

        {/* 创建任务对话框 */}
        {showCreateDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateDialog(false)}
        >
          <div
            style={{
              backgroundColor: WHITE,
              borderRadius: '12px',
              padding: '24px',
              width: '700px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: TEXT_PRIMARY }}>
              创建群发任务
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>任务标题</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="例如：周末促销活动"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>消息内容</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="输入要发送的消息内容..."
                rows={5}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                选择群组 ({selectedGroups.length} / {groups.length})
              </label>
              <div
                style={{
                  maxHeight: '200px',
                  overflow: 'auto',
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: BG_COLOR,
                }}
              >
                {groups.length === 0 ? (
                  <div style={{ textAlign: 'center', color: TEXT_SECONDARY, padding: '20px' }}>
                    暂无群组，请先同步群组
                  </div>
                ) : (
                  groups.map((group) => (
                    <label
                      key={group.groupId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        marginBottom: '4px',
                        backgroundColor: selectedGroups.includes(group.groupId) ? WHITE : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group.groupId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroups([...selectedGroups, group.groupId]);
                          } else {
                            setSelectedGroups(selectedGroups.filter(id => id !== group.groupId));
                          }
                        }}
                        style={{ marginRight: '8px' }}
                      />
                      <span style={{ flex: 1, fontSize: '14px', color: TEXT_PRIMARY }}>
                        {group.name}
                      </span>
                      <span style={{ fontSize: '12px', color: TEXT_SECONDARY }}>
                        {group.memberCount} 成员
                      </span>
                    </label>
                  ))
                )}
              </div>
              {groups.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedGroups(groups.map(g => g.groupId))}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${BORDER_COLOR}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: TEXT_PRIMARY,
                    }}
                  >
                    全选
                  </button>
                  <button
                    onClick={() => setSelectedGroups([])}
                    style={{
                      padding: '4px 12px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${BORDER_COLOR}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: TEXT_PRIMARY,
                    }}
                  >
                    清空
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={scheduled}
                  onChange={(e) => setScheduled(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', color: TEXT_PRIMARY }}>定时发送</span>
              </label>
            </div>

            {scheduled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>日期</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>时间</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>发送速率（条/分钟）</label>
              <input
                type="number"
                value={ratePerMinute}
                onChange={(e) => setRatePerMinute(Number(e.target.value))}
                min={1}
                max={60}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateDialog(false)}
                disabled={creating}
                style={{
                  padding: '10px 20px',
                  backgroundColor: WHITE,
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  color: TEXT_PRIMARY,
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateTask}
                disabled={creating}
                style={{
                  padding: '10px 20px',
                  backgroundColor: creating ? '#ccc' : THEME_COLOR,
                  border: 'none',
                  borderRadius: '8px',
                  color: WHITE,
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: creating ? 'not-allowed' : 'pointer',
                }}
              >
                {creating ? '创建中...' : '创建任务'}
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
      }
      hideListPanel={true}
    />
  );
}

// 样式
const tableHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: '600',
  color: TEXT_SECONDARY,
};

const tableCellStyle: React.CSSProperties = {
  padding: '16px',
  fontSize: '14px',
  color: TEXT_PRIMARY,
};

const actionButtonStyle: React.CSSProperties = {
  padding: '4px 12px',
  backgroundColor: 'transparent',
  border: `1px solid ${BORDER_COLOR}`,
  borderRadius: '6px',
  fontSize: '13px',
  cursor: 'pointer',
  color: TEXT_SECONDARY,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '14px',
  fontWeight: '500',
  color: TEXT_PRIMARY,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: `1px solid ${BORDER_COLOR}`,
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};
