'use client';

import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/lib/theme-context';

interface LineChartProps {
  data: Array<{
    date: string;
    [key: string]: any;
  }>;
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  title?: string;
  height?: number;
}

export default function LineChart({ data, lines, title, height = 300 }: LineChartProps) {
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
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis
            dataKey="date"
            stroke={colors.textSecondary}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke={colors.textSecondary}
            style={{ fontSize: '12px' }}
          />
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
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={800}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

