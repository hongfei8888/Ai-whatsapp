'use client';

import React, { useState, useEffect } from 'react';
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

interface ForwardDialogProps {
  message: any;
  onForward: (threadIds: string[]) => void;
  onClose: () => void;
}

export default function ForwardDialog({ message, onForward, onClose }: ForwardDialogProps) {
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [forwarding, setForwarding] = useState(false);

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const data = await api.getThreads();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('加载会话列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleThread = (threadId: string) => {
    const newSelected = new Set(selectedThreads);
    if (newSelected.has(threadId)) {
      newSelected.delete(threadId);
    } else {
      newSelected.add(threadId);
    }
    setSelectedThreads(newSelected);
  };

  const handleForward = async () => {
    if (selectedThreads.size === 0) {
      alert('请选择至少一个联系人');
      return;
    }

    try {
      setForwarding(true);
      await onForward(Array.from(selectedThreads));
      onClose();
    } catch (error) {
      console.error('转发失败:', error);
      alert('转发失败，请重试');
    } finally {
      setForwarding(false);
    }
  };

  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true;
    const name = thread.contact?.name || thread.contact?.phoneE164 || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getPreviewText = () => {
    if (message.text) {
      return message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text;
    }
    if (message.mediaType) {
      const mediaLabels: { [key: string]: string } = {
        image: '📷 图片',
        video: '🎥 视频',
        audio: '🎵 音频',
        document: '📄 文档',
      };
      return mediaLabels[message.mediaType] || '📎 媒体文件';
    }
    return '消息';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: WhatsAppColors.panelBackground,
          borderRadius: '12px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 头部 */}
        <div
          style={{
            padding: '20px',
            borderBottom: `1px solid ${WhatsAppColors.border}`,
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: WhatsAppColors.textPrimary,
              marginBottom: '4px',
            }}
          >
            转发消息
          </div>
          <div
            style={{
              fontSize: '13px',
              color: WhatsAppColors.textSecondary,
            }}
          >
            已选择 {selectedThreads.size} 个联系人
          </div>
        </div>

        {/* 消息预览 */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: WhatsAppColors.background,
            borderBottom: `1px solid ${WhatsAppColors.border}`,
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: WhatsAppColors.textSecondary,
              marginBottom: '8px',
            }}
          >
            转发内容：
          </div>
          <div
            style={{
              padding: '12px',
              backgroundColor: WhatsAppColors.panelBackground,
              borderRadius: '8px',
              fontSize: '14px',
              color: WhatsAppColors.textPrimary,
            }}
          >
            {getPreviewText()}
          </div>
        </div>

        {/* 搜索框 */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${WhatsAppColors.border}`,
          }}
        >
          <input
            type="text"
            placeholder="搜索联系人..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${WhatsAppColors.border}`,
              borderRadius: '8px',
              fontSize: '14px',
              color: WhatsAppColors.textPrimary,
              backgroundColor: WhatsAppColors.background,
              outline: 'none',
            }}
          />
        </div>

        {/* 联系人列表 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 20px',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: WhatsAppColors.textSecondary }}>
              加载中...
            </div>
          ) : filteredThreads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: WhatsAppColors.textSecondary }}>
              没有找到联系人
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = selectedThreads.has(thread.id);
              return (
                <div
                  key={thread.id}
                  onClick={() => toggleThread(thread.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: isSelected ? `${WhatsAppColors.accent}20` : 'transparent',
                    transition: 'background-color 0.2s',
                    marginBottom: '4px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = WhatsAppColors.background;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {/* 复选框 */}
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: `2px solid ${isSelected ? WhatsAppColors.accent : WhatsAppColors.border}`,
                      backgroundColor: isSelected ? WhatsAppColors.accent : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '12px',
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && '✓'}
                  </div>

                  {/* 头像 */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#6b7c85',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '16px',
                      fontWeight: '500',
                      flexShrink: 0,
                    }}
                  >
                    {(thread.contact?.name || thread.contact?.phoneE164 || '?')[0].toUpperCase()}
                  </div>

                  {/* 联系人信息 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: WhatsAppColors.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {thread.contact?.name || thread.contact?.phoneE164}
                    </div>
                    {thread.contact?.name && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: WhatsAppColors.textSecondary,
                        }}
                      >
                        {thread.contact?.phoneE164}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部按钮 */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: `1px solid ${WhatsAppColors.border}`,
            display: 'flex',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            disabled={forwarding}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: WhatsAppColors.border,
              color: WhatsAppColors.textPrimary,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: forwarding ? 'not-allowed' : 'pointer',
              opacity: forwarding ? 0.6 : 1,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!forwarding) {
                e.currentTarget.style.backgroundColor = WhatsAppColors.textSecondary;
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!forwarding) {
                e.currentTarget.style.backgroundColor = WhatsAppColors.border;
                e.currentTarget.style.color = WhatsAppColors.textPrimary;
              }
            }}
          >
            取消
          </button>

          <button
            onClick={handleForward}
            disabled={forwarding || selectedThreads.size === 0}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: WhatsAppColors.accent,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: forwarding || selectedThreads.size === 0 ? 'not-allowed' : 'pointer',
              opacity: forwarding || selectedThreads.size === 0 ? 0.6 : 1,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!forwarding && selectedThreads.size > 0) {
                e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!forwarding) {
                e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
              }
            }}
          >
            {forwarding ? '转发中...' : `转发 (${selectedThreads.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}

