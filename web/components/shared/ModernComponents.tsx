'use client';

import { useState, ReactNode, CSSProperties } from 'react';

// ============ 类型定义 ============
export interface ButtonProps {
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
  [key: string]: any;
}

export interface CardProps {
  children: ReactNode;
  hoverable?: boolean;
  style?: CSSProperties;
}

export interface TagProps {
  text: string;
  tone?: 'success' | 'warn' | 'error' | 'info';
  style?: CSSProperties;
}

export interface StatProps {
  label: string;
  value: string | number;
  hint: string;
  color?: string;
}

// ============ 现代化Button组件 ============
export const ModernButton = ({ kind = 'secondary', children, onClick, disabled, style = {}, ...props }: ButtonProps) => {
  const baseStyle: CSSProperties = {
    padding: '10px 20px',
    borderRadius: '12px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  const kindStyles = {
    primary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#FFFFFF',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    },
    secondary: {
      backgroundColor: '#FFFFFF',
      color: '#1f2937',
      border: '1px solid #E5E7EB',
      boxShadow: '0 2px 8px rgba(0,0,0,.05)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#6B7280',
      border: 'none',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: '#FFFFFF',
      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
    }
  };

  const hoverStyle: CSSProperties = {
    ...baseStyle,
    ...kindStyles[kind],
    transform: 'translateY(-2px)',
    boxShadow: kind === 'ghost' ? 'none' : 
               kind === 'primary' ? '0 8px 25px rgba(102, 126, 234, 0.5)' :
               kind === 'danger' ? '0 8px 25px rgba(239, 68, 68, 0.5)' :
               '0 4px 20px rgba(0,0,0,.1)',
    background: kind === 'primary' ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' : 
                kind === 'secondary' ? '#F9FAFB' : 
                kind === 'danger' ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' :
                'rgba(102, 126, 234, 0.1)'
  };

  const [currentStyle, setCurrentStyle] = useState<CSSProperties>({ ...baseStyle, ...kindStyles[kind] });

  return (
    <button
      style={currentStyle}
      onMouseEnter={() => !disabled && setCurrentStyle(hoverStyle as any)}
      onMouseLeave={() => !disabled && setCurrentStyle({ ...baseStyle, ...kindStyles[kind] } as any)}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// ============ 现代化Card组件 ============
export const ModernCard = ({ children, hoverable = false, style = {} }: CardProps) => {
  const baseStyle: CSSProperties = {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid rgba(229, 231, 235, 0.8)',
    boxShadow: '0 4px 20px rgba(0,0,0,.04)',
    padding: '28px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    ...style
  };

  const hoverStyle: CSSProperties = hoverable ? {
    ...baseStyle,
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0,0,0,.1)',
    borderColor: 'rgba(102, 126, 234, 0.3)'
  } : baseStyle;

  const [currentStyle, setCurrentStyle] = useState(baseStyle);

  return (
    <div
      style={currentStyle}
      onMouseEnter={() => hoverable && setCurrentStyle(hoverStyle)}
      onMouseLeave={() => hoverable && setCurrentStyle(baseStyle)}
    >
      {children}
    </div>
  );
};

// ============ 现代化Tag组件 ============
export const ModernTag = ({ text, tone = 'info', style = {} }: TagProps) => {
  const toneStyles = {
    success: { 
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)', 
      color: '#059669', 
      border: '1px solid rgba(5, 150, 105, 0.3)',
      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)'
    },
    warn: { 
      background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)', 
      color: '#D97706', 
      border: '1px solid rgba(249, 115, 22, 0.3)',
      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.15)'
    },
    error: { 
      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)', 
      color: '#DC2626', 
      border: '1px solid rgba(220, 38, 38, 0.3)',
      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)'
    },
    info: { 
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)', 
      color: '#2563EB', 
      border: '1px solid rgba(37, 99, 235, 0.3)',
      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
    }
  };

  return (
    <span
      style={{
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
        display: 'inline-flex',
        alignItems: 'center',
        ...toneStyles[tone],
        ...style
      }}
    >
      {text}
    </span>
  );
};

// ============ 现代化Stat统计组件 ============
export const ModernStat = ({ label, value, hint, color = '#667eea' }: StatProps) => (
  <div style={{ textAlign: 'center' }}>
    <div
      style={{
        fontSize: '36px',
        fontWeight: '700',
        background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
        lineHeight: '1.2',
        marginBottom: '8px',
        textShadow: '0 2px 10px rgba(102, 126, 234, 0.2)'
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: '15px',
        fontWeight: '600',
        color: '#111827',
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
        marginBottom: '4px'
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: '13px',
        color: '#9CA3AF',
        fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif'
      }}
    >
      {hint}
    </div>
  </div>
);

// ============ 现代化页面容器 ============
export const ModernPageContainer = ({ children, style = {} }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
      ...style
    }}
  >
    {/* 装饰性背景 */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
      pointerEvents: 'none'
    }} />
    
    {/* 主内容区域 */}
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '32px 24px', 
      position: 'relative', 
      zIndex: 1 
    }}>
      {children}
    </div>
  </div>
);

// ============ 现代化页面标题 ============
export const ModernPageHeader = ({ 
  title, 
  subtitle, 
  actions 
}: { 
  title: string; 
  subtitle?: string; 
  actions?: ReactNode;
}) => (
  <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <div>
      <h1 style={{ 
        fontSize: '42px', 
        fontWeight: 700, 
        color: '#FFFFFF', 
        margin: 0,
        textShadow: '0 4px 20px rgba(0,0,0,0.2)',
        letterSpacing: '-0.02em'
      }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ 
          fontSize: '17px', 
          color: 'rgba(255, 255, 255, 0.9)', 
          margin: '10px 0 0 0'
        }}>
          {subtitle}
        </p>
      )}
    </div>
    {actions && (
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {actions}
      </div>
    )}
  </div>
);

// ============ 现代化Loading组件 ============
export const ModernLoading = () => (
  <div 
    style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif',
      position: 'relative'
    }}
  >
    {/* 装饰性背景 */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
      pointerEvents: 'none'
    }} />
    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
      <div 
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid #FFFFFF',
          borderRadius: '50%',
          animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite',
          margin: '0 auto 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}
      />
      <p style={{ 
        color: '#FFFFFF', 
        fontSize: '16px',
        fontWeight: '600',
        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}>
        加载中...
      </p>
    </div>
  </div>
);

// ============ CSS动画 ============
export const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}</style>
);

