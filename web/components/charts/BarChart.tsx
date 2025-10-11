'use client';

import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/lib/theme-context';

interface BarChartProps {
  data: Array<{
    name: string;
    [key: string]: any;
  }>;
  bars: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  title?: string;
  height?: number;
  layout?: 'horizontal' | 'vertical';
}

export default function BarChart({
  data,
  bars,
  title,
  height = 300,
  layout = 'vertical',
}: BarChartProps) {
  const { colors } = useTheme();

  return (
    <div style={{ width: '100%' }}>
      {title && (
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: '16px',
        }}>
          {title}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          {layout === 'vertical' ? (
            <>
              <XAxis type="number" stroke={colors.textSecondary} style={{ fontSize: '12px' }} />
              <YAxis type="category" dataKey="name" stroke={colors.textSecondary} style={{ fontSize: '12px' }} />
            </>
          ) : (
            <>
              <XAxis type="category" dataKey="name" stroke={colors.textSecondary} style={{ fontSize: '12px' }} />
              <YAxis type="number" stroke={colors.textSecondary} style={{ fontSize: '12px' }} />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: colors.panelBackground,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: '13px',
              color: colors.textPrimary,
            }}
          />
          <Legend
            wrapperStyle={{
              fontSize: '13px',
              color: colors.textSecondary,
            }}
          />
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color}
              radius={[4, 4, 0, 0]}
              animationDuration={800}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

