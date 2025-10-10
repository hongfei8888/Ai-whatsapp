'use client';

import React from 'react';

const WhatsAppColors = {
  accent: '#00a884',
  background: '#f0f2f5',
  panelBackground: '#ffffff',
  border: '#e9edef',
  textPrimary: '#111b21',
  textSecondary: '#667781',
};

interface QuotedMessageProps {
  message: {
    id: string;
    text?: string | null;
    direction?: string;
    mediaType?: string;
    mediaFileName?: string;
    isDeleted?: boolean;
  };
  onJumpTo?: (messageId: string) => void;
  onCancel?: () => void;
  compact?: boolean;
}

export default function QuotedMessage({
  message,
  onJumpTo,
  onCancel,
  compact = false,
}: QuotedMessageProps) {
  const isOutgoing = message.direction === 'OUT';

  const getPreviewText = () => {
    if (message.isDeleted) {
      return '此消息已删除';
    }

    if (message.mediaType) {
      const mediaIcons: { [key: string]: string } = {
        image: '📷 图片',
        video: '🎥 视频',
        audio: '🎵 音频',
        document: '📄 文档',
      };
      return mediaIcons[message.mediaType] || '📎 文件';
    }

    return message.text || '消息';
  };

  return (
    <div
      onClick={() => onJumpTo?.(message.id)}
      style={{
        padding: compact ? '8px 12px' : '10px 14px',
        backgroundColor: compact
          ? 'rgba(0, 168, 132, 0.1)'
          : WhatsAppColors.background,
        borderLeft: `3px solid ${WhatsAppColors.accent}`,
        borderRadius: '6px',
        cursor: onJumpTo ? 'pointer' : 'default',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '8px',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        if (onJumpTo) {
          e.currentTarget.style.backgroundColor = compact
            ? 'rgba(0, 168, 132, 0.15)'
            : WhatsAppColors.border;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = compact
          ? 'rgba(0, 168, 132, 0.1)'
          : WhatsAppColors.background;
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* 发送者标识 */}
        <div
          style={{
            fontSize: compact ? '11px' : '12px',
            color: WhatsAppColors.accent,
            fontWeight: '600',
            marginBottom: '2px',
          }}
        >
          {isOutgoing ? '你' : '对方'}
        </div>

        {/* 消息预览 */}
        <div
          style={{
            fontSize: compact ? '13px' : '14px',
            color: message.isDeleted
              ? WhatsAppColors.textSecondary
              : WhatsAppColors.textPrimary,
            fontStyle: message.isDeleted ? 'italic' : 'normal',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {getPreviewText()}
        </div>
      </div>

      {/* 取消按钮 */}
      {onCancel && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: WhatsAppColors.textSecondary,
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            flexShrink: 0,
            opacity: 0.7,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

