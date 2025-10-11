'use client';

import React, { useState, useEffect, useRef } from 'react';
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

interface MessageSearchProps {
  threadId?: string;
  onMessageClick?: (messageId: string) => void;
  onClose?: () => void;
}

export default function MessageSearch({ threadId, onMessageClick, onClose }: MessageSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // 清除之前的搜索定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    // 防抖搜索
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query.trim());
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, threadId]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      const result = await api.messages.search(searchQuery, threadId, 50);
      
      setResults(result.messages || []);
      setTotalResults(result.total || 0);
    } catch (error) {
      console.error('搜索失败:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!text || !query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          style={{
            backgroundColor: '#ffeb3b',
            color: WhatsAppColors.textPrimary,
            fontWeight: '600',
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days} 天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  return (
    <div
      style={{
        backgroundColor: WhatsAppColors.panelBackground,
        borderBottom: `1px solid ${WhatsAppColors.border}`,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '60vh',
      }}
    >
      {/* 搜索头部 */}
      <div
        style={{
          padding: '16px',
          borderBottom: `1px solid ${WhatsAppColors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="搜索消息..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: `1px solid ${WhatsAppColors.border}`,
            borderRadius: '24px',
            fontSize: '14px',
            color: WhatsAppColors.textPrimary,
            backgroundColor: WhatsAppColors.background,
            outline: 'none',
          }}
        />
        {onClose && (
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: WhatsAppColors.border,
              color: WhatsAppColors.textPrimary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* 搜索结果统计 */}
      {query.trim() && (
        <div
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            color: WhatsAppColors.textSecondary,
            backgroundColor: WhatsAppColors.background,
            borderBottom: `1px solid ${WhatsAppColors.border}`,
          }}
        >
          {loading
            ? '搜索中...'
            : `找到 ${totalResults} 条消息${totalResults > results.length ? ` (显示前 ${results.length} 条)` : ''}`}
        </div>
      )}

      {/* 搜索结果列表 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '400px',
        }}
      >
        {!query.trim() && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: WhatsAppColors.textSecondary,
              fontSize: '14px',
            }}
          >
            输入关键词搜索消息
          </div>
        )}

        {query.trim() && !loading && results.length === 0 && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: WhatsAppColors.textSecondary,
              fontSize: '14px',
            }}
          >
            没有找到匹配的消息
          </div>
        )}

        {results.map((message) => (
          <div
            key={message.id}
            onClick={() => {
              onMessageClick?.(message.id);
              onClose?.();
            }}
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${WhatsAppColors.border}`,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = WhatsAppColors.background;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* 联系人名称（如果是全局搜索） */}
            {!threadId && message.thread?.contact && (
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: WhatsAppColors.accent,
                  marginBottom: '4px',
                }}
              >
                {message.thread.contact.name || message.thread.contact.phoneE164}
              </div>
            )}

            {/* 消息内容 */}
            <div
              style={{
                fontSize: '14px',
                color: WhatsAppColors.textPrimary,
                marginBottom: '4px',
                lineHeight: '1.4',
              }}
            >
              {message.text ? highlightText(message.text, query) : '(媒体消息)'}
            </div>

            {/* 时间和方向 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: WhatsAppColors.textSecondary,
                }}
              >
                {formatDate(message.createdAt)}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: message.direction === 'OUT' ? WhatsAppColors.accent : WhatsAppColors.textSecondary,
                }}
              >
                {message.direction === 'OUT' ? '→ 发送' : '← 接收'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

