'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';

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
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
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
    marginBottom: '12px',
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
  buttonSuccess: {
    background: '#059669',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    background: '#9CA3AF',
    cursor: 'not-allowed',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    minHeight: '100px',
    marginBottom: '16px',
    resize: 'vertical' as const,
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
  },
  result: {
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '16px',
    fontSize: '14px',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap' as const,
    maxHeight: '400px',
    overflow: 'auto',
  },
  error: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    color: '#DC2626',
    fontSize: '14px',
  },
  success: {
    background: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    color: '#059669',
    fontSize: '14px',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  statusOnline: {
    backgroundColor: '#10B981',
  },
  statusOffline: {
    backgroundColor: '#EF4444',
  },
  contactItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    marginBottom: '8px',
    background: '#FFFFFF',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
  },
  contactPhone: {
    fontSize: '12px',
    color: '#6B7280',
  },
  checkbox: {
    marginRight: '8px',
  },
};

export default function DebugBatchSendPage() {
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [messageContent, setMessageContent] = useState('测试消息 - 调试批量发送');
  const [ratePerMinute, setRatePerMinute] = useState(8);
  const [jitterMs, setJitterMs] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [currentBatchId, setCurrentBatchId] = useState<string>('');
  const [batchStatus, setBatchStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    loadWhatsappStatus();
    loadContacts();
  }, []);

  const loadWhatsappStatus = async () => {
    try {
      const status = await api.getStatus();
      setWhatsappStatus(status);
    } catch (error) {
      console.error('加载WhatsApp状态失败:', error);
      setError('加载WhatsApp状态失败');
    }
  };

  const loadContacts = async () => {
    try {
      const response = await api.getContacts();
      setContacts(response.contacts || []);
    } catch (error) {
      console.error('加载联系人失败:', error);
      setError('加载联系人失败');
    }
  };

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const testSingleSend = async () => {
    if (selectedContacts.length === 0) {
      setError('请选择至少一个联系人');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResult('');

    try {
      const contactId = selectedContacts[0];
      const response = await api.sendOutreach(contactId, { content: messageContent });
      
      setSuccess(`单个发送成功！消息ID: ${response.message.id}`);
      setResult(JSON.stringify(response, null, 2));
    } catch (error: any) {
      setError(`单个发送失败: ${error.message}`);
      setResult(JSON.stringify({ error: error.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const testBatchSend = async () => {
    if (selectedContacts.length === 0) {
      setError('请选择至少一个联系人');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResult('');

    try {
      const config = {
        content: messageContent,
        contactIds: selectedContacts,
        ratePerMinute,
        jitterMs,
      };

      const response = await api.batch.sendMessages(config);
      
      setCurrentBatchId(response.id);
      setSuccess(`批量发送任务创建成功！任务ID: ${response.id}`);
      setResult(JSON.stringify(response, null, 2));

      // 等待几秒后自动检查状态
      setTimeout(() => {
        checkBatchStatus(response.id);
      }, 3000);

    } catch (error: any) {
      setError(`批量发送创建失败: ${error.message}`);
      setResult(JSON.stringify({ error: error.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const checkBatchStatus = async (batchId?: string) => {
    const id = batchId || currentBatchId;
    if (!id) {
      setError('请输入批量任务ID');
      return;
    }

    setStatusLoading(true);
    try {
      const status = await api.batch.getStatus(id);
      setBatchStatus(status);
      setResult(JSON.stringify(status, null, 2));
    } catch (error: any) {
      setError(`检查批量状态失败: ${error.message}`);
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY': return S.statusOnline;
      case 'ONLINE': return S.statusOnline;
      case 'OFFLINE': return S.statusOffline;
      case 'FAILED': return S.statusOffline;
      default: return S.statusOffline;
    }
  };

  return (
    <div style={S.container}>
      <div style={S.header}>
        <h1 style={S.title}>🔍 批量发送调试工具</h1>
      </div>

      {/* WhatsApp状态 */}
      <div style={S.card}>
        <h3 style={{ marginBottom: '16px' }}>📱 WhatsApp服务状态</h3>
        {whatsappStatus ? (
          <div style={S.status}>
            <div style={{ ...S.statusDot, ...getStatusColor(whatsappStatus.status) }}></div>
            <span><strong>状态:</strong> {whatsappStatus.status}</span>
            <span><strong>手机号:</strong> {whatsappStatus.phoneE164}</span>
            <span><strong>在线:</strong> {whatsappStatus.online ? '是' : '否'}</span>
            <span><strong>联系人数量:</strong> {whatsappStatus.contactCount}</span>
          </div>
        ) : (
          <div>加载中...</div>
        )}
        <button
          style={S.button}
          onClick={loadWhatsappStatus}
        >
          🔄 刷新状态
        </button>
      </div>

      {/* 联系人选择 */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>📞 选择联系人 ({selectedContacts.length} 个已选择)</h3>
          <button
            style={{ ...S.button, ...S.buttonSecondary }}
            onClick={handleSelectAll}
          >
            {selectedContacts.length === contacts.length ? '取消全选' : '全选'}
          </button>
        </div>
        
        <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
          {contacts.map(contact => (
            <div key={contact.id} style={S.contactItem}>
              <input
                type="checkbox"
                style={S.checkbox}
                checked={selectedContacts.includes(contact.id)}
                onChange={() => handleContactToggle(contact.id)}
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
      </div>

      {/* 发送配置 */}
      <div style={S.card}>
        <h3 style={{ marginBottom: '16px' }}>⚙️ 发送配置</h3>
        
        <label style={S.label}>消息内容:</label>
        <textarea
          style={S.textarea}
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="输入要发送的消息内容"
        />

        <label style={S.label}>发送速率 (每分钟):</label>
        <select
          style={S.select}
          value={ratePerMinute}
          onChange={(e) => setRatePerMinute(Number(e.target.value))}
        >
          <option value={1}>1条/分钟 (最慢)</option>
          <option value={5}>5条/分钟</option>
          <option value={8}>8条/分钟 (推荐)</option>
          <option value={15}>15条/分钟</option>
          <option value={30}>30条/分钟</option>
          <option value={60}>60条/分钟 (测试用)</option>
        </select>

        <label style={S.label}>随机延迟 (毫秒):</label>
        <select
          style={S.select}
          value={jitterMs}
          onChange={(e) => setJitterMs(Number(e.target.value))}
        >
          <option value={0}>无延迟</option>
          <option value={100}>100ms</option>
          <option value={300}>300ms (推荐)</option>
          <option value={500}>500ms</option>
          <option value={1000}>1000ms</option>
        </select>
      </div>

      {/* 测试按钮 */}
      <div style={S.card}>
        <h3 style={{ marginBottom: '16px' }}>🧪 测试功能</h3>
        
        <button
          style={{
            ...S.button,
            ...(loading ? S.buttonDisabled : {}),
          }}
          onClick={testSingleSend}
          disabled={loading || selectedContacts.length === 0}
        >
          📤 测试单个发送
        </button>

        <button
          style={{
            ...S.button,
            ...S.buttonSuccess,
            ...(loading ? S.buttonDisabled : {}),
          }}
          onClick={testBatchSend}
          disabled={loading || selectedContacts.length === 0}
        >
          📦 测试批量发送
        </button>

        <button
          style={{
            ...S.button,
            ...S.buttonSecondary,
          }}
          onClick={() => checkBatchStatus()}
          disabled={statusLoading || !currentBatchId}
        >
          {statusLoading ? '检查中...' : '📊 检查批量状态'}
        </button>

        <button
          style={{
            ...S.button,
            ...S.buttonDanger,
          }}
          onClick={() => {
            setError('');
            setSuccess('');
            setResult('');
            setBatchStatus(null);
            setCurrentBatchId('');
          }}
        >
          🗑️ 清除结果
        </button>
      </div>

      {/* 错误和成功消息 */}
      {error && <div style={S.error}>{error}</div>}
      {success && <div style={S.success}>{success}</div>}

      {/* 批量状态 */}
      {batchStatus && (
        <div style={S.card}>
          <h3 style={{ marginBottom: '16px' }}>📊 批量发送状态</h3>
          <div style={S.result}>
            <div><strong>任务ID:</strong> {batchStatus.id}</div>
            <div><strong>状态:</strong> {batchStatus.status}</div>
            <div><strong>进度:</strong> {batchStatus.progress}%</div>
            <div><strong>总数:</strong> {batchStatus.totalCount}</div>
            <div><strong>已处理:</strong> {batchStatus.processedCount}</div>
            <div><strong>成功:</strong> {batchStatus.successCount}</div>
            <div><strong>失败:</strong> {batchStatus.failedCount}</div>
            {batchStatus.errorMessage && (
              <div style={{ color: '#DC2626' }}>
                <strong>错误信息:</strong> {batchStatus.errorMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 结果显示 */}
      {result && (
        <div style={S.card}>
          <h3 style={{ marginBottom: '16px' }}>📋 详细结果</h3>
          <div style={S.result}>{result}</div>
        </div>
      )}
    </div>
  );
}
