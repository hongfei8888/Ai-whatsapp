'use client';

import React, { useEffect, useRef } from 'react';

const WhatsAppColors = {
  accent: '#00a884',
  panelBackground: '#ffffff',
  border: '#e9edef',
  textPrimary: '#111b21',
  textSecondary: '#667781',
  danger: '#e74c3c',
};

export interface MenuItem {
  icon: string;
  label: string;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

interface MessageContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export default function MessageContextMenu({ x, y, items, onClose }: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 确保菜单不会超出屏幕
  useEffect(() => {
    if (!menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // 水平调整
    if (rect.right > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 10;
    }

    // 垂直调整
    if (rect.bottom > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 10;
    }

    menu.style.left = `${adjustedX}px`;
    menu.style.top = `${adjustedY}px`;
  }, [x, y]);

  return (
    <>
      {/* 背景遮罩 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9998,
        }}
        onClick={onClose}
      />

      {/* 菜单 */}
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          left: `${x}px`,
          top: `${y}px`,
          backgroundColor: WhatsAppColors.panelBackground,
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
          minWidth: '180px',
          padding: '8px 0',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              textAlign: 'left',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              opacity: item.disabled ? 0.5 : 1,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.backgroundColor = WhatsAppColors.border;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span
              style={{
                fontSize: '14px',
                color: item.color || WhatsAppColors.textPrimary,
                fontWeight: '400',
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

// 辅助函数：生成消息操作菜单项
export function getMessageMenuItems(
  message: any,
  options: {
    onReply?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onForward?: () => void;
    onStar?: () => void;
    onCopy?: () => void;
  }
): MenuItem[] {
  const items: MenuItem[] = [];
  const isOwnMessage = message.direction === 'OUT' || message.fromMe;

  // 引用回复
  if (options.onReply && !message.isDeleted) {
    items.push({
      icon: '↩️',
      label: '引用回复',
      onClick: options.onReply,
    });
  }

  // 编辑（仅自己的消息，且未删除）
  if (options.onEdit && isOwnMessage && !message.isDeleted && message.text) {
    items.push({
      icon: '✏️',
      label: '编辑消息',
      onClick: options.onEdit,
    });
  }

  // 转发（未删除的消息）
  if (options.onForward && !message.isDeleted) {
    items.push({
      icon: '➡️',
      label: '转发消息',
      onClick: options.onForward,
    });
  }

  // 标记星标
  if (options.onStar && !message.isDeleted) {
    items.push({
      icon: message.isStarred ? '⭐' : '☆',
      label: message.isStarred ? '取消星标' : '添加星标',
      onClick: options.onStar,
    });
  }

  // 复制文本
  if (options.onCopy && message.text && !message.isDeleted) {
    items.push({
      icon: '📋',
      label: '复制文本',
      onClick: options.onCopy,
    });
  }

  // 删除（仅自己的消息）
  if (options.onDelete && isOwnMessage && !message.isDeleted) {
    items.push({
      icon: '🗑️',
      label: '删除消息',
      onClick: options.onDelete,
      color: WhatsAppColors.danger,
    });
  }

  return items;
}

