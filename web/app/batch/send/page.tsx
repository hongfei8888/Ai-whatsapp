'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAccount } from '@/lib/account-context';
import type { MessageTemplate, BatchSendConfig } from '@/lib/types';

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
  backButton: {
    background: '#F3F4F6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  form: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#FFFFFF',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#FFFFFF',
    minHeight: '100px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#FFFFFF',
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginTop: '8px',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
  },
  button: {
    background: '#4F46E5',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
    marginRight: '12px',
  },
  buttonSecondary: {
    background: '#F3F4F6',
    color: '#374151',
    border: '1px solid #D1D5DB',
  },
  buttonDanger: {
    background: '#DC2626',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    background: '#9CA3AF',
    cursor: 'not-allowed',
  },
  previewCard: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
  },
  previewTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
  },
  previewContent: {
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: '1.5',
  },
  templateSelector: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  templateButton: {
    background: '#F3F4F6',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
  },
  templateButtonActive: {
    background: '#4F46E5',
    color: '#FFFFFF',
    border: '1px solid #4F46E5',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  errorMessage: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    color: '#DC2626',
    fontSize: '14px',
  },
  successMessage: {
    background: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    color: '#059669',
    fontSize: '14px',
  },
  // 联系人选择对话框样式
  dialogOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialogContent: {
    background: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  dialogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid #E5E7EB',
  },
  dialogTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  dialogCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6B7280',
    padding: '4px',
  },
  contactList: {
    maxHeight: '400px',
    overflow: 'auto',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #F3F4F6',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  contactItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  contactItemHover: {
    backgroundColor: '#F9FAFB',
  },
  contactCheckbox: {
    marginRight: '12px',
    width: '16px',
    height: '16px',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
    marginBottom: '2px',
  },
  contactPhone: {
    fontSize: '12px',
    color: '#6B7280',
  },
  dialogActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  loadingText: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6B7280',
    fontSize: '14px',
  },
};

export default function BatchSendPage() {
  const { currentAccountId } = useAccount();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customContent, setCustomContent] = useState<string>('');
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [contactFilters, setContactFilters] = useState({
    tags: [] as string[],
    source: '',
    createdAfter: '',
  });
  const [scheduleAt, setScheduleAt] = useState<string>('');
  const [ratePerMinute, setRatePerMinute] = useState<number>(8);
  const [jitterMs, setJitterMs] = useState<number>(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // 联系人选择对话框状态
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  // 批量发送状态检查
  const [currentBatchId, setCurrentBatchId] = useState<string>('');
  const [batchStatus, setBatchStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [autoRefreshStatus, setAutoRefreshStatus] = useState(false);
  const [statusRefreshInterval, setStatusRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const templateList = await api.templates.list({ isActive: true });
      setTemplates(templateList);
    } catch (error) {
      console.error('加载模板失败:', error);
      setError('加载模板失败，请重试');
    }
  };

  const loadContacts = async () => {
    if (!currentAccountId) {
      console.warn('未选择账号，无法加载联系人');
      setError('请先选择一个账号');
      return;
    }
    
    setContactsLoading(true);
    try {
      // 🔄 使用 threads API 获取联系人（contacts API已废弃）
      const threadsData = await api.getThreads();
      const contactsList = (threadsData.threads || [])
        .map((t: any) => t.contact)
        .filter((c: any) => c && c.phoneE164);
      setContacts(contactsList);
    } catch (error) {
      console.error('加载联系人失败:', error);
      setError('加载联系人失败，请重试');
      setContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleOpenContactDialog = async () => {
    setSelectedContactIds(contactIds); // 初始化已选择的联系人
    await loadContacts();
    setShowContactDialog(true);
  };

  const handleContactSelect = (contactId: string) => {
    setSelectedContactIds(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleContactDialogConfirm = () => {
    setContactIds(selectedContactIds);
    setShowContactDialog(false);
  };

  const handleContactDialogCancel = () => {
    setSelectedContactIds(contactIds); // 恢复原选择
    setShowContactDialog(false);
  };

  const checkBatchStatus = async (batchId: string) => {
    setStatusLoading(true);
    try {
      const status = await api.batch.getStatus(batchId);
      setBatchStatus(status);
      return status;
    } catch (error) {
      console.error('检查批量发送状态失败:', error);
      setError('检查批量发送状态失败');
      return null;
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!currentBatchId.trim()) {
      setError('请输入批量发送任务ID');
      return;
    }
    await checkBatchStatus(currentBatchId);
  };

  const startAutoRefreshStatus = () => {
    if (statusRefreshInterval) {
      clearInterval(statusRefreshInterval);
    }
    
    const interval = setInterval(async () => {
      if (currentBatchId && !statusLoading) {
        await checkBatchStatus(currentBatchId);
      }
    }, 3000); // 每3秒刷新一次
    
    setStatusRefreshInterval(interval);
    setAutoRefreshStatus(true);
  };

  const stopAutoRefreshStatus = () => {
    if (statusRefreshInterval) {
      clearInterval(statusRefreshInterval);
      setStatusRefreshInterval(null);
    }
    setAutoRefreshStatus(false);
  };

  const toggleAutoRefreshStatus = () => {
    if (autoRefreshStatus) {
      stopAutoRefreshStatus();
    } else {
      startAutoRefreshStatus();
    }
  };

  const handleCancelBatch = async () => {
    if (!currentBatchId.trim()) {
      setError('请输入批量发送任务ID');
      return;
    }

    if (!batchStatus || (batchStatus.status !== 'running' && batchStatus.status !== 'pending' && batchStatus.status !== 'processing')) {
      setError('只有运行中、待处理或处理中的批量操作才能取消');
      return;
    }

    if (!confirm('确定要取消这个批量发送任务吗？')) {
      return;
    }

    setCancelling(true);
    try {
      await api.batch.cancel(currentBatchId);
      setSuccess('批量发送任务已取消');
      
      // 重新检查状态以获取最新信息
      await checkBatchStatus(currentBatchId);
      
      // 停止自动刷新
      stopAutoRefreshStatus();
    } catch (error) {
      console.error('取消批量发送失败:', error);
      setError('取消批量发送失败，请重试');
    } finally {
      setCancelling(false);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (statusRefreshInterval) {
        clearInterval(statusRefreshInterval);
      }
    };
  }, [statusRefreshInterval]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate && !customContent.trim()) {
      setError('请选择模板或输入消息内容');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const config: BatchSendConfig = {
        templateId: selectedTemplate || undefined,
        content: customContent || undefined,
        contactIds: contactIds.length > 0 ? contactIds : undefined,
        contactFilters: Object.values(contactFilters).some(v => v) ? contactFilters : undefined,
        scheduleAt: scheduleAt || undefined,
        ratePerMinute,
        jitterMs,
      };

      const result = await api.batch.sendMessages(config);
      
      setCurrentBatchId(result.id);
      setSuccess(`批量发送任务已创建！任务ID: ${result.id}`);
      
      // 重置表单
      setSelectedTemplate('');
      setCustomContent('');
      setContactIds([]);
      setContactFilters({ tags: [], source: '', createdAfter: '' });
      setScheduleAt('');
      
    } catch (error) {
      console.error('批量发送失败:', error);
      setError('批量发送失败，请检查配置后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (selectedTemplate === templateId) {
      setSelectedTemplate('');
    } else {
      setSelectedTemplate(templateId);
      setCustomContent(''); // 清空自定义内容
    }
  };

  const handleCustomContentChange = (content: string) => {
    setCustomContent(content);
    if (content.trim()) {
      setSelectedTemplate(''); // 清空模板选择
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
  const messageContent = selectedTemplateData ? selectedTemplateData.content : customContent;

  return (
    <div style={S.container}>
      <div style={S.header}>
        <div>
          <button 
            style={S.backButton}
            onClick={() => window.history.back()}
          >
            ← 返回批量操作
          </button>
          <h1 style={S.title}>批量发送消息</h1>
        </div>
      </div>

      {error && (
        <div style={S.errorMessage}>
          {error}
        </div>
      )}

      {success && (
        <div style={S.successMessage}>
          {success}
        </div>
      )}

      <form style={S.form} onSubmit={handleSubmit}>
        {/* 消息内容选择 */}
        <div style={S.formGroup}>
          <label style={S.label}>消息内容</label>
          
          {/* 模板选择 */}
          <div style={S.templateSelector}>
            <span style={{ fontSize: '14px', color: '#6B7280', marginRight: '12px' }}>选择模板:</span>
            {templates.map(template => (
              <button
                key={template.id}
                type="button"
                style={{
                  ...S.templateButton,
                  ...(selectedTemplate === template.id ? S.templateButtonActive : {}),
                }}
                onClick={() => handleTemplateSelect(template.id)}
              >
                {template.name}
              </button>
            ))}
          </div>

          {/* 自定义内容 */}
          <div style={{ marginTop: '16px' }}>
            <label style={S.label}>或输入自定义内容:</label>
            <textarea
              style={S.textarea}
              placeholder="输入要发送的消息内容..."
              value={customContent}
              onChange={(e) => handleCustomContentChange(e.target.value)}
              disabled={!!selectedTemplate}
            />
          </div>

          {/* 消息预览 */}
          {messageContent && (
            <div style={S.previewCard}>
              <div style={S.previewTitle}>消息预览:</div>
              <div style={S.previewContent}>{messageContent}</div>
            </div>
          )}
        </div>

        {/* 接收人选择 */}
        <div style={S.formGroup}>
          <label style={S.label}>接收人</label>
          <div style={S.checkboxGroup}>
            <div style={S.checkboxItem}>
              <input
                type="checkbox"
                id="allContacts"
                style={S.checkbox}
                checked={contactIds.length === 0 && !contactFilters.tags.length && !contactFilters.source && !contactFilters.createdAfter}
                onChange={() => {
                  setContactIds([]);
                  setContactFilters({ tags: [], source: '', createdAfter: '' });
                }}
              />
              <label htmlFor="allContacts" style={S.checkboxLabel}>
                所有联系人
              </label>
            </div>
            
            <div style={S.checkboxItem}>
              <input
                type="checkbox"
                id="specificContacts"
                style={S.checkbox}
                checked={contactIds.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleOpenContactDialog();
                  } else {
                    setContactIds([]);
                  }
                }}
              />
              <label htmlFor="specificContacts" style={S.checkboxLabel}>
                指定联系人 (当前选择: {contactIds.length} 个)
              </label>
            </div>

            <div style={S.checkboxItem}>
              <input
                type="checkbox"
                id="filteredContacts"
                style={S.checkbox}
                checked={Boolean(contactFilters.tags.length > 0 || contactFilters.source || contactFilters.createdAfter)}
                onChange={(e) => {
                  if (!e.target.checked) {
                    setContactFilters({ tags: [], source: '', createdAfter: '' });
                  }
                }}
              />
              <label htmlFor="filteredContacts" style={S.checkboxLabel}>
                按条件筛选联系人
              </label>
            </div>
          </div>

          {/* 筛选条件 */}
          {(contactFilters.tags.length > 0 || contactFilters.source || contactFilters.createdAfter) && (
            <div style={{ marginTop: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '8px' }}>
              <div style={S.formGroup}>
                <label style={S.label}>标签筛选 (多个标签用逗号分隔)</label>
                <input
                  type="text"
                  style={S.input}
                  placeholder="例如: VIP, 活跃用户"
                  value={contactFilters.tags.join(', ')}
                  onChange={(e) => setContactFilters(prev => ({
                    ...prev,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  }))}
                />
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>来源筛选</label>
                <input
                  type="text"
                  style={S.input}
                  placeholder="例如: 手动添加, 批量导入"
                  value={contactFilters.source}
                  onChange={(e) => setContactFilters(prev => ({
                    ...prev,
                    source: e.target.value
                  }))}
                />
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>创建时间 (在此日期之后)</label>
                <input
                  type="date"
                  style={S.input}
                  value={contactFilters.createdAfter}
                  onChange={(e) => setContactFilters(prev => ({
                    ...prev,
                    createdAfter: e.target.value
                  }))}
                />
              </div>
            </div>
          )}
        </div>

        {/* 发送设置 */}
        <div style={S.formGroup}>
          <label style={S.label}>发送设置</label>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={S.label}>计划发送时间 (可选)</label>
            <input
              type="datetime-local"
              style={S.input}
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
            />
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
              留空表示立即发送
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>发送速率 (条/分钟)</label>
              <input
                type="number"
                style={S.input}
                min="1"
                max="60"
                value={ratePerMinute}
                onChange={(e) => setRatePerMinute(Number(e.target.value))}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={S.label}>随机延迟 (毫秒)</label>
              <input
                type="number"
                style={S.input}
                min="0"
                max="5000"
                value={jitterMs}
                onChange={(e) => setJitterMs(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            type="submit"
            style={{
              ...S.button,
              ...(loading ? S.buttonDisabled : {}),
            }}
            disabled={loading}
          >
            {loading ? '发送中...' : '开始批量发送'}
          </button>
          
          <button
            type="button"
            style={S.buttonSecondary}
            onClick={() => window.history.back()}
          >
            取消
          </button>
        </div>
      </form>

      {/* 批量发送状态检查 */}
      {currentBatchId && (
        <div style={S.form}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>📊 批量发送状态</h3>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              style={{ ...S.input, flex: 1 }}
              placeholder="批量发送任务ID"
              value={currentBatchId}
              onChange={(e) => setCurrentBatchId(e.target.value)}
            />
            <button
              type="button"
              style={S.button}
              onClick={handleCheckStatus}
              disabled={statusLoading}
            >
              {statusLoading ? '检查中...' : '检查状态'}
            </button>
            <button
              type="button"
              style={{
                ...S.button,
                ...(autoRefreshStatus ? S.buttonSecondary : {}),
              }}
              onClick={toggleAutoRefreshStatus}
            >
              {autoRefreshStatus ? '⏸️ 停止自动刷新' : '▶️ 自动刷新'}
            </button>
            {batchStatus && (batchStatus.status === 'running' || batchStatus.status === 'pending' || batchStatus.status === 'processing') && (
              <button
                type="button"
                style={{
                  ...S.button,
                  ...S.buttonDanger,
                  ...(cancelling ? S.buttonDisabled : {}),
                }}
                onClick={handleCancelBatch}
                disabled={cancelling}
              >
                {cancelling ? '取消中...' : '🛑 停止发送'}
              </button>
            )}
          </div>

          {batchStatus && (
            <div style={S.previewCard}>
              <div style={S.previewTitle}>任务状态详情</div>
              <div style={S.previewContent}>
                <div><strong>状态:</strong> 
                  <span style={{ 
                    color: batchStatus.status === 'running' ? '#059669' : 
                           batchStatus.status === 'processing' ? '#059669' :
                           batchStatus.status === 'completed' ? '#059669' : 
                           batchStatus.status === 'cancelled' ? '#DC2626' : 
                           batchStatus.status === 'failed' ? '#DC2626' : '#6B7280',
                    fontWeight: 600
                  }}>
                    {batchStatus.status === 'running' ? '🔄 运行中' :
                     batchStatus.status === 'processing' ? '🔄 处理中' :
                     batchStatus.status === 'completed' ? '✅ 已完成' :
                     batchStatus.status === 'cancelled' ? '❌ 已取消' :
                     batchStatus.status === 'failed' ? '❌ 失败' :
                     batchStatus.status === 'pending' ? '⏳ 等待中' : batchStatus.status}
                  </span>
                </div>
                <div><strong>进度:</strong> {batchStatus.progress || 0}%</div>
                <div><strong>总数:</strong> {batchStatus.totalCount || 0}</div>
                <div><strong>已处理:</strong> {batchStatus.processedCount || 0}</div>
                <div><strong>成功:</strong> {batchStatus.successCount || 0}</div>
                <div><strong>失败:</strong> {batchStatus.failedCount || 0}</div>
                {batchStatus.errorMessage && (
                  <div style={{ color: '#DC2626', marginTop: '8px' }}>
                    <strong>错误信息:</strong> {batchStatus.errorMessage}
                  </div>
                )}
                {batchStatus.status === 'cancelled' && (
                  <div style={{ color: '#DC2626', marginTop: '8px', fontWeight: 600 }}>
                    ⚠️ 任务已被用户取消
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 联系人选择对话框 */}
      {showContactDialog && (
        <div style={S.dialogOverlay} onClick={handleContactDialogCancel}>
          <div style={S.dialogContent} onClick={(e) => e.stopPropagation()}>
            <div style={S.dialogHeader}>
              <h3 style={S.dialogTitle}>选择联系人</h3>
              <button 
                style={S.dialogCloseButton}
                onClick={handleContactDialogCancel}
              >
                ×
              </button>
            </div>
            
            {contactsLoading ? (
              <div style={S.loadingText}>加载联系人中...</div>
            ) : (
              <>
                <div style={S.contactList}>
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      style={{
                        ...S.contactItem,
                        ...(selectedContactIds.includes(contact.id) ? S.contactItemSelected : {}),
                      }}
                      onClick={() => handleContactSelect(contact.id)}
                    >
                      <input
                        type="checkbox"
                        style={S.contactCheckbox}
                        checked={selectedContactIds.includes(contact.id)}
                        onChange={() => handleContactSelect(contact.id)}
                      />
                      <div style={S.contactInfo}>
                        <div style={S.contactName}>
                          {contact.name || contact.phoneE164 || '未知联系人'}
                        </div>
                        <div style={S.contactPhone}>
                          {contact.phoneE164}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={S.dialogActions}>
                  <button
                    type="button"
                    style={S.buttonSecondary}
                    onClick={handleContactDialogCancel}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    style={S.button}
                    onClick={handleContactDialogConfirm}
                  >
                    确定 ({selectedContactIds.length} 个联系人)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
