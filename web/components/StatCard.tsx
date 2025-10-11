'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';

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
  sparklineData?: number[];
  loading?: boolean;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color,
  subtitle,
  sparklineData,
  loading = false,
}: StatCardProps) {
  const { colors } = useTheme();
  const cardColor = color || colors.accent;

  // Sparkline 渲染
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length === 0) return null;

    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;

    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg
        width="100%"
        height="40"
        style={{ marginTop: '8px' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke={cardColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
      </svg>
    );
  };

  const styles = {
    card: {
      backgroundColor: colors.panelBackground,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      position: 'relative' as const,
      overflow: 'hidden',
      minHeight: '160px',
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
      fontSize: '13px',
      color: colors.textSecondary,
      fontWeight: '500' as const,
      marginBottom: '4px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
    },
    subtitle: {
      fontSize: '12px',
      color: colors.textSecondary,
      opacity: 0.7,
    },
    icon: {
      fontSize: '28px',
      opacity: 0.15,
      position: 'absolute' as const,
      right: '15px',
      top: '15px',
    },
    valueSection: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '12px',
      marginTop: '4px',
    },
    value: {
      fontSize: '36px',
      fontWeight: '700' as const,
      color: colors.textPrimary,
      lineHeight: 1,
    },
    trend: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '700' as const,
    },
    trendPositive: {
      backgroundColor: 'rgba(0, 168, 132, 0.15)',
      color: colors.success,
    },
    trendNegative: {
      backgroundColor: 'rgba(231, 76, 60, 0.15)',
      color: colors.danger,
    },
    trendArrow: {
      fontSize: '16px',
      fontWeight: '700' as const,
    },
    accent: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: '3px',
      backgroundColor: cardColor,
    },
    loadingShimmer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)`,
      animation: 'shimmer 1.5s infinite',
    },
  };

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      <div style={styles.card}>
        {loading && <div style={styles.loadingShimmer} />}
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
              <span style={styles.trendArrow}>
                {trend.isPositive ? '↑' : '↓'}
              </span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {renderSparkline()}
        
        <div style={styles.accent} />
      </div>
    </>
  );
}
