'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';

interface TopListItem {
  id: string;
  name: string;
  value: number;
  subtitle?: string;
  onClick?: () => void;
}

interface TopListProps {
  title: string;
  items: TopListItem[];
  valueFormatter?: (value: number) => string;
  icon?: string;
}

export default function TopList({
  title,
  items,
  valueFormatter = (v) => v.toString(),
  icon,
}: TopListProps) {
  const { colors } = useTheme();

  // 找到最大值用于计算进度条宽度
  const maxValue = Math.max(...items.map(item => item.value), 1);

  const getRankColor = (index: number) => {
    if (index === 0) return '#FFD700'; // 金色
    if (index === 1) return '#C0C0C0'; // 银色
    if (index === 2) return '#CD7F32'; // 铜色
    return colors.textSecondary;
  };

  const styles = {
    container: {
      backgroundColor: colors.panelBackground,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.border}`,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '16px',
    },
    icon: {
      fontSize: '20px',
    },
    title: {
      fontSize: '16px',
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    list: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      backgroundColor: colors.background,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: `1px solid transparent`,
    },
    rank: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '700' as const,
      flexShrink: 0,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: '14px',
      fontWeight: '500' as const,
      color: colors.textPrimary,
      marginBottom: '4px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    subtitle: {
      fontSize: '12px',
      color: colors.textSecondary,
      marginBottom: '6px',
    },
    progressBar: {
      width: '100%',
      height: '4px',
      backgroundColor: colors.border,
      borderRadius: '2px',
      overflow: 'hidden',
    },
    progress: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: '2px',
      transition: 'width 0.5s ease',
    },
    value: {
      fontSize: '16px',
      fontWeight: '600' as const,
      color: colors.textPrimary,
      flexShrink: 0,
      minWidth: '60px',
      textAlign: 'right' as const,
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '32px 20px',
      color: colors.textSecondary,
      fontSize: '14px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {icon && <span style={styles.icon}>{icon}</span>}
        <div style={styles.title}>{title}</div>
      </div>

      {items.length === 0 ? (
        <div style={styles.emptyState}>暂无数据</div>
      ) : (
        <div style={styles.list}>
          {items.map((item, index) => {
            const progress = (item.value / maxValue) * 100;
            const rankColor = getRankColor(index);

            return (
              <div
                key={item.id}
                style={styles.item}
                onClick={item.onClick}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.border;
                  e.currentTarget.style.borderColor = colors.accent;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background;
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div
                  style={{
                    ...styles.rank,
                    backgroundColor: index < 3 ? rankColor : colors.border,
                    color: index < 3 ? '#fff' : colors.textSecondary,
                  }}
                >
                  {index + 1}
                </div>

                <div style={styles.content}>
                  <div style={styles.name}>{item.name}</div>
                  {item.subtitle && (
                    <div style={styles.subtitle}>{item.subtitle}</div>
                  )}
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progress,
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </div>

                <div style={styles.value}>{valueFormatter(item.value)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

