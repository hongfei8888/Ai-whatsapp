'use client';

import React, { useState } from 'react';
import { useTheme } from '@/lib/theme-context';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
  preset?: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS = [
  { label: '今天', value: 'today' },
  { label: '最近7天', value: '7days' },
  { label: '最近30天', value: '30days' },
  { label: '本月', value: 'thisMonth' },
  { label: '上月', value: 'lastMonth' },
];

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const { colors } = useTheme();
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handlePreset = (preset: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);

    switch (preset) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case '7days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case '30days':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      default:
        return;
    }

    onChange({ startDate, endDate, preset });
    setShowCustom(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const startDate = new Date(customStart);
      const endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);
      onChange({ startDate, endDate, preset: 'custom' });
      setShowCustom(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '未选择';
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const styles = {
    container: {
      display: 'inline-block',
      position: 'relative' as const,
    },
    trigger: {
      padding: '8px 16px',
      backgroundColor: colors.panelBackground,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: colors.textPrimary,
      transition: 'all 0.2s',
    },
    dropdown: {
      position: 'absolute' as const,
      top: '100%',
      right: 0,
      marginTop: '8px',
      backgroundColor: colors.panelBackground,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '12px',
      boxShadow: colors.shadowHover,
      zIndex: 1000,
      minWidth: '280px',
    },
    presets: {
      display: 'grid',
      gap: '6px',
      marginBottom: '12px',
    },
    presetButton: {
      padding: '10px 16px',
      backgroundColor: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      cursor: 'pointer',
      textAlign: 'left' as const,
      fontSize: '13px',
      color: colors.textPrimary,
      transition: 'all 0.2s',
    },
    activePreset: {
      backgroundColor: colors.accent,
      color: '#fff',
      borderColor: colors.accent,
    },
    divider: {
      height: '1px',
      backgroundColor: colors.border,
      margin: '12px 0',
    },
    customSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    label: {
      fontSize: '12px',
      color: colors.textSecondary,
      marginBottom: '4px',
    },
    input: {
      padding: '8px 12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      fontSize: '13px',
      color: colors.textPrimary,
      backgroundColor: colors.background,
      outline: 'none',
      width: '100%',
    },
    buttonRow: {
      display: 'flex',
      gap: '8px',
      marginTop: '12px',
    },
    button: {
      flex: 1,
      padding: '8px 12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500' as const,
      transition: 'all 0.2s',
    },
    applyButton: {
      backgroundColor: colors.accent,
      color: '#fff',
      border: `1px solid ${colors.accent}`,
    },
    cancelButton: {
      backgroundColor: colors.background,
      color: colors.textPrimary,
    },
  };

  return (
    <div style={styles.container}>
      <div
        style={styles.trigger}
        onClick={() => setShowCustom(!showCustom)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = colors.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = colors.border;
        }}
      >
        <span>📅</span>
        <span>
          {value.startDate && value.endDate
            ? `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`
            : '选择时间范围'}
        </span>
      </div>

      {showCustom && (
        <div style={styles.dropdown}>
          <div style={styles.presets}>
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                style={{
                  ...styles.presetButton,
                  ...(value.preset === preset.value ? styles.activePreset : {}),
                }}
                onClick={() => handlePreset(preset.value)}
                onMouseEnter={(e) => {
                  if (value.preset !== preset.value) {
                    e.currentTarget.style.backgroundColor = colors.border;
                  }
                }}
                onMouseLeave={(e) => {
                  if (value.preset !== preset.value) {
                    e.currentTarget.style.backgroundColor = colors.background;
                  }
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div style={styles.divider} />

          <div style={styles.customSection}>
            <div>
              <div style={styles.label}>开始日期</div>
              <input
                type="date"
                style={styles.input}
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div>
              <div style={styles.label}>结束日期</div>
              <input
                type="date"
                style={styles.input}
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>

            <div style={styles.buttonRow}>
              <button
                style={{ ...styles.button, ...styles.cancelButton }}
                onClick={() => setShowCustom(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.border;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background;
                }}
              >
                取消
              </button>
              <button
                style={{ ...styles.button, ...styles.applyButton }}
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
                onMouseEnter={(e) => {
                  if (customStart && customEnd) {
                    e.currentTarget.style.backgroundColor = colors.accentHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (customStart && customEnd) {
                    e.currentTarget.style.backgroundColor = colors.accent;
                  }
                }}
              >
                应用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

