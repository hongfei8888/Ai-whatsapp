import React from 'react';

export const WhatsAppColors = {
  accent: '#00a884',
  accentHover: '#008f6f',
  background: '#f0f2f5',
  panelBackground: '#ffffff',
  border: '#e9edef',
  textPrimary: '#111b21',
  textSecondary: '#667781',
  success: '#00a884',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#3498db',
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = WhatsAppColors.accent,
  subtitle,
}: StatCardProps) {
  const styles = {
    card: {
      backgroundColor: WhatsAppColors.panelBackground,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${WhatsAppColors.border}`,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    titleSection: {
      flex: 1,
    },
    title: {
      fontSize: '14px',
      color: WhatsAppColors.textSecondary,
      fontWeight: '500' as const,
      marginBottom: '4px',
    },
    subtitle: {
      fontSize: '12px',
      color: WhatsAppColors.textSecondary,
      opacity: 0.7,
    },
    icon: {
      fontSize: '24px',
      opacity: 0.2,
      position: 'absolute' as const,
      right: '15px',
      top: '15px',
    },
    valueSection: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px',
    },
    value: {
      fontSize: '32px',
      fontWeight: '700' as const,
      color: WhatsAppColors.textPrimary,
    },
    trend: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600' as const,
    },
    trendPositive: {
      backgroundColor: 'rgba(0, 168, 132, 0.1)',
      color: WhatsAppColors.success,
    },
    trendNegative: {
      backgroundColor: 'rgba(231, 76, 60, 0.1)',
      color: WhatsAppColors.danger,
    },
    accent: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: '4px',
      backgroundColor: color,
    },
  };

  return (
    <div style={styles.card}>
      {icon && <div style={styles.icon}>{icon}</div>}
      
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <div style={styles.title}>{title}</div>
          {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
        </div>
      </div>
      
      <div style={styles.valueSection}>
        <div style={styles.value}>{value}</div>
        {trend && (
          <div
            style={{
              ...styles.trend,
              ...(trend.isPositive ? styles.trendPositive : styles.trendNegative),
            }}
          >
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      
      <div style={styles.accent} />
    </div>
  );
}
