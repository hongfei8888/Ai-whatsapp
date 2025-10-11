export type Theme = 'light' | 'dark';

export interface ThemeColors {
  // 主色调
  accent: string;
  accentHover: string;
  
  // 背景色
  background: string;
  panelBackground: string;
  
  // 边框和分隔线
  border: string;
  
  // 文字颜色
  textPrimary: string;
  textSecondary: string;
  
  // 状态颜色
  success: string;
  warning: string;
  danger: string;
  info: string;
  
  // 图表颜色
  chartColors: string[];
  
  // 阴影
  shadow: string;
  shadowHover: string;
}

export const lightTheme: ThemeColors = {
  accent: '#00a884',
  accentHover: '#008f6f',
  background: '#f0f2f5',
  panelBackground: '#ffffff',
  border: '#e9edef',
  textPrimary: '#111b21',
  textSecondary: '#667781',
  success: '#00a884',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#3498db',
  chartColors: ['#00a884', '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#f39c12'],
  shadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  shadowHover: '0 4px 12px rgba(0, 0, 0, 0.12)',
};

export const darkTheme: ThemeColors = {
  accent: '#00a884',
  accentHover: '#06cf9c',
  background: '#0b141a',
  panelBackground: '#1f2c33',
  border: '#2a3942',
  textPrimary: '#e9edef',
  textSecondary: '#8696a0',
  success: '#00a884',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#53bdeb',
  chartColors: ['#00a884', '#53bdeb', '#b794f6', '#f39c12', '#48c9b0', '#f1c40f'],
  shadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
  shadowHover: '0 4px 12px rgba(0, 0, 0, 0.6)',
};

export const getThemeColors = (theme: Theme): ThemeColors => {
  return theme === 'dark' ? darkTheme : lightTheme;
};

// 兼容旧的 WhatsAppColors 导出
export const WhatsAppColors = lightTheme;

