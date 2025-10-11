'use client';

import React from 'react';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/lib/theme-context';

interface AreaChartProps {
  data: Array<{
    [key: string]: any;
  }>;
  areas: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  title?: string;
  height?: number;
  xAxisKey?: string;
}

export default function AreaChart({
  data,
  areas,
  title,
  height = 300,
  xAxisKey = 'date',
}: AreaChartProps) {
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
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            {areas.map((area, index) => (
              <linearGradient key={`gradient-${index}`} id={`color-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={area.color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={area.color} stopOpacity={0.1}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
          <XAxis
            dataKey={xAxisKey}
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
          {areas.map((area) => (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              name={area.name}
              stroke={area.color}
              fillOpacity={1}
              fill={`url(#color-${area.dataKey})`}
              strokeWidth={2}
              animationDuration={800}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

