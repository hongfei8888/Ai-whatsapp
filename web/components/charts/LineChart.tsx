import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const WhatsAppColors = {
  accent: '#00a884',
  accentHover: '#008f6f',
  background: '#f0f2f5',
  panelBackground: '#ffffff',
  border: '#e9edef',
  textPrimary: '#111b21',
  textSecondary: '#667781',
  info: '#3498db',
};

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
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={WhatsAppColors.border} />
          <XAxis
            dataKey="date"
            stroke={WhatsAppColors.textSecondary}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke={WhatsAppColors.textSecondary}
            style={{ fontSize: '12px' }}
          />
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
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

