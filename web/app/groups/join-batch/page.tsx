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

// 绿色主题色（根据用户截图）
const THEME_COLOR = '#00a884';
const BG_COLOR = '#f0f2f5';
const WHITE = '#ffffff';
const BORDER_COLOR = '#e9edef';
const TEXT_PRIMARY = '#111b21';
const TEXT_SECONDARY = '#667781';

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface JoinTask {
  id: string;
  title: string;
  inviteLinks: string[];
  totalLinks: number;
  status: TaskStatus;
  progress: number;
  joinedCount: number;
  failedCount: number;
  config?: any;
  result?: any;
  errorMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export default function JoinBatchPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'join' | 'broadcast' | 'monitoring'>('join');
  const [tasks, setTasks] = useState<JoinTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // 创建任务对话框
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [inviteLinksText, setInviteLinksText] = useState('');
  const [delayMin, setDelayMin] = useState(3);
  const [delayMax, setDelayMax] = useState(5);
  const [autoGreet, setAutoGreet] = useState(false);
  const [greetMessage, setGreetMessage] = useState('大家好！');
  const [creating, setCreating] = useState(false);

  // WebSocket 实时更新
  useWebSocket({
    onJoinTaskProgress: (data) => {
      setTasks(prev => prev.map(task => 
        task.id === data.taskId
          ? { ...task, progress: data.progress, joinedCount: data.joinedCount, failedCount: data.failedCount }
          : task
      ));
    },
  });

  // 加载任务列表
  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await api.groups.listJoinTasks({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      });
      setTasks(response.tasks || []);
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 5000);  // 每5秒刷新一次
    return () => clearInterval(interval);
  }, [statusFilter]);

  // 创建任务
  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      alert('请输入任务标题');
      return;
    }

    const links = inviteLinksText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && (line.includes('chat.whatsapp.com') || line.includes('wa.me')));

    if (links.length === 0) {
      alert('请输入至少一个有效的邀请链接');
      return;
    }

    try {
      setCreating(true);
      await api.groups.joinBatch({
        title: taskTitle,
        inviteLinks: links,
        config: {
          delayMin,
          delayMax,
          autoGreet,
          greetMessage: autoGreet ? greetMessage : undefined,
        },
      });
      
      alert(`任务创建成功！将加入 ${links.length} 个群组`);
      setShowCreateDialog(false);
      setTaskTitle('');
      setInviteLinksText('');
      loadTasks();
    } catch (error: any) {
      console.error('创建任务失败:', error);
      alert('创建任务失败：' + error.message);
    } finally {
      setCreating(false);
    }
  };

  // 取消任务
  const handleCancelTask = async (taskId: string) => {
    if (!confirm('确定要取消这个任务吗？')) {
      return;
    }

    try {
      await api.groups.cancelJoinTask(taskId);
      alert('任务已取消');
      loadTasks();
    } catch (error: any) {
      alert('取消任务失败：' + error.message);
    }
  };

  // 状态显示
  const getStatusBadge = (status: TaskStatus) => {
    const statusConfig: Record<TaskStatus, { text: string; color: string; bg: string }> = {
      pending: { text: '待执行', color: '#54656f', bg: '#f0f2f5' },
      running: { text: '运行中', color: THEME_COLOR, bg: '#d1f4dd' },
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

  // 格式化时间
  const formatTime = (dateString?: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 筛选任务
  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
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
            <option value="running">运行中</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
            <option value="cancelled">已取消</option>
          </select>

          <button
            onClick={() => loadTasks()}
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
          ) : filteredTasks.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: TEXT_SECONDARY }}>
              暂无数据
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: WHITE }}>
              <thead>
                <tr style={{ backgroundColor: BG_COLOR, borderBottom: `1px solid ${BORDER_COLOR}` }}>
                  <th style={tableHeaderStyle}>任务</th>
                  <th style={tableHeaderStyle}>账号</th>
                  <th style={tableHeaderStyle}>群链接</th>
                  <th style={tableHeaderStyle}>加入成功</th>
                  <th style={tableHeaderStyle}>加入失败</th>
                  <th style={tableHeaderStyle}>状态</th>
                  <th style={tableHeaderStyle}>开始时间</th>
                  <th style={tableHeaderStyle}>结束时间</th>
                  <th style={tableHeaderStyle}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id} style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
                    <td style={tableCellStyle}>
                      <div style={{ fontWeight: '500', color: TEXT_PRIMARY }}>{task.title}</div>
                      {task.status === 'running' && (
                        <div style={{ marginTop: '4px', fontSize: '12px', color: TEXT_SECONDARY }}>
                          进度: {task.progress}%
                        </div>
                      )}
                    </td>
                    <td style={tableCellStyle}>系统账号</td>
                    <td style={tableCellStyle}>{task.totalLinks}</td>
                    <td style={tableCellStyle}>
                      <span style={{ color: THEME_COLOR, fontWeight: '500' }}>
                        {task.joinedCount}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{ color: '#df3333', fontWeight: '500' }}>
                        {task.failedCount}
                      </span>
                    </td>
                    <td style={tableCellStyle}>{getStatusBadge(task.status)}</td>
                    <td style={tableCellStyle}>{formatTime(task.startedAt)}</td>
                    <td style={tableCellStyle}>{formatTime(task.completedAt)}</td>
                    <td style={tableCellStyle}>
                      {(task.status === 'pending' || task.status === 'running') && (
                        <button
                          onClick={() => handleCancelTask(task.id)}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: 'transparent',
                            border: `1px solid ${BORDER_COLOR}`,
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            color: TEXT_SECONDARY,
                          }}
                        >
                          取消
                        </button>
                      )}
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
            共 {filteredTasks.length} 条
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={paginationButtonStyle}>上一页</button>
            <button style={{ ...paginationButtonStyle, backgroundColor: THEME_COLOR, color: WHITE }}>
              1
            </button>
            <button style={paginationButtonStyle}>下一页</button>
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
              width: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: TEXT_PRIMARY }}>
              创建批量进群任务
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>任务标题</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="例如：批量加入客户群"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>
                邀请链接（每行一个）
              </label>
              <textarea
                value={inviteLinksText}
                onChange={(e) => setInviteLinksText(e.target.value)}
                placeholder={'https://chat.whatsapp.com/xxxxx\nhttps://chat.whatsapp.com/yyyyy'}
                rows={6}
                style={{ ...inputStyle, fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>最小延迟（秒）</label>
                <input
                  type="number"
                  value={delayMin}
                  onChange={(e) => setDelayMin(Number(e.target.value))}
                  min={1}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>最大延迟（秒）</label>
                <input
                  type="number"
                  value={delayMax}
                  onChange={(e) => setDelayMax(Number(e.target.value))}
                  min={1}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoGreet}
                  onChange={(e) => setAutoGreet(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', color: TEXT_PRIMARY }}>自动打招呼</span>
              </label>
            </div>

            {autoGreet && (
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>打招呼内容</label>
                <textarea
                  value={greetMessage}
                  onChange={(e) => setGreetMessage(e.target.value)}
                  rows={3}
                  style={inputStyle}
                />
              </div>
            )}

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

const paginationButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  border: `1px solid ${BORDER_COLOR}`,
  borderRadius: '6px',
  backgroundColor: WHITE,
  fontSize: '13px',
  cursor: 'pointer',
  color: TEXT_PRIMARY,
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

