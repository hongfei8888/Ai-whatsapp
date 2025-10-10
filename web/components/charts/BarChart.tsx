import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={WhatsAppColors.border} />
          {layout === 'vertical' ? (
            <>
              <XAxis type="number" stroke={WhatsAppColors.textSecondary} style={{ fontSize: '12px' }} />
              <YAxis type="category" dataKey="name" stroke={WhatsAppColors.textSecondary} style={{ fontSize: '12px' }} />
            </>
          ) : (
            <>
              <XAxis type="category" dataKey="name" stroke={WhatsAppColors.textSecondary} style={{ fontSize: '12px' }} />
              <YAxis type="number" stroke={WhatsAppColors.textSecondary} style={{ fontSize: '12px' }} />
            </>
          )}
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
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

