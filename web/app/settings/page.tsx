'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import QRCodeDialog from '@/components/QRCodeDialog';

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

interface InputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  min?: string;
  max?: string;
  style?: React.CSSProperties;
}

interface TextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  style?: React.CSSProperties;
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

const Input = ({ value, onChange, placeholder, type = 'text', step, min, max, style = {} }: InputProps) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    step={step}
    min={min}
    max={max}
    style={{
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
      backgroundColor: '#FFFFFF',
      color: '#111827',
      transition: 'border-color 0.2s ease',
      ...style
    }}
    onFocus={(e) => {
      e.target.style.borderColor = '#4F46E5';
      e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = '#E5E7EB';
      e.target.style.boxShadow = 'none';
    }}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 4, style = {} }: TextareaProps) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{
      width: '100%',
      padding: '12px',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
      backgroundColor: '#FFFFFF',
      color: '#111827',
      resize: 'vertical',
      transition: 'border-color 0.2s ease',
      ...style
    }}
    onFocus={(e) => {
      e.target.style.borderColor = '#4F46E5';
      e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = '#E5E7EB';
      e.target.style.boxShadow = 'none';
    }}
  />
);

const Select = ({ value, onChange, options, style = {} }: SelectProps) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
      backgroundColor: '#FFFFFF',
      color: '#111827',
      cursor: 'pointer',
      transition: 'border-color 0.2s ease',
      ...style
    }}
    onFocus={(e) => {
      e.target.style.borderColor = '#4F46E5';
      e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = '#E5E7EB';
      e.target.style.boxShadow = 'none';
    }}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const Item = ({ label, value, style = {} }: ItemProps) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', ...style }}>
    <span
      style={{
        fontSize: '14px',
        color: '#6B7280',
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: '14px',
        fontWeight: '500',
        color: '#111827',
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
      }}
    >
      {value}
    </span>
  </div>
);

export default function SettingsInline() {
  const [status, setStatus] = useState<any>(null);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [configForm, setConfigForm] = useState({
    maxTokens: 150,
    temperature: 0.7,
    minChars: 10,
    style: 'friendly',
    prompt: '你是一个友好的客服助手，请用简洁、专业、友好的语气回复用户问题。'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusData, aiConfigData] = await Promise.all([
    api.getStatus(),
    api.getAiConfig(),
  ]);
        setStatus(statusData);
        setAiConfig(aiConfigData);
        setConfigForm({
          maxTokens: (aiConfigData as any)?.maxTokens || 150,
          temperature: (aiConfigData as any)?.temperature || 0.7,
          minChars: (aiConfigData as any)?.minChars || 10,
          style: (aiConfigData as any)?.style || 'friendly',
          prompt: (aiConfigData as any)?.prompt || '你是一个友好的客服助手，请用简洁、专业、友好的语气回复用户问题。'
        });
      } catch (error) {
        console.warn('API服务器连接失败，使用模拟数据:', error);
        // TODO: 接口对接点 - 使用模拟数据
        setStatus({
          online: true,
          sessionReady: true,
          cooldownHours: 24,
          perContactReplyCooldownMinutes: 10,
          contactCount: 5
        });
        setAiConfig({
          maxTokens: 150,
          temperature: 0.7,
          minChars: 10,
          style: 'friendly'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleConfigChange = (field: string, value: any) => {
    setConfigForm(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await api.updateAiConfig({
        systemPrompt: configForm.prompt,
        maxTokens: configForm.maxTokens,
        temperature: configForm.temperature,
        minChars: configForm.minChars,
        stylePreset: configForm.style as 'concise-cn' | 'sales-cn' | 'support-cn'
      });
      console.log('AI配置保存成功:', configForm);
      setHasChanges(false);
      alert('配置保存成功！');
    } catch (error) {
      console.error('保存AI配置失败:', error);
      alert('保存配置失败: ' + (error as Error).message);
    }
  };

  const handleReset = () => {
    setConfigForm({
      maxTokens: (aiConfig as any)?.maxTokens || 150,
      temperature: (aiConfig as any)?.temperature || 0.7,
      minChars: (aiConfig as any)?.minChars || 10,
      style: (aiConfig as any)?.style || 'friendly',
      prompt: (aiConfig as any)?.prompt || '你是一个友好的客服助手，请用简洁、专业、友好的语气回复用户问题。'
    });
    setHasChanges(false);
  };

  const handleAddAccount = async () => {
    try {
      // 先检查WhatsApp服务状态
      const status = await api.getStatus();
      console.log('WhatsApp服务状态:', status);
      
      if (status.status === 'QR' || status.status === 'INITIALIZING') {
        // 如果已经在显示QR码或初始化中，直接显示对话框
        console.log('WhatsApp服务已经在运行，直接显示QR码');
        setShowQRDialog(true);
      } else if (status.status === 'DISCONNECTED' || status.status === 'FAILED') {
        // 如果服务离线或失败，启动登录流程
        console.log('启动新的登录流程');
        await api.startLogin();
        setShowQRDialog(true);
      } else {
        // 其他状态（如READY），直接显示对话框
        console.log('WhatsApp服务状态:', status.status, '直接显示QR码');
        setShowQRDialog(true);
      }
    } catch (error) {
      console.error('启动登录失败:', error);
      alert('启动登录失败: ' + (error as Error).message);
    }
  };

  const handleQRSuccess = () => {
    setShowQRDialog(false);
    console.log('WhatsApp登录成功！');
    alert('WhatsApp登录成功！');
    // 刷新页面以更新状态
    window.location.reload();
  };

  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) {
      return;
    }
    
    try {
      const result = await api.logout();
      console.log('退出登录成功:', result);
      alert('已成功退出登录');
      // 刷新页面
      window.location.reload();
    } catch (error) {
      console.error('退出登录失败:', error);
      alert('退出登录失败: ' + (error as Error).message);
    }
  };

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
              系统设置
            </h1>
            <Tag text="配置自动化参数和AI回复策略" tone="info" />
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* 运行配置 */}
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
              运行配置
            </div>
            <Item label="系统状态" value={status?.online ? '在线' : '离线'} />
            <Item label="会话状态" value={status?.sessionReady ? '就绪' : '未就绪'} />
            <Item label="冷却时间" value={`${status?.cooldownHours || 0}小时`} />
            <Item label="联系人数量" value={status?.contactCount || 0} />
            <Item label="单次冷却" value={`${status?.perContactReplyCooldownMinutes || 0}分钟`} />
          </Card>

          {/* 登录与会话 */}
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
              登录与会话
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '8px',
                  fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
                }}
              >
                当前账号
              </div>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  color: '#111827',
                  fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
                }}
              >
                WhatsApp账号已连接 ✅
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button kind="primary" onClick={handleAddAccount} style={{ flex: 1 }}>
                ➕ 添加账号
              </Button>
              <Button kind="secondary" onClick={handleLogout} style={{ flex: 1 }}>
                🚪 退出登录
              </Button>
            </div>
          </Card>
        </div>

        {/* AI回复配置 */}
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
            AI回复配置
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px',
                  fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
                }}
              >
                最大Token数
              </label>
              <Input
                type="number"
                value={configForm.maxTokens}
                onChange={(value) => handleConfigChange('maxTokens', parseInt(value) || 150)}
                placeholder="150"
              />
            </div>
            
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px',
                  fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
                }}
              >
                温度参数
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={configForm.temperature}
                onChange={(value) => handleConfigChange('temperature', parseFloat(value) || 0.7)}
                placeholder="0.7"
              />
            </div>
            
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px',
                  fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
                }}
              >
                最小字符数
              </label>
              <Input
                type="number"
                value={configForm.minChars}
                onChange={(value) => handleConfigChange('minChars', parseInt(value) || 10)}
                placeholder="10"
              />
            </div>
            
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px',
                  fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
                }}
              >
                回复风格
              </label>
              <Select
                value={configForm.style}
                onChange={(value) => handleConfigChange('style', value)}
                options={[
                  { value: 'friendly', label: '友好' },
                  { value: 'professional', label: '专业' },
                  { value: 'casual', label: '随意' },
                  { value: 'formal', label: '正式' }
                ]}
              />
          </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px',
                fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
              }}
            >
              系统提示词
            </label>
            <Textarea
              value={configForm.prompt}
              onChange={(value) => handleConfigChange('prompt', value)}
              placeholder="输入AI回复的系统提示词..."
              rows={4}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button kind="secondary" onClick={handleReset}>
              🔄 重置
            </Button>
            <Button kind="primary" onClick={handleSave}>
              💾 保存配置
            </Button>
          </div>
      </Card>
      </div>

      {/* 底部粘性保存条 */}
      {hasChanges && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E5E7EB',
            padding: '16px 24px',
            boxShadow: '0 -4px 12px rgba(0,0,0,.08)',
            zIndex: 20
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                fontSize: '14px',
                color: '#B45309',
                fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
              }}
            >
              ⚠️ 有未保存更改
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button kind="secondary" onClick={handleReset}>
                重置
              </Button>
              <Button kind="primary" onClick={handleSave}>
                保存更改
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 二维码登录对话框 */}
      <QRCodeDialog 
        isOpen={showQRDialog}
        onClose={() => setShowQRDialog(false)}
        onSuccess={handleQRSuccess}
      />

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
