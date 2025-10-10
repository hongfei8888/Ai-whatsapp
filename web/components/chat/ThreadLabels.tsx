'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

const WhatsAppColors = {
  accent: '#00a884',
  accentHover: '#008f6f',
  panelBackground: '#ffffff',
  background: '#f0f2f5',
  border: '#e9edef',
  textPrimary: '#111b21',
  textSecondary: '#667781',
};

// 预定义标签及其颜色
const PREDEFINED_LABELS = [
  { name: '销售', color: '#00a884' },
  { name: '客服', color: '#3498db' },
  { name: 'VIP', color: '#f39c12' },
  { name: '重要', color: '#e74c3c' },
  { name: '待跟进', color: '#9b59b6' },
  { name: '已完成', color: '#95a5a6' },
];

interface ThreadLabelsProps {
  threadId: string;
  labels?: string[];
  onUpdate?: (labels: string[]) => void;
  compact?: boolean;
}

export default function ThreadLabels({
  threadId,
  labels: initialLabels = [],
  onUpdate,
  compact = false,
}: ThreadLabelsProps) {
  const [labels, setLabels] = useState<string[]>(initialLabels);
  const [showSelector, setShowSelector] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [updating, setUpdating] = useState(false);

  const getLabelColor = (label: string) => {
    const predefined = PREDEFINED_LABELS.find((l) => l.name === label);
    return predefined?.color || WhatsAppColors.textSecondary;
  };

  const handleToggleLabel = async (label: string) => {
    const newLabels = labels.includes(label)
      ? labels.filter((l) => l !== label)
      : [...labels, label];

    try {
      setUpdating(true);
      await api.threads.updateLabels(threadId, newLabels);
      setLabels(newLabels);
      onUpdate?.(newLabels);
    } catch (error) {
      console.error('更新标签失败:', error);
      alert('更新标签失败，请重试');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddCustomLabel = async () => {
    const trimmed = customLabel.trim();
    if (!trimmed) return;

    if (labels.includes(trimmed)) {
      alert('标签已存在');
      return;
    }

    const newLabels = [...labels, trimmed];

    try {
      setUpdating(true);
      await api.threads.updateLabels(threadId, newLabels);
      setLabels(newLabels);
      setCustomLabel('');
      onUpdate?.(newLabels);
    } catch (error) {
      console.error('添加标签失败:', error);
      alert('添加标签失败，请重试');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 标签显示 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: compact ? '4px' : '6px',
          alignItems: 'center',
        }}
      >
        {labels.map((label) => (
          <span
            key={label}
            style={{
              padding: compact ? '2px 8px' : '4px 10px',
              backgroundColor: `${getLabelColor(label)}20`,
              color: getLabelColor(label),
              borderRadius: '12px',
              fontSize: compact ? '11px' : '12px',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {label}
            {!compact && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLabel(label);
                }}
                disabled={updating}
                style={{
                  border: 'none',
                  background: 'none',
                  color: 'inherit',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  padding: 0,
                  fontSize: '14px',
                  opacity: 0.7,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </span>
        ))}

        {/* 添加标签按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSelector(!showSelector);
          }}
          disabled={updating}
          style={{
            padding: compact ? '2px 8px' : '4px 10px',
            backgroundColor: WhatsAppColors.background,
            border: `1px dashed ${WhatsAppColors.border}`,
            borderRadius: '12px',
            fontSize: compact ? '11px' : '12px',
            color: WhatsAppColors.textSecondary,
            cursor: updating ? 'not-allowed' : 'pointer',
            fontWeight: '500',
          }}
        >
          + 添加标签
        </button>
      </div>

      {/* 标签选择器 */}
      {showSelector && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            backgroundColor: WhatsAppColors.panelBackground,
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
            padding: '12px',
            zIndex: 1000,
            minWidth: '250px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 预定义标签 */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                fontSize: '11px',
                color: WhatsAppColors.textSecondary,
                marginBottom: '8px',
                fontWeight: '600',
              }}
            >
              快速选择
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PREDEFINED_LABELS.map((predefined) => {
                const isActive = labels.includes(predefined.name);
                return (
                  <button
                    key={predefined.name}
                    onClick={() => handleToggleLabel(predefined.name)}
                    disabled={updating}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: isActive ? `${predefined.color}20` : WhatsAppColors.background,
                      border: `1px solid ${isActive ? predefined.color : WhatsAppColors.border}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: isActive ? predefined.color : WhatsAppColors.textPrimary,
                      cursor: updating ? 'not-allowed' : 'pointer',
                      fontWeight: isActive ? '600' : '400',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isActive && '✓ '}
                    {predefined.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 自定义标签输入 */}
          <div>
            <div
              style={{
                fontSize: '11px',
                color: WhatsAppColors.textSecondary,
                marginBottom: '8px',
                fontWeight: '600',
              }}
            >
              自定义标签
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="输入标签名称..."
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomLabel();
                  }
                }}
                disabled={updating}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  border: `1px solid ${WhatsAppColors.border}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: WhatsAppColors.textPrimary,
                  backgroundColor: '#fff',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAddCustomLabel}
                disabled={updating || !customLabel.trim()}
                style={{
                  padding: '6px 12px',
                  backgroundColor: WhatsAppColors.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: updating || !customLabel.trim() ? 'not-allowed' : 'pointer',
                  opacity: updating || !customLabel.trim() ? 0.6 : 1,
                }}
              >
                添加
              </button>
            </div>
          </div>

          {/* 关闭按钮 */}
          <button
            onClick={() => setShowSelector(false)}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '8px',
              backgroundColor: WhatsAppColors.border,
              color: WhatsAppColors.textPrimary,
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            完成
          </button>
        </div>
      )}

      {/* 背景遮罩（用于关闭选择器） */}
      {showSelector && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setShowSelector(false)}
        />
      )}
    </div>
  );
}

