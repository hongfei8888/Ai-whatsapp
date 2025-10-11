'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';

export default function ThemeToggle() {
  const { theme, toggleTheme, colors } = useTheme();

  const styles = {
    button: {
      position: 'relative' as const,
      width: '56px',
      height: '28px',
      backgroundColor: theme === 'dark' ? colors.accent : colors.border,
      borderRadius: '14px',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      padding: 0,
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
    },
    slider: {
      position: 'absolute' as const,
      top: '2px',
      left: theme === 'dark' ? '30px' : '2px',
      width: '24px',
      height: '24px',
      backgroundColor: '#fff',
      borderRadius: '50%',
      transition: 'left 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    },
  };

  return (
    <button
      style={styles.button}
      onClick={toggleTheme}
      title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
      aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
    >
      <div style={styles.slider}>
        {theme === 'dark' ? '🌙' : '☀️'}
      </div>
    </button>
  );
}

