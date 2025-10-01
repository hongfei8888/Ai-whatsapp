'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';

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
  aiEnabled: boolean;
  threadId: string;
  onOpen: () => void;
  onDelete: () => void;
  onToggleAI: (threadId: string, currentStatus: boolean) => void;
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

const ThreadRow = ({ contact, aiStatus, lastHuman, lastBot, messages, aiEnabled, threadId, onOpen, onDelete, onToggleAI }: ThreadRowProps) => (
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
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexDirection: 'column' }}>
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
          <Button 
            kind={aiEnabled ? "primary" : "secondary"}
            onClick={() => onToggleAI(threadId, aiEnabled)}
            style={{ 
              fontSize: '10px', 
              padding: '2px 6px',
              backgroundColor: aiEnabled ? '#10B981' : '#6B7280',
              color: 'white',
              border: 'none'
            }}
          >
            {aiEnabled ? 'AI开启' : 'AI关闭'}
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
  
  // 对话详情弹窗状态
  const [showThreadDialog, setShowThreadDialog] = useState(false);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageUpdateCount, setMessageUpdateCount] = useState<number>(0);
  
  // 发送消息状态
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // 表情和文件上传状态
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 滚动到底部的函数
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const container = document.getElementById('thread-message-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
        console.log('📜 已滚动到最新消息');
      }
    }, 200);
  }, []);

  // 检查是否在底部附近的函数
  const isNearBottom = useCallback(() => {
    const container = document.getElementById('thread-message-container');
    if (!container) return true;
    
    const threshold = 100; // 100px阈值
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // 当选择对话时自动滚动到底部
  useEffect(() => {
    if (selectedThread && threadMessages.length > 0) {
      scrollToBottom();
    }
  }, [selectedThread, threadMessages.length, scrollToBottom]);

  // 添加滚动事件监听器
  useEffect(() => {
    const container = document.getElementById('thread-message-container');
    if (!container) return;

    const handleScroll = () => {
      // 可以在这里添加滚动位置跟踪逻辑
      // console.log('用户正在滚动:', container.scrollTop);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [selectedThread]);

  // 移除定期刷新机制，避免UI频繁晃动

  // 监听消息更新计数器，但减少刷新频率避免UI晃动
  useEffect(() => {
    if (messageUpdateCount > 0 && selectedThread) {
      console.log('🔄 消息更新计数器变化:', messageUpdateCount);
      // 使用防抖机制，避免频繁刷新
      const debounceTimer = setTimeout(() => {
        console.log('🔄 防抖后刷新UI');
        handleRefreshMessages();
      }, 1000); // 1秒防抖
      
      return () => clearTimeout(debounceTimer);
    }
  }, [messageUpdateCount, selectedThread]);

  // 使用WebSocket替代轮询
  const { isConnected } = useWebSocket({
    onConnected: () => {
      console.log('🔌 WebSocket已连接，刷新当前对话确保数据同步');
      if (selectedThread) {
        // 只刷新一次，避免频繁刷新
        setTimeout(() => {
          handleRefreshMessages();
        }, 1000);
      }
    },
    onNewMessage: (message: any) => {
      console.log('💬 收到新消息:', message);
      
      // 增加消息更新计数器
      setMessageUpdateCount(prev => prev + 1);
      
      // 只刷新一次，避免频繁刷新导致UI晃动
      if (selectedThread) {
        console.log('🔄 收到WebSocket消息，刷新当前对话');
        setTimeout(() => {
          handleRefreshMessages();
        }, 500);
      }
      
      // 更新对话列表
      setThreads(prev => {
        return prev.map(thread => {
          // 支持多种匹配方式（与消息匹配逻辑保持一致）
          const contactPhone = thread.contact?.phone;
          const messageFromClean = message.from?.replace('@c.us', '');
          const messageToClean = message.to?.replace('@c.us', '');
          const contactPhoneClean = contactPhone?.replace(/[^0-9]/g, '');
          
          const isMatchingThread = 
            thread.id === message.threadId ||
            contactPhone === message.from ||
            contactPhone === message.to ||
            messageFromClean === contactPhoneClean ||
            messageToClean === contactPhoneClean ||
            message.from?.includes(contactPhoneClean) ||
            message.to?.includes(contactPhoneClean);
            
          if (isMatchingThread) {
            console.log('🔄 更新对话列表:', {
              threadId: thread.id,
              contactPhone: thread.contact?.phone,
              messageFrom: message.from,
              messageTo: message.to
            });
            
            return {
              ...thread,
              messagesCount: thread.messagesCount + 1,
              latestMessageAt: new Date(message.timestamp * 1000).toISOString(),
              lastHumanAt: !message.fromMe ? new Date(message.timestamp * 1000).toISOString() : thread.lastHumanAt,
              lastBotAt: message.fromMe ? new Date(message.timestamp * 1000).toISOString() : thread.lastBotAt
            };
          }
          return thread;
        });
      });
    },
    onMessageStatus: (update: any) => {
      console.log('📊 消息状态更新:', update);
      // 可以在这里更新消息的发送状态
      if (selectedThread) {
        setThreadMessages(prev => {
          return prev.map(msg => {
            if (msg.id === update.messageId) {
              console.log('✅ 更新消息状态:', {
                messageId: msg.id,
                oldStatus: msg.status,
                newStatus: update.ack
              });
              return {
                ...msg,
                status: update.ack,
                statusUpdatedAt: new Date(update.timestamp).toISOString()
              };
            }
            return msg;
          });
        });
      }
    }
  });


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

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const result = await api.getThreads();
      setThreads(result.threads);
      console.log('✅ 手动刷新完成');
    } catch (error) {
      console.error('❌ 手动刷新失败:', error);
      alert('刷新失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };




  const handleToggleAI = async (threadId: string, currentStatus: boolean) => {
    try {
      await api.setThreadAiEnabled(threadId, !currentStatus);
      console.log(`AI状态已${!currentStatus ? '启用' : '禁用'}`);
      
      // 更新本地状态
      setThreads(prev => prev.map(thread => 
        thread.id === threadId 
          ? { ...thread, aiEnabled: !currentStatus }
          : thread
      ));
      
      alert(`AI自动回复已${!currentStatus ? '启用' : '禁用'}`);
    } catch (error) {
      console.error('切换AI状态失败:', error);
      alert('切换AI状态失败: ' + (error as Error).message);
    }
  };

  const handleOpenThread = async (threadId: string) => {
    try {
      setMessagesLoading(true);
      
      // 找到对应的线程信息
      const thread = threads.find(t => t.id === threadId);
      if (!thread) {
        console.error('未找到线程信息');
        return;
      }
      
      setSelectedThread(thread);
      
      try {
        // 尝试获取真实的消息数据，使用更大的limit确保获取最新消息
        console.log('🔄 正在获取对话消息，线程ID:', threadId);
        const threadData = await api.getThreadMessages(threadId, 1000);
        console.log('📊 获取到消息数量:', threadData.messages?.length || 0);
        setThreadMessages(threadData.messages || []);
        
        // 如果获取到的消息为空，显示提示
        if (!threadData.messages || threadData.messages.length === 0) {
          console.log('⚠️ 该对话暂无消息');
        }
        
        // 设置选择对话后，再次刷新确保获取最新消息
        setTimeout(() => {
          console.log('🔄 选择对话后再次刷新确保数据最新');
          handleRefreshMessages();
        }, 1000);
        
      } catch (apiError) {
        console.error('❌ 获取消息失败:', apiError);
        // 不使用模拟数据，而是显示空状态
        setThreadMessages([]);
        alert('获取消息失败: ' + (apiError as Error).message);
      }
      
      setShowThreadDialog(true);
      
    } catch (error) {
      console.error('打开对话失败:', error);
      alert('打开对话失败: ' + (error as Error).message);
    } finally {
      setMessagesLoading(false);
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || sendingMessage) {
      return;
    }

    const messageText = newMessage.trim();
    const tempMessageId = `temp_${Date.now()}`;

    try {
      setSendingMessage(true);
      
      // 创建新消息对象（临时显示）
      const tempMessage = {
        id: tempMessageId,
        text: messageText,
        direction: 'OUT',
        status: 'SENDING',
        createdAt: new Date().toISOString()
      };
      
      // 立即添加到消息列表（乐观更新）
      setThreadMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      try {
        // 尝试发送真实消息
        await api.sendOutreach(selectedThread.contact.id, { content: messageText });
        
        // 发送成功，等待AI回复并实时更新消息列表
        setTimeout(async () => {
          try {
            const updatedThreadData = await api.getThreadMessages(selectedThread.id, 1000);
            setThreadMessages(updatedThreadData.messages || []);
            console.log('消息发送成功，已更新消息列表');
            
            // 自动滚动到最新消息
            scrollToBottom();
            
            // 如果AI开启，继续等待AI回复（最多等待15秒）
            if (selectedThread.aiEnabled) {
              console.log('🤖 AI已开启，等待AI回复...');
              let attempts = 0;
              const maxAttempts = 15; // 增加检查次数
              
              const checkForAiReply = async () => {
                try {
                  attempts++;
                  console.log(`🔍 第${attempts}次检查AI回复...`);
                  
                  const latestData = await api.getThreadMessages(selectedThread.id, 1000);
                  const latestMessages = latestData.messages || [];
                  
                  console.log('📊 当前消息数量:', latestMessages.length);
                  console.log('📅 临时消息时间:', tempMessage.createdAt);
                  
                  // 检查是否有新的AI回复
                  const newAiMessages = latestMessages.filter(msg => 
                    msg.direction === 'OUT' && 
                    new Date(msg.createdAt) > new Date(tempMessage.createdAt)
                  );
                  
                  console.log('🤖 新的AI消息:', newAiMessages);
                  
                      if (newAiMessages.length > 0) {
                        setThreadMessages(latestMessages);
                        console.log('✅ 检测到AI回复，消息列表已更新！');
                        
                        // 自动滚动到最新消息
                        scrollToBottom();
                        return;
                      }
                  
                  if (attempts < maxAttempts) {
                    console.log(`⏳ 第${attempts}次检查无AI回复，1秒后继续...`);
                    setTimeout(checkForAiReply, 1000);
                  } else {
                    console.log('⏰ AI回复检查超时，停止等待');
                  }
                } catch (error) {
                  console.error('❌ 检查AI回复时出错:', error);
                }
              };
              
              // 3秒后开始检查AI回复
              setTimeout(checkForAiReply, 3000);
            }
            
          } catch (fetchError) {
            console.warn('重新获取消息失败，使用乐观更新:', fetchError);
            // 如果重新获取失败，使用乐观更新
            setThreadMessages(prev => 
              prev.map(msg => 
                msg.id === tempMessageId 
                  ? { ...msg, status: 'SENT' }
                  : msg
              )
            );
          }
        }, 1000);
        
      } catch (apiError) {
        console.error('发送消息失败:', apiError);
        
        // 发送失败，从消息列表中移除临时消息
        setThreadMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
        
        // 恢复输入框内容
        setNewMessage(messageText);
        
        // 显示错误提示
        const errorMessage = apiError instanceof Error ? apiError.message : '发送失败';
        if (errorMessage.includes('not ready')) {
          alert('WhatsApp服务未就绪，请检查连接状态');
        } else {
          alert(`发送消息失败: ${errorMessage}`);
        }
      }
      
    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 移除临时消息
      setThreadMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      // 恢复输入框内容
      setNewMessage(messageText);
      
      alert('发送消息失败: ' + (error as Error).message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 刷新当前对话的消息列表
  const handleRefreshMessages = async () => {
    if (!selectedThread) return;
    
    try {
      setMessagesLoading(true);
      const threadData = await api.getThreadMessages(selectedThread.id, 1000);
      setThreadMessages(threadData.messages || []);
      console.log('消息列表已刷新');
      
      // 自动滚动到最新消息
      scrollToBottom();
    } catch (error) {
      console.error('刷新消息失败:', error);
      alert('刷新消息失败: ' + (error as Error).message);
    } finally {
      setMessagesLoading(false);
    }
  };


  // 表情选择器
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤝', '👏',
    '🙌', '👐', '🤲', '🤜', '🤛', '✊', '👊', '👎', '👌', '👍'
  ];

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // 文件上传处理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedThread || uploadingFile) {
      return;
    }

    const tempMessageId = `file_${Date.now()}`;
    const fileMessage = {
      id: tempMessageId,
      type: selectedFile.type.startsWith('image/') ? 'image' : 'file',
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
      direction: 'OUT',
      status: 'SENDING',
      createdAt: new Date().toISOString(),
      text: selectedFile.type.startsWith('image/') ? '[图片]' : `[文件] ${selectedFile.name}`
    };

    try {
      setUploadingFile(true);
      
      // 立即添加到消息列表（乐观更新）
      setThreadMessages(prev => [...prev, fileMessage]);
      setSelectedFile(null);
      
      // 调用真正的文件上传API
      await api.uploadFile(selectedThread.contact.id, selectedFile);
      
      // 发送成功，等待一秒后重新获取最新的消息列表
      setTimeout(async () => {
        try {
          const updatedThreadData = await api.getThreadMessages(selectedThread.id, 1000);
          setThreadMessages(updatedThreadData.messages || []);
          console.log('文件上传成功，已更新消息列表');
          
          // 自动滚动到最新消息
          scrollToBottom();
        } catch (fetchError) {
          console.warn('重新获取消息失败，使用乐观更新:', fetchError);
          // 如果重新获取失败，使用乐观更新
          setThreadMessages(prev => 
            prev.map(msg => 
              msg.id === tempMessageId 
                ? { ...msg, status: 'SENT' }
                : msg
            )
          );
        }
      }, 1000);
      
    } catch (error) {
      console.error('文件上传失败:', error);
      
      // 发送失败，从消息列表中移除临时消息
      setThreadMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      
      // 恢复文件选择
      setSelectedFile(selectedFile);
      
      // 显示错误提示
      const errorMessage = error instanceof Error ? error.message : '文件上传失败';
      alert(`文件上传失败: ${errorMessage}`);
      
    } finally {
      setUploadingFile(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            <Tag 
              text={`管理所有对话和AI回复状态${isConnected ? ' - 🔌 实时连接' : ''}`} 
              tone="info" 
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              kind="ghost" 
              onClick={handleRefresh} 
              aria-label="刷新数据"
              style={{
                backgroundColor: '#E0F2FE',
                color: '#0277BD'
              }}
            >
              🔄 手动刷新
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
                  aiEnabled={thread.aiEnabled}
                  threadId={thread.id}
                  onOpen={() => handleOpenThread(thread.id)}
                  onDelete={() => handleDeleteThread(thread.id)}
                  onToggleAI={handleToggleAI}
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

      {/* 对话详情弹窗 */}
      {showThreadDialog && selectedThread && (
        <div style={{
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
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }}>
            {/* 弹窗头部 */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{
                  margin: '0 0 4px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
                }}>
                  {selectedThread.contact.name || selectedThread.contact.phoneE164}
                </h3>
                <div style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
                }}>
                  {selectedThread.contact.phoneE164} • {selectedThread.messagesCount} 条消息
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Tag 
                  text={selectedThread.aiEnabled ? 'AI活跃' : '人工接管'} 
                  tone={selectedThread.aiEnabled ? 'success' : 'info'} 
                />
                <Button
                  kind="ghost"
                  onClick={handleRefreshMessages}
                  disabled={messagesLoading}
                  style={{ 
                    fontSize: '12px', 
                    padding: '6px 12px',
                    opacity: messagesLoading ? 0.6 : 1
                  }}
                >
                  {messagesLoading ? '⏳' : '🔄'} 刷新
                </Button>
                <Button
                  kind="ghost"
                  onClick={scrollToBottom}
                  style={{ 
                    fontSize: '12px', 
                    padding: '6px 12px'
                  }}
                >
                  📜 滚动到底部
                </Button>
                <Button
                  kind="ghost"
                  onClick={() => {
                    setShowThreadDialog(false);
                  }}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  ✕ 关闭
                </Button>
              </div>
            </div>

            {/* 消息列表 */}
            <div 
              id="thread-message-container"
              style={{
                flex: 1,
                padding: '16px 24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '400px' // 设置最小高度确保有足够空间
              }}>
              {messagesLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid #E5E7EB',
                    borderTop: '2px solid #4F46E5',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                  }} />
                  <p style={{ color: '#6B7280', fontSize: '14px' }}>加载消息中...</p>
                </div>
              ) : threadMessages.length > 0 ? (
                threadMessages
                  .sort((a, b) => {
                    // 按时间排序，最早的消息在前，最新的消息在后
                    const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
                    const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
                    return timeA - timeB;
                  })
                  .map((message, index) => (
                  <div
                    key={message.id || index}
                    style={{
                      display: 'flex',
                      justifyContent: message.direction === 'OUT' ? 'flex-end' : 'flex-start',
                      marginBottom: '12px',
                      marginTop: '4px'
                    }}
                  >
                    <div style={{
                      maxWidth: message.type === 'image' ? '300px' : '70%',
                      padding: '12px 16px',
                      borderRadius: message.direction === 'OUT' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: message.direction === 'OUT' ? '#4F46E5' : '#F3F4F6',
                      color: message.direction === 'OUT' ? 'white' : '#111827',
                      fontSize: '14px',
                      lineHeight: '1.4',
                      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
                      wordWrap: 'break-word'
                    }}>
                      {/* 消息内容 */}
                      {message.type === 'image' ? (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            padding: '20px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            border: '2px dashed rgba(255,255,255,0.3)'
                          }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖼️</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                              {message.fileName} ({formatFileSize(message.fileSize)})
                            </div>
                          </div>
                        </div>
                      ) : message.type === 'file' ? (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            padding: '16px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}>
                            <div style={{ fontSize: '24px' }}>
                              {message.fileType?.includes('pdf') ? '📄' :
                               message.fileType?.includes('doc') ? '📝' :
                               message.fileType?.includes('zip') ? '📦' :
                               message.fileType?.includes('video') ? '🎥' :
                               message.fileType?.includes('audio') ? '🎵' : '📎'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: '500' }}>
                                {message.fileName}
                              </div>
                              <div style={{ fontSize: '11px', opacity: 0.7 }}>
                                {formatFileSize(message.fileSize)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginBottom: '4px' }}>
                          {message.text}
                        </div>
                      )}
                      
                      {/* 时间戳 */}
                      <div style={{
                        fontSize: '11px',
                        opacity: 0.7,
                        textAlign: 'right',
                        marginTop: '4px'
                      }}>
                        {formatTime(message.createdAt)}
                        {message.direction === 'OUT' && (
                          <span style={{ marginLeft: '4px' }}>
                            {message.status === 'SENT' ? '✓' : 
                             message.status === 'SENDING' ? '⏳' :
                             message.status === 'FAILED' ? '✗' : 
                             message.status === 'QUEUED' ? '⏳' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无消息</div>
                  <div style={{ fontSize: '14px' }}>该对话中还没有任何消息记录</div>
                </div>
              )}
            </div>

            {/* 消息输入区域 */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #E5E7EB',
              backgroundColor: '#F9FAFB',
              borderRadius: '0 0 16px 16px',
              position: 'relative'
            }}>
              {/* 表情选择器 */}
              {showEmojiPicker && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '24px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  padding: '12px',
                  maxWidth: '300px',
                  maxHeight: '200px',
                  overflow: 'auto',
                  zIndex: 1001,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiSelect(emoji)}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '18px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* 选中的文件预览 */}
              {selectedFile && (
                <div style={{
                  marginBottom: '12px',
                  padding: '12px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>
                      {selectedFile.type.startsWith('image/') ? '🖼️' :
                       selectedFile.type.includes('pdf') ? '📄' :
                       selectedFile.type.includes('doc') ? '📝' :
                       selectedFile.type.includes('zip') ? '📦' : '📎'}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>
                        {selectedFile.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        {formatFileSize(selectedFile.size)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      kind="ghost"
                      onClick={() => setSelectedFile(null)}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      取消
                    </Button>
                    <Button
                      kind="primary"
                      onClick={handleFileUpload}
                      disabled={uploadingFile}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      {uploadingFile ? '上传中...' : '发送'}
                    </Button>
                  </div>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-end'
              }}>
                {/* 工具栏 */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                      e.currentTarget.style.borderColor = '#4F46E5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                    title="表情"
                  >
                    😊
                  </button>
                  
                  <label style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    transition: 'all 0.2s'
                  }}>
                    📎
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                      style={{ display: 'none' }}
                      title="文件"
                    />
                  </label>
                </div>

                {/* 输入框 */}
                <div style={{ flex: 1 }}>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入消息内容..."
                    disabled={sendingMessage}
                    style={{
                      width: '100%',
                      minHeight: '40px',
                      maxHeight: '120px',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
                      resize: 'none',
                      outline: 'none',
                      backgroundColor: 'white',
                      opacity: sendingMessage ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>

                {/* 发送按钮 */}
                <Button
                  kind="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '20px',
                    minWidth: '80px',
                    opacity: (!newMessage.trim() || sendingMessage) ? 0.6 : 1
                  }}
                >
                  {sendingMessage ? (
                    <>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginRight: '6px'
                      }} />
                      发送中
                    </>
                  ) : (
                    '发送'
                  )}
                </Button>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#6B7280',
                fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
                marginTop: '8px'
              }}>
                <span>
                  最后人工回复: {selectedThread.lastHumanAt ? formatTime(selectedThread.lastHumanAt) : '无'}
                </span>
                <span>
                  最后AI回复: {selectedThread.lastBotAt ? formatTime(selectedThread.lastBotAt) : '无'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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