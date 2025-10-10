import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const WhatsAppColors = {
  accent: '#00a884',
  success: '#00a884',
  danger: '#e74c3c',
  warning: '#f39c12',
  info: '#3498db',
  panelBackground: '#ffffff',
  border: '#e9edef',
  textPrimary: '#111b21',
  textSecondary: '#667781',
};

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title?: string;
  height?: number;
}

const DEFAULT_COLORS = [
  WhatsAppColors.success,
  WhatsAppColors.danger,
  WhatsAppColors.warning,
  WhatsAppColors.info,
  '#9b59b6',
  '#e67e22',
];

export default function PieChart({ data, title, height = 300 }: PieChartProps) {
  return (
    <div style={{ width: '100%' }}>
      {title && (
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: WhatsAppColors.textPrimary,
          marginBottom: '16px',
        }}>
          {title}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: WhatsAppColors.panelBackground,
              border: `1px solid ${WhatsAppColors.border}`,
              borderRadius: '8px',
              fontSize: '13px',
            }}
          />
          <Legend
            wrapperStyle={{
              fontSize: '13px',
              color: WhatsAppColors.textSecondary,
            }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

