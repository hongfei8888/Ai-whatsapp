'use client';

import React, { useState, useRef, useEffect } from 'react';

const WhatsAppColors = {
  accent: '#00a884',
  accentHover: '#008f6f',
  background: '#f0f2f5',
  border: '#e9edef',
  textPrimary: '#111b21',
  textSecondary: '#667781',
  danger: '#e74c3c',
};

interface MessageEditorProps {
  initialText: string;
  onSave: (newText: string) => void;
  onCancel: () => void;
}

export default function MessageEditor({ initialText, onSave, onCancel }: MessageEditorProps) {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // 自动聚焦并选中文本
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleSave = async () => {
    const trimmedText = text.trim();
    
    if (!trimmedText) {
      alert('消息内容不能为空');
      return;
    }

    if (trimmedText === initialText.trim()) {
      onCancel();
      return;
    }

    try {
      setSaving(true);
      await onSave(trimmedText);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: WhatsAppColors.background,
        borderRadius: '8px',
        border: `1px solid ${WhatsAppColors.accent}`,
      }}
    >
      {/* 编辑提示 */}
      <div
        style={{
          fontSize: '11px',
          color: WhatsAppColors.accent,
          marginBottom: '8px',
          fontWeight: '600',
        }}
      >
        ✏️ 编辑消息
      </div>

      {/* 文本输入框 */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={saving}
        style={{
          width: '100%',
          minHeight: '60px',
          padding: '8px',
          border: `1px solid ${WhatsAppColors.border}`,
          borderRadius: '6px',
          fontSize: '14px',
          color: WhatsAppColors.textPrimary,
          backgroundColor: '#fff',
          resize: 'vertical',
          fontFamily: 'inherit',
          outline: 'none',
        }}
        placeholder="输入消息..."
      />

      {/* 按钮组 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          marginTop: '8px',
        }}
      >
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: '8px 16px',
            backgroundColor: WhatsAppColors.border,
            color: WhatsAppColors.textPrimary,
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!saving) {
              e.currentTarget.style.backgroundColor = WhatsAppColors.textSecondary;
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseLeave={(e) => {
            if (!saving) {
              e.currentTarget.style.backgroundColor = WhatsAppColors.border;
              e.currentTarget.style.color = WhatsAppColors.textPrimary;
            }
          }}
        >
          取消
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: WhatsAppColors.accent,
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: saving || !text.trim() ? 'not-allowed' : 'pointer',
            opacity: saving || !text.trim() ? 0.6 : 1,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!saving && text.trim()) {
              e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!saving) {
              e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
            }
          }}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {/* 快捷键提示 */}
      <div
        style={{
          fontSize: '11px',
          color: WhatsAppColors.textSecondary,
          marginTop: '8px',
          textAlign: 'right',
        }}
      >
        Enter 保存 · Shift+Enter 换行 · Esc 取消
      </div>
    </div>
  );
}

