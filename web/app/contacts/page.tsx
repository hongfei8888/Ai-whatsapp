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

interface ItemProps {
  label: string;
  value: string | number;
  style?: React.CSSProperties;
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

const ContactRow = ({ contact, phone, cooldown, createdAt, onOutreach, onCopy }) => (
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '14px',
              color: '#6B7280',
              fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
            }}
          >
            {phone}
          </span>
          <button
            onClick={() => onCopy(phone)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              fontSize: '14px',
              padding: '2px'
            }}
            aria-label="复制电话号码"
          >
            📋
          </button>
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#9CA3AF',
            fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
            marginTop: '4px'
          }}
        >
          创建于 {new Date(createdAt).toLocaleDateString('zh-CN')}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>{cooldown}</div>
        <Button 
          kind="primary" 
          onClick={() => onOutreach(contact)}
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          主动联系
        </Button>
      </div>
    </div>
  </div>
);

export default function ContactsInline() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const { contacts: contactsData } = await api.getContacts();
        setContacts(contactsData);
      } catch (error) {
        console.warn('API服务器连接失败，使用模拟数据:', error);
        // TODO: 接口对接点 - 使用模拟数据
        setContacts([
          {
            id: '1',
            phoneE164: '+1234567890',
            name: '张三',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            cooldownRemainingSeconds: 0
          },
          {
            id: '2', 
            phoneE164: '+0987654321',
            name: '李四',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            cooldownRemainingSeconds: 300
          },
          {
            id: '3',
            phoneE164: '+1122334455',
            name: '王五',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            cooldownRemainingSeconds: 0
          },
          {
            id: '4',
            phoneE164: '+5566778899',
            name: '赵六',
            createdAt: new Date(Date.now() - 345600000).toISOString(),
            cooldownRemainingSeconds: 600
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
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
  const totalContacts = contacts.length;
  const recentContacts = contacts.filter(contact => {
    const createdAt = new Date(contact.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdAt > thirtyDaysAgo;
  }).length;
  
  const cooldownContacts = contacts.filter(contact => 
    contact.cooldownRemainingSeconds && contact.cooldownRemainingSeconds > 0
  ).length;
  
  const todayContacts = contacts.filter(contact => {
    const createdAt = new Date(contact.createdAt);
    const today = new Date();
    return createdAt.toDateString() === today.toDateString();
  }).length;

  const handleAddContact = async () => {
    const phone = prompt('请输入电话号码 (E164格式，如: +1234567890):');
    if (!phone) return;
    
    const name = prompt('请输入联系人姓名 (可选):');
    
    try {
      const newContact = await api.createContact({
        phoneE164: phone,
        name: name || undefined
      });
      console.log('联系人添加成功:', newContact);
      // 刷新联系人列表
      window.location.reload();
    } catch (error) {
      console.error('添加联系人失败:', error);
      alert('添加联系人失败: ' + (error as Error).message);
    }
  };

  const handleRefresh = () => {
    console.log('刷新数据'); // TODO: 接口对接点
    window.location.reload();
  };

  const handleCopy = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      console.log('已复制:', phone);
      // TODO: 显示复制成功提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleOutreach = async (contactName: string) => {
    const content = prompt(`请输入发送给 ${contactName} 的消息内容:`);
    if (!content) return;
    
    try {
      // 需要先找到联系人的ID
      const contact = contacts.find(c => c.name === contactName);
      if (!contact) {
        alert('未找到联系人');
        return;
      }
      
      const result = await api.sendOutreach(contact.id, { content });
      console.log('主动联系成功:', result);
      alert('消息发送成功！');
    } catch (error) {
      console.error('主动联系失败:', error);
      alert('发送消息失败: ' + (error as Error).message);
    }
  };

  const formatCooldown = (seconds: number) => {
    if (!seconds || seconds <= 0) {
      return <Tag text="可联系" tone="success" />;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return <Tag text={`${hours}小时后`} tone="warn" />;
    }
    return <Tag text={`${minutes}分钟后`} tone="warn" />;
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
              联系人管理
            </h1>
            <Tag text="管理客户信息和自动化回复设置" tone="info" />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button kind="ghost" onClick={handleRefresh} aria-label="刷新数据">
              🔄 刷新
            </Button>
            <Button kind="primary" onClick={handleAddContact} aria-label="添加联系人">
              ➕ 添加联系人
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
            <Stat label="联系人总数" value={totalContacts} hint="所有联系人" color="#4F46E5" />
          </Card>
          <Card>
            <Stat label="近30天新增" value={recentContacts} hint="最近活跃" color="#059669" />
          </Card>
          <Card>
            <Stat label="冷却中" value={cooldownContacts} hint="等待发送" color="#B45309" />
          </Card>
          <Card>
            <Stat label="今日首发" value={todayContacts} hint="今日新增" color="#2563EB" />
          </Card>
        </div>

        {/* 联系人列表 */}
        <Card>
          <div
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '20px',
              fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
            }}
          >
            联系人列表
          </div>
          
          {/* 表头 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
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
            <span>联系信息</span>
            <span>状态与操作</span>
          </div>

          {/* 联系人列表 */}
          <div>
            {contacts.length > 0 ? (
              contacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact.name || '未知联系人'}
                  phone={contact.phoneE164}
                  cooldown={formatCooldown(contact.cooldownRemainingSeconds)}
                  createdAt={contact.createdAt}
                  onCopy={handleCopy}
                  onOutreach={handleOutreach}
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📇</div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无联系人</div>
                <div style={{ fontSize: '14px', marginBottom: '20px' }}>点击上方按钮添加第一个联系人</div>
                <Button kind="primary" onClick={handleAddContact}>
                  添加联系人
                </Button>
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