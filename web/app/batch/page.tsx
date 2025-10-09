'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { BatchOperation } from '@/lib/types';

const S = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px',
    background: 'linear-gradient(to bottom, #EEF2FF, #FFFFFF)',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
  },
  button: {
    padding: '10px 20px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  buttonPrimary: {
    background: '#4F46E5',
    color: '#FFFFFF',
    borderColor: '#4F46E5',
  },
  buttonSecondary: {
    background: '#FFFFFF',
    color: '#374151',
    borderColor: '#D1D5DB',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid #E5E7EB',
  },
  tab: (active: boolean) => ({
    padding: '12px 20px',
    border: 'none',
    background: 'transparent',
    color: active ? '#4F46E5' : '#6B7280',
    borderBottom: active ? '2px solid #4F46E5' : '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? 500 : 400,
    transition: 'all 0.2s',
  }),
  batchList: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  batchItem: {
    padding: '20px',
    borderBottom: '1px solid #F3F4F6',
    transition: 'background-color 0.2s',
  },
  batchItemHover: {
    background: '#F8FAFC',
  },
  batchHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  batchTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  batchStatus: (status: string) => ({
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    background: getStatusColor(status).background,
    color: getStatusColor(status).color,
  }),
  batchDescription: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '12px',
  },
  batchProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  progressBar: {
    flex: 1,
    height: '8px',
    background: '#E5E7EB',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: (progress: number) => ({
    height: '100%',
    width: `${progress}%`,
    background: '#4F46E5',
    transition: 'width 0.3s ease',
  }),
  progressText: {
    fontSize: '12px',
    color: '#6B7280',
    minWidth: '60px',
  },
  batchStats: {
    display: 'flex',
    gap: '24px',
    fontSize: '12px',
    color: '#6B7280',
  },
  batchActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  actionButton: {
    padding: '6px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    background: '#FFFFFF',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  actionButtonDanger: {
    background: '#DC2626',
    color: '#FFFFFF',
    borderColor: '#DC2626',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#6B7280',
  },
  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyStateTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  },
  emptyStateText: {
    fontSize: '14px',
    marginBottom: '24px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
};

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return { background: '#D1FAE5', color: '#065F46' };
    case 'processing':
      return { background: '#DBEAFE', color: '#1E40AF' };
    case 'failed':
      return { background: '#FEE2E2', color: '#991B1B' };
    case 'cancelled':
      return { background: '#F3F4F6', color: '#374151' };
    default:
      return { background: '#FEF3C7', color: '#92400E' };
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'pending':
      return '等待中';
    case 'processing':
      return '处理中';
    case 'completed':
      return '已完成';
    case 'failed':
      return '失败';
    case 'cancelled':
      return '已取消';
    default:
      return status;
  }
}

function getTypeText(type: string) {
  switch (type) {
    case 'import':
      return '批量导入';
    case 'send':
      return '批量发送';
    case 'tag':
      return '标签管理';
    case 'delete':
      return '批量删除';
    case 'archive':
      return '批量归档';
    default:
      return type;
  }
}

export default function BatchPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'import' | 'send' | 'tag' | 'delete'>('all');
  const [batches, setBatches] = useState<BatchOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBatch, setHoveredBatch] = useState<string | null>(null);

  useEffect(() => {
    loadBatches();
  }, [activeTab]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const filters = activeTab === 'all' ? {} : { type: activeTab };
      const batchesData = await api.batch.list(filters);
      setBatches(batchesData);
    } catch (error) {
      console.error('加载批量操作失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBatch = async (batchId: string) => {
    if (!confirm('确定要取消这个批量操作吗？')) return;
    
    try {
      await api.batch.cancel(batchId);
      loadBatches();
      alert('批量操作已取消');
    } catch (error) {
      console.error('取消批量操作失败:', error);
      alert('取消失败，请重试');
    }
  };

  const filteredBatches = batches.filter(batch => {
    if (activeTab === 'all') return true;
    return batch.type === activeTab;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  const formatDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt) return '-';
    
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const duration = end.getTime() - start.getTime();
    
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    }
    return `${seconds}秒`;
  };

  if (loading) {
    return (
      <div style={S.container}>
        <div style={S.loadingContainer}>
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h1 style={S.title}>批量操作管理</h1>
        <div style={S.actionButtons}>
          <a href="/batch/import" style={{...S.button, ...S.buttonSecondary}}>
            📥 批量导入
          </a>
          <a href="/batch/send" style={{...S.button, ...S.buttonPrimary}}>
            📤 批量发送
          </a>
          <a href="/batch/tags" style={{...S.button, ...S.buttonSecondary}}>
            🏷️ 标签管理
          </a>
        </div>
      </div>

      <div style={S.tabs}>
        <button
          style={S.tab(activeTab === 'all')}
          onClick={() => setActiveTab('all')}
        >
          全部 ({batches.length})
        </button>
        <button
          style={S.tab(activeTab === 'import')}
          onClick={() => setActiveTab('import')}
        >
          导入 ({batches.filter(b => b.type === 'import').length})
        </button>
        <button
          style={S.tab(activeTab === 'send')}
          onClick={() => setActiveTab('send')}
        >
          发送 ({batches.filter(b => b.type === 'send').length})
        </button>
        <button
          style={S.tab(activeTab === 'tag')}
          onClick={() => setActiveTab('tag')}
        >
          标签 ({batches.filter(b => b.type === 'tag').length})
        </button>
        <button
          style={S.tab(activeTab === 'delete')}
          onClick={() => setActiveTab('delete')}
        >
          删除 ({batches.filter(b => b.type === 'delete').length})
        </button>
      </div>

      {filteredBatches.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyStateIcon}>📋</div>
          <div style={S.emptyStateTitle}>暂无批量操作</div>
          <div style={S.emptyStateText}>
            还没有执行过任何批量操作，点击上方按钮开始批量操作
          </div>
        </div>
      ) : (
        <div style={S.batchList}>
          {filteredBatches.map(batch => {
            const isHovered = hoveredBatch === batch.id;
            
            return (
              <div
                key={batch.id}
                style={{
                  ...S.batchItem,
                  ...(isHovered ? S.batchItemHover : {}),
                }}
                onMouseEnter={() => setHoveredBatch(batch.id)}
                onMouseLeave={() => setHoveredBatch(null)}
              >
                <div style={S.batchHeader}>
                  <div>
                    <h3 style={S.batchTitle}>
                      {getTypeText(batch.type)} - {batch.title}
                    </h3>
                  </div>
                  <div style={S.batchStatus(batch.status)}>
                    {getStatusText(batch.status)}
                  </div>
                </div>

                {batch.description && (
                  <div style={S.batchDescription}>{batch.description}</div>
                )}

                <div style={S.batchProgress}>
                  <div style={S.progressBar}>
                    <div style={S.progressFill(batch.progress)}></div>
                  </div>
                  <div style={S.progressText}>{batch.progress}%</div>
                </div>

                <div style={S.batchStats}>
                  <span>总计: {batch.totalCount}</span>
                  <span>已处理: {batch.processedCount}</span>
                  <span>成功: {batch.successCount}</span>
                  <span>失败: {batch.failedCount}</span>
                  <span>创建时间: {formatDate(batch.createdAt)}</span>
                  {batch.startedAt && (
                    <span>耗时: {formatDuration(batch.startedAt, batch.completedAt)}</span>
                  )}
                </div>

                {(batch.status === 'pending' || batch.status === 'processing') && (
                  <div style={S.batchActions}>
                    <button
                      style={{...S.actionButton, ...S.actionButtonDanger}}
                      onClick={() => handleCancelBatch(batch.id)}
                    >
                      取消操作
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
