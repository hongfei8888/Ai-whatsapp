'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// 动态导入所有图表组件，禁用 SSR
export const LineChart = dynamic(() => import('./LineChart'), { 
  ssr: false,
  loading: () => <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>
});

export const PieChart = dynamic(() => import('./PieChart'), { 
  ssr: false,
  loading: () => <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>
});

export const BarChart = dynamic(() => import('./BarChart'), { 
  ssr: false,
  loading: () => <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>
});

export const AreaChart = dynamic(() => import('./AreaChart'), { 
  ssr: false,
  loading: () => <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>
});

export const StackedBarChart = dynamic(() => import('./StackedBarChart'), { 
  ssr: false,
  loading: () => <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>
});

export const HeatMap = dynamic(() => import('./HeatMap'), { 
  ssr: false,
  loading: () => <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>
});

