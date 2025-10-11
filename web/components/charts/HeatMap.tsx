'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';

interface HeatMapData {
  hour: number; // 0-23
  day: number; // 0-6 (0=周日)
  value: number;
}

interface HeatMapProps {
  data: HeatMapData[];
  title?: string;
  height?: number;
}

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function HeatMap({ data, title, height = 300 }: HeatMapProps) {
  const { colors, theme } = useTheme();

  // 找出最大值用于归一化
  const maxValue = Math.max(...data.map(d => d.value), 1);

  // 创建数据映射
  const dataMap = new Map<string, number>();
  data.forEach(item => {
    dataMap.set(`${item.day}-${item.hour}`, item.value);
  });

  // 获取颜色强度
  const getColor = (value: number) => {
    const intensity = value / maxValue;
    if (theme === 'dark') {
      // 深色模式：从深蓝到亮绿
      const r = Math.floor(0 + (0 - 0) * intensity);
      const g = Math.floor(100 + (168 - 100) * intensity);
      const b = Math.floor(150 + (132 - 150) * intensity);
      return `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.7})`;
    } else {
      // 浅色模式：从浅色到深绿
      const r = Math.floor(240 + (0 - 240) * intensity);
      const g = Math.floor(250 + (168 - 250) * intensity);
      const b = Math.floor(245 + (132 - 245) * intensity);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const cellWidth = 30;
  const cellHeight = 30;
  const labelWidth = 50;
  const labelHeight = 30;

  const styles = {
    container: {
      width: '100%',
    },
    title: {
      fontSize: '16px',
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: '16px',
    },
    grid: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '2px',
      overflowX: 'auto' as const,
      paddingBottom: '10px',
    },
    row: {
      display: 'flex',
      gap: '2px',
      alignItems: 'center',
    },
    dayLabel: {
      width: `${labelWidth}px`,
      fontSize: '12px',
      color: colors.textSecondary,
      textAlign: 'right' as const,
      paddingRight: '8px',
    },
    cell: {
      width: `${cellWidth}px`,
      height: `${cellHeight}px`,
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: '500' as const,
      cursor: 'pointer',
      border: `1px solid ${colors.border}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
    hourLabels: {
      display: 'flex',
      gap: '2px',
      marginBottom: '4px',
      paddingLeft: `${labelWidth}px`,
    },
    hourLabel: {
      width: `${cellWidth}px`,
      fontSize: '10px',
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    legend: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '16px',
      fontSize: '12px',
      color: colors.textSecondary,
    },
    legendGradient: {
      width: '200px',
      height: '20px',
      borderRadius: '4px',
      background: theme === 'dark' 
        ? 'linear-gradient(to right, rgba(0,100,150,0.3), rgba(0,168,132,1))'
        : 'linear-gradient(to right, rgb(240,250,245), rgb(0,168,132))',
    },
  };

  return (
    <div style={styles.container}>
      {title && <div style={styles.title}>{title}</div>}
      
      {/* 小时标签 */}
      <div style={styles.hourLabels}>
        {HOURS.filter((_, i) => i % 3 === 0).map((hour) => (
          <div key={hour} style={{ ...styles.hourLabel, width: `${cellWidth * 3}px` }}>
            {hour}时
          </div>
        ))}
      </div>

      {/* 热力图网格 */}
      <div style={styles.grid}>
        {DAYS.map((day, dayIndex) => (
          <div key={dayIndex} style={styles.row}>
            <div style={styles.dayLabel}>{day}</div>
            {HOURS.map((hour) => {
              const value = dataMap.get(`${dayIndex}-${hour}`) || 0;
              return (
                <div
                  key={hour}
                  style={{
                    ...styles.cell,
                    backgroundColor: value > 0 ? getColor(value) : colors.background,
                  }}
                  title={`${day} ${hour}:00 - ${value} 条消息`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = colors.shadowHover;
                    e.currentTarget.style.zIndex = '10';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.zIndex = '1';
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div style={styles.legend}>
        <span>少</span>
        <div style={styles.legendGradient} />
        <span>多</span>
      </div>
    </div>
  );
}

