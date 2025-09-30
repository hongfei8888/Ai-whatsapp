'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

// 类型定义
interface ButtonProps {
  kind?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  [key: string]: any;
}

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  hoverable?: boolean;
  [key: string]: any;
}

interface TagProps {
  text: string;
  tone?: 'success' | 'warn' | 'error' | 'info';
  style?: React.CSSProperties;
}

interface StatProps {
  label: string;
  value: string | number;
  hint: string;
  color?: string;
}

interface TabProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

interface ThreadRowProps {
  contact: string;
  aiStatus: React.ReactNode;
  lastHuman: string;
  lastBot: string;
  messages: number;
  onOpen: () => void;
  onDelete: () => void;
}

// 内联样式小组件
const Button = ({ kind = 'secondary', children, onClick, style = {}, ...props }: ButtonProps) => {
  const baseStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    ...style
  };

  const kindStyles = {
    primary: {
      backgroundColor: '#4F46E5',
      color: '#FFFFFF',
      boxShadow: '0 1px 2px rgba(0,0,0,.06)',
    },
    secondary: {
      backgroundColor: '#FFFFFF',
      color: '#374151',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 2px rgba(0,0,0,.06)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#6B7280',
      border: 'none',
    }
  };

  const hoverStyle = {
    ...baseStyle,
    ...kindStyles[kind],
    transform: 'translateY(-1px)',
    boxShadow: kind === 'ghost' ? 'none' : '0 8px 24px rgba(0,0,0,.08)',
    backgroundColor: kind === 'primary' ? '#3730A3' : 
                   kind === 'secondary' ? '#F9FAFB' : 
                   'rgba(79, 70, 229, 0.1)'
  };

  const [currentStyle, setCurrentStyle] = useState({ ...baseStyle, ...kindStyles[kind] });

  return (
    <button
      style={currentStyle}
      onMouseEnter={() => setCurrentStyle(hoverStyle)}
      onMouseLeave={() => setCurrentStyle({ ...baseStyle, ...kindStyles[kind] })}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, style = {}, hoverable = false, ...props }: CardProps) => {
  const baseStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 2px rgba(0,0,0,.06)',
    padding: '24px',
    transition: 'all 0.2s ease',
    ...style
  };

  const hoverStyle = hoverable ? {
    ...baseStyle,
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,.08)'
  } : baseStyle;

  const [currentStyle, setCurrentStyle] = useState(baseStyle);

  return (
    <div
      style={currentStyle}
      onMouseEnter={() => hoverable && setCurrentStyle(hoverStyle)}
      onMouseLeave={() => hoverable && setCurrentStyle(baseStyle)}
      {...props}
    >
      {children}
    </div>
  );
};

const Tag = ({ text, tone = 'info', style = {} }: TagProps) => {
  const toneStyles = {
    success: { backgroundColor: 'rgba(5, 150, 105, 0.1)', color: '#059669', border: '1px solid #059669' },
    warn: { backgroundColor: 'rgba(180, 83, 9, 0.1)', color: '#B45309', border: '1px solid #B45309' },
    error: { backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', border: '1px solid #DC2626' },
    info: { backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', border: '1px solid #2563EB' }
  };

  return (
    <span
      style={{
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
        ...toneStyles[tone],
        ...style
      }}
    >
      {text}
    </span>
  );
};

const Stat = ({ label, value, hint, color = '#4F46E5' }: StatProps) => (
  <div style={{ textAlign: 'center' }}>
    <div
      style={{
        fontSize: '28px',
        fontWeight: '600',
        color: color,
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
        lineHeight: '1.2',
        marginBottom: '4px'
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: '14px',
        fontWeight: '500',
        color: '#111827',
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
        marginBottom: '2px'
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: '12px',
        color: '#6B7280',
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
      }}
    >
      {hint}
    </div>
  </div>
);

const Tab = ({ active, onClick, children }: TabProps) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
      color: active ? '#4F46E5' : '#6B7280',
      borderBottom: active ? '2px solid #4F46E5' : '2px solid transparent',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.color = '#4F46E5';
        e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.color = '#6B7280';
        e.currentTarget.style.backgroundColor = 'transparent';
      }
    }}
  >
    {children}
  </button>
);

const ThreadRow = ({ contact, aiStatus, lastHuman, lastBot, messages, onOpen, onDelete }: ThreadRowProps) => (
  <div
    style={{
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      marginBottom: '8px',
      backgroundColor: '#FFFFFF',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#F8FAFF';
      e.currentTarget.style.borderColor = '#4F46E5';
      e.currentTarget.style.transform = 'translateY(-1px)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = '#FFFFFF';
      e.currentTarget.style.borderColor = '#E5E7EB';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
      <div>
        <div
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
            marginBottom: '4px'
          }}
        >
          {contact}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#9CA3AF',
            fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
          }}
        >
          对话详情
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>{aiStatus}</div>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '12px',
            color: '#6B7280',
            fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
          }}
        >
          {lastHuman}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '12px',
            color: '#6B7280',
            fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
          }}
        >
          {lastBot}
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#111827',
            fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
            marginBottom: '4px'
          }}
        >
          {messages}
        </div>
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <Button 
            kind="ghost" 
            onClick={onOpen}
            style={{ fontSize: '11px', padding: '4px 8px' }}
          >
            打开
          </Button>
          <Button 
            kind="ghost" 
            onClick={onDelete}
            style={{ fontSize: '11px', padding: '4px 8px', color: '#DC2626' }}
          >
            删除
          </Button>
        </div>
      </div>
    </div>
  </div>
);

export default function ThreadsInline() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'ai' | 'manual'>('all');

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const { threads: threadsData } = await api.getThreads();
        setThreads(threadsData);
      } catch (error) {
        console.warn('API服务器连接失败，使用模拟数据:', error);
        // TODO: 接口对接点 - 使用模拟数据
        setThreads([
          {
            id: '1',
            contact: { id: '1', phoneE164: '+1234567890', name: '张三' },
            aiEnabled: true,
            messagesCount: 15,
            lastHumanAt: new Date(Date.now() - 600000).toISOString(),
            lastBotAt: new Date(Date.now() - 120000).toISOString()
          },
          {
            id: '2',
            contact: { id: '2', phoneE164: '+0987654321', name: '李四' },
            aiEnabled: false,
            messagesCount: 8,
            lastHumanAt: new Date(Date.now() - 300000).toISOString(),
            lastBotAt: new Date(Date.now() - 900000).toISOString()
          },
          {
            id: '3',
            contact: { id: '3', phoneE164: '+1122334455', name: '王五' },
            aiEnabled: true,
            messagesCount: 23,
            lastHumanAt: new Date(Date.now() - 360000).toISOString(),
            lastBotAt: new Date(Date.now() - 60000).toISOString()
          },
          {
            id: '4',
            contact: { id: '4', phoneE164: '+5566778899', name: '赵六' },
            aiEnabled: false,
            messagesCount: 12,
            lastHumanAt: new Date(Date.now() - 180000).toISOString(),
            lastBotAt: new Date(Date.now() - 1200000).toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, []);

  if (loading) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom, #EEF2FF, #FFFFFF)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid #E5E7EB',
              borderTop: '3px solid #4F46E5',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}
          />
          <p style={{ color: '#6B7280', fontSize: '14px' }}>加载中...</p>
        </div>
      </div>
    );
  }

  // TODO: 接口对接点 - 计算统计数据
  const totalThreads = threads.length;
  const aiActiveThreads = threads.filter(thread => thread.aiEnabled).length;
  const active24hThreads = threads.filter(thread => {
    const lastHumanAt = thread.lastHumanAt ? new Date(thread.lastHumanAt).getTime() : 0;
    const lastBotAt = thread.lastBotAt ? new Date(thread.lastBotAt).getTime() : 0;
    const lastActivity = Math.max(lastHumanAt, lastBotAt);
    const now = new Date().getTime();
    return (now - lastActivity) < 24 * 60 * 60 * 1000;
  }).length;
  const avgMessages = threads.length > 0 ? Math.round(threads.reduce((sum: number, t: any) => sum + (t.messagesCount || 0), 0) / threads.length) : 0;

  // 过滤线程
  const filteredThreads = threads.filter(thread => {
    switch (activeTab) {
      case 'ai':
        return thread.aiEnabled;
      case 'manual':
        return !thread.aiEnabled;
      default:
        return true;
    }
  });

  const handleRefresh = () => {
    console.log('刷新数据'); // TODO: 接口对接点
    window.location.reload();
  };

  const handleOpenThread = async (threadId: string) => {
    try {
      const threadData = await api.getThreadMessages(threadId);
      console.log('打开对话:', threadData);
      // TODO: 实现打开会话对话框或跳转到会话详情页
    } catch (error) {
      console.error('获取会话详情失败:', error);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('确定要删除这个对话吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      await api.deleteThread(threadId);
      console.log('对话删除成功:', threadId);
      // 刷新对话列表
      window.location.reload();
    } catch (error) {
      console.error('删除对话失败:', error);
      alert('删除对话失败: ' + (error as Error).message);
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #EEF2FF, #FFFFFF)',
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
      }}
    >
      {/* 粘性Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(4px)',
          borderBottom: '1px solid #E5E7EB',
          padding: '16px 24px'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4F46E5' }} />
            <h1
              style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                margin: 0,
                fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
              }}
            >
              对话管理
            </h1>
            <Tag text="管理所有对话和AI回复状态" tone="info" />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button kind="ghost" onClick={handleRefresh} aria-label="刷新数据">
              🔄 刷新
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* KPI统计卡片 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          <Card>
            <Stat label="总对话数" value={totalThreads} hint="所有会话" color="#4F46E5" />
          </Card>
          <Card>
            <Stat label="AI自动回复" value={aiActiveThreads} hint="自动回复中" color="#059669" />
          </Card>
          <Card>
            <Stat label="24h活跃" value={active24hThreads} hint="最近活跃" color="#2563EB" />
          </Card>
          <Card>
            <Stat label="平均消息" value={avgMessages} hint="每会话消息数" color="#B45309" />
          </Card>
        </div>

        {/* 对话列表 */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
              }}
            >
              对话列表
            </div>
            
            {/* 标签页 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Tab active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
                全部 ({totalThreads})
              </Tab>
              <Tab active={activeTab === 'ai'} onClick={() => setActiveTab('ai')}>
                AI活跃 ({aiActiveThreads})
              </Tab>
              <Tab active={activeTab === 'manual'} onClick={() => setActiveTab('manual')}>
                人工接管 ({totalThreads - aiActiveThreads})
              </Tab>
            </div>
          </div>
          
          {/* 表头 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              gap: '16px',
              padding: '12px',
              backgroundColor: '#F9FAFB',
              borderRadius: '10px',
              marginBottom: '12px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6B7280',
              fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
            }}
          >
            <span>联系人</span>
            <span style={{ textAlign: 'center' }}>AI状态</span>
            <span style={{ textAlign: 'center' }}>最后人工</span>
            <span style={{ textAlign: 'center' }}>最后机器人</span>
            <span style={{ textAlign: 'center' }}>消息/操作</span>
          </div>

          {/* 对话列表 */}
          <div>
            {filteredThreads.length > 0 ? (
              filteredThreads.map((thread) => (
                <ThreadRow
                  key={thread.id}
                  contact={thread.contact.name || thread.contact.phoneE164}
                  aiStatus={<Tag text={thread.aiEnabled ? 'AI活跃' : '人工接管'} tone={thread.aiEnabled ? 'success' : 'info'} />}
                  lastHuman={thread.lastHumanAt ? formatTime(thread.lastHumanAt) : '无'}
                  lastBot={thread.lastBotAt ? formatTime(thread.lastBotAt) : '无'}
                  messages={thread.messagesCount}
                  onOpen={() => handleOpenThread(thread.id)}
                  onDelete={() => handleDeleteThread(thread.id)}
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无对话</div>
                <div style={{ fontSize: '14px' }}>当前筛选条件下没有找到对话记录</div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* CSS动画 */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}