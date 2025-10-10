'use client';

import { useState, useEffect, useRef } from 'react';
import WhatsAppLayout, { WhatsAppColors } from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import ContactSelector from '@/components/ContactSelector';
import TemplateSelector from '@/components/TemplateSelector';
import BatchProgress from '@/components/BatchProgress';
import CSVUploader from '@/components/CSVUploader';
import { api } from '@/lib/api';
import { useWebSocket } from '@/lib/useWebSocket';

type TabType = 'send' | 'import' | 'tags' | 'delete' | 'history' | 'stats';

const styles = {
  fullPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: WhatsAppColors.background,
  },
  header: {
    padding: '24px 32px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    backgroundColor: WhatsAppColors.panelBackground,
  },
  title: {
    fontSize: '28px',
    fontWeight: '700' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '6px',
  },
  subtitle: {
    fontSize: '14px',
    color: WhatsAppColors.textSecondary,
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    padding: '0 32px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    backgroundColor: WhatsAppColors.panelBackground,
  },
  tab: {
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
    color: WhatsAppColors.textSecondary,
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    transition: 'color 0.2s, border-color 0.2s',
  },
  tabActive: {
    color: WhatsAppColors.accent,
    borderBottomColor: WhatsAppColors.accent,
  },
  body: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '24px 32px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '12px',
  },
  card: {
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${WhatsAppColors.border}`,
  },
  label: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '8px',
    fontWeight: '600' as const,
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    marginBottom: '16px',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '12px',
    backgroundColor: WhatsAppColors.inputBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    marginBottom: '16px',
    resize: 'vertical' as const,
    minHeight: '120px',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    marginBottom: '16px',
    cursor: 'pointer',
  },
  buttonPrimary: {
    padding: '12px 32px',
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonSecondary: {
    padding: '12px 32px',
    backgroundColor: WhatsAppColors.inputBackground,
    color: WhatsAppColors.textPrimary,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 168, 132, 0.1)',
    border: `1px solid ${WhatsAppColors.accent}`,
    borderRadius: '8px',
    padding: '14px 16px',
    marginBottom: '20px',
    fontSize: '13px',
    color: WhatsAppColors.textPrimary,
    lineHeight: '1.6',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: WhatsAppColors.panelBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '12px',
    padding: '20px',
  },
  statLabel: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700' as const,
    color: WhatsAppColors.textPrimary,
  },
  historyItem: {
    backgroundColor: WhatsAppColors.panelBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600' as const,
  },
  badgePending: {
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
    color: '#f39c12',
  },
  badgeProcessing: {
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
    color: '#3498db',
  },
  badgeCompleted: {
    backgroundColor: 'rgba(0, 168, 132, 0.15)',
    color: WhatsAppColors.accent,
  },
  badgeFailed: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    color: WhatsAppColors.error,
  },
  badgeCancelled: {
    backgroundColor: 'rgba(149, 165, 166, 0.15)',
    color: '#95a5a6',
  },
};

export default function BatchPage() {
  const [activeTab, setActiveTab] = useState<TabType>('send');
  
  // 批量发送状态
  const [sendMethod, setSendMethod] = useState<'manual' | 'contacts' | 'template'>('manual');
  const [phoneList, setPhoneList] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [ratePerMinute, setRatePerMinute] = useState(10);
  const [jitterMs, setJitterMs] = useState(2000);
  const [enableSchedule, setEnableSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  // 批量导入状态
  const [csvData, setCsvData] = useState<any>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [defaultTags, setDefaultTags] = useState('');
  const [importSource, setImportSource] = useState('');
  
  // 标签管理状态
  const [tagOperation, setTagOperation] = useState<'add' | 'remove' | 'replace'>('add');
  const [tagSelectedContacts, setTagSelectedContacts] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // 批量删除状态
  const [deleteSelectedContacts, setDeleteSelectedContacts] = useState<string[]>([]);
  
  // 操作状态
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 历史记录
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyFilter, setHistoryFilter] = useState<{ type?: string; status?: string }>({});
  
  // 统计数据
  const [stats, setStats] = useState<any>(null);

  // WebSocket 实时更新
  useWebSocket({
    onMessage: (message) => {
      console.log('[批量操作] 收到 WebSocket 消息:', message);
      
      // 监听批量操作状态更新
      if (message.type === 'batch_update' && message.data) {
        const updatedBatch = message.data;
        console.log('[批量操作] 批量操作状态更新:', updatedBatch);
        
        // 如果是当前操作，更新状态
        if (currentBatchId && updatedBatch.id === currentBatchId) {
          setBatchStatus(updatedBatch);
          
          // 如果操作完成，停止处理状态（支持大小写不敏感）
          const statusUpper = (updatedBatch.status || '').toUpperCase();
          if (statusUpper === 'COMPLETED' || 
              statusUpper === 'FAILED' || 
              statusUpper === 'CANCELLED') {
            console.log('[批量操作] 操作已结束，停止处理状态:', statusUpper);
            setIsProcessing(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }
        
        // 如果在历史页面，刷新列表
        if (activeTab === 'history') {
          loadHistory();
        }
        
        // 如果在统计页面，刷新统计
        if (activeTab === 'stats') {
          loadStats();
        }
      }
    },
    onConnect: () => {
      console.log('[批量操作] WebSocket 已连接');
    },
    onDisconnect: () => {
      console.log('[批量操作] WebSocket 已断开');
    },
  });

  // 加载历史记录
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, historyFilter]);

  // 加载统计数据
  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab]);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.batch.list(historyFilter);
      setHistoryList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.batch.getStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  // 启动fallback轮询（仅在 WebSocket 不可用时使用）
  const startFallbackPolling = (batchId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // 仅作为 fallback，轮询间隔较长（5秒）
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const status = await api.batch.getStatus(batchId);
        setBatchStatus(status);
        
        // 支持大小写不敏感的状态检查
        const statusUpper = (status.status || '').toUpperCase();
        if (statusUpper === 'COMPLETED' || statusUpper === 'FAILED' || statusUpper === 'CANCELLED') {
          console.log('[批量操作] Fallback 轮询: 操作已结束:', statusUpper);
          setIsProcessing(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('[批量操作] Fallback 轮询失败:', error);
      }
    }, 5000); // WebSocket 作为主要方式，轮询间隔可以更长
  };

  const handleBatchSend = async () => {
    if (sendMethod === 'manual' && !phoneList.trim()) {
      alert('请输入手机号列表');
      return;
    }
    if (sendMethod === 'contacts' && selectedContacts.length === 0) {
      alert('请选择联系人');
      return;
    }
    if (!messageContent.trim() && !selectedTemplate) {
      alert('请输入消息内容或选择模版');
      return;
    }

    // 验证定时发送
    if (enableSchedule) {
      if (!scheduleDate || !scheduleTime) {
        alert('请选择定时发送的日期和时间');
        return;
      }
      const scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      if (scheduleDateTime <= new Date()) {
        alert('定时发送时间必须晚于当前时间');
        return;
      }
    }

    try {
      setIsProcessing(true);

      const config: any = {
        content: selectedTemplate ? selectedTemplate.content : messageContent,
        ratePerMinute,
        jitterMs,
      };

      // 添加定时发送配置
      if (enableSchedule && scheduleDate && scheduleTime) {
        config.scheduleAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }

      if (sendMethod === 'manual') {
        // 手动输入的号码列表
        const phones = phoneList.split('\n').filter(p => p.trim());
        config.contactFilters = { /* 暂时不支持直接传手机号 */ };
      } else if (sendMethod === 'contacts') {
        config.contactIds = selectedContacts;
      }

      if (selectedTemplate) {
        config.templateId = selectedTemplate.id;
      }

      const batch = await api.batch.sendMessages(config);
      setCurrentBatchId(batch.id);
      setBatchStatus(batch);
      
      if (!enableSchedule) {
        // 立即发送：启动 fallback 轮询（WebSocket 作为主要方式）
        startFallbackPolling(batch.id);
        alert('批量发送已开始！（实时更新通过 WebSocket）');
      } else {
        // 定时发送：不需要轮询，等到计划时间
        alert(`批量发送已计划！将在 ${scheduleDate} ${scheduleTime} 开始执行`);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('启动批量发送失败:', error);
      alert('启动失败：' + (error instanceof Error ? error.message : '未知错误'));
      setIsProcessing(false);
    }
  };

  const handleBatchImport = async () => {
    if (!csvData || csvData.rows.length === 0) {
      alert('请上传 CSV 文件');
      return;
    }

    try {
      setIsProcessing(true);

      const contacts = csvData.rows.map((row: string[]) => {
        const phoneIndex = csvData.headers.indexOf('phone');
        const nameIndex = csvData.headers.indexOf('name');
        const tagsIndex = csvData.headers.indexOf('tags');
        const notesIndex = csvData.headers.indexOf('notes');

        return {
          phoneE164: row[phoneIndex],
          name: nameIndex >= 0 ? row[nameIndex] : undefined,
          tags: tagsIndex >= 0 && row[tagsIndex] ? row[tagsIndex].split(',').map((t: string) => t.trim()) : [],
          notes: notesIndex >= 0 ? row[notesIndex] : undefined,
        };
      });

      const config = {
        contacts,
        skipDuplicates,
        tags: defaultTags ? defaultTags.split(',').map(t => t.trim()) : undefined,
        source: importSource || undefined,
      };

      const batch = await api.batch.importContacts(config);
      setCurrentBatchId(batch.id);
      setBatchStatus(batch);
      startFallbackPolling(batch.id);

      alert('批量导入已开始！（实时更新通过 WebSocket）');
    } catch (error) {
      console.error('启动批量导入失败:', error);
      alert('导入失败：' + (error instanceof Error ? error.message : '未知错误'));
      setIsProcessing(false);
    }
  };

  const handleBatchTags = async () => {
    if (tagSelectedContacts.length === 0) {
      alert('请选择联系人');
      return;
    }
    if (!tagInput.trim()) {
      alert('请输入标签');
      return;
    }

    try {
      setIsProcessing(true);

      const config = {
        contactIds: tagSelectedContacts,
        tags: tagInput.split(',').map(t => t.trim()),
        operation: tagOperation,
      };

      const batch = await api.batch.manageTags(config);
      setCurrentBatchId(batch.id);
      setBatchStatus(batch);
      startFallbackPolling(batch.id);

      alert('批量标签操作已开始！（实时更新通过 WebSocket）');
    } catch (error) {
      console.error('启动批量标签操作失败:', error);
      alert('操作失败：' + (error instanceof Error ? error.message : '未知错误'));
      setIsProcessing(false);
    }
  };

  const handleBatchDelete = async () => {
    if (deleteSelectedContacts.length === 0) {
      alert('请选择要删除的联系人');
      return;
    }

    if (!confirm(`确定要删除 ${deleteSelectedContacts.length} 个联系人吗？此操作不可恢复！`)) {
      return;
    }

    try {
      setIsProcessing(true);

      const batch = await api.batch.deleteContacts(deleteSelectedContacts);
      setCurrentBatchId(batch.id);
      setBatchStatus(batch);
      startFallbackPolling(batch.id);

      alert('批量删除已开始！（实时更新通过 WebSocket）');
    } catch (error) {
      console.error('启动批量删除失败:', error);
      alert('删除失败：' + (error instanceof Error ? error.message : '未知错误'));
      setIsProcessing(false);
    }
  };

  const handleCancelBatch = async () => {
    if (!currentBatchId) {
      alert('没有正在进行的操作');
      return;
    }

    if (!confirm('确定要停止当前操作吗？')) {
      return;
    }

    try {
      console.log('[批量操作] 正在取消操作:', currentBatchId);
      const result = await api.batch.cancel(currentBatchId);
      console.log('[批量操作] 取消成功:', result);
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsProcessing(false);
      setBatchStatus(null);
      setCurrentBatchId(null);
      alert('✓ 操作已成功取消');
    } catch (error) {
      console.error('[批量操作] 取消失败:', error);
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      
      // 如果操作已经完成，更新前端状态
      if (errorMsg.includes('completed') || errorMsg.includes('cancelled')) {
        console.log('[批量操作] 操作已经结束，更新状态');
        setIsProcessing(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        alert('该操作已经完成或已被取消');
      } else {
        alert('取消失败：' + errorMsg);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusUpper = (status || '').toUpperCase();
    switch (statusUpper) {
      case 'PENDING':
        return <span style={{...styles.badge, ...styles.badgePending}}>等待中</span>;
      case 'PROCESSING':
        return <span style={{...styles.badge, ...styles.badgeProcessing}}>处理中</span>;
      case 'COMPLETED':
        return <span style={{...styles.badge, ...styles.badgeCompleted}}>已完成</span>;
      case 'FAILED':
        return <span style={{...styles.badge, ...styles.badgeFailed}}>失败</span>;
      case 'CANCELLED':
        return <span style={{...styles.badge, ...styles.badgeCancelled}}>已取消</span>;
      default:
        return <span style={styles.badge}>{status}</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    const typeUpper = (type || '').toUpperCase();
    switch (typeUpper) {
      case 'SEND': return '📤';
      case 'IMPORT': return '📥';
      case 'TAG': return '🏷️';
      case 'DELETE': return '🗑️';
      default: return '📋';
    }
  };

  // 渲染批量发送标签页
  const renderSendTab = () => (
    <div>
      <div style={styles.infoBox}>
        💡 <strong>提示：</strong>批量发送支持手动输入号码、从联系人选择或使用消息模版，建议每次不超过100个联系人。
      </div>

      <div style={styles.section}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>1. 选择联系人</div>
          
          <label style={styles.label}>选择方式</label>
          <select
            style={styles.select}
            value={sendMethod}
            onChange={(e) => setSendMethod(e.target.value as any)}
            disabled={isProcessing}
          >
            <option value="manual">手动输入号码</option>
            <option value="contacts">从联系人选择</option>
          </select>

          {sendMethod === 'manual' && (
            <>
              <label style={styles.label}>手机号列表（每行一个，国际格式）</label>
              <textarea
                style={{...styles.textarea, minHeight: '150px'}}
                value={phoneList}
                onChange={(e) => setPhoneList(e.target.value)}
                placeholder="+8613800138000&#10;+8613800138001&#10;+8613800138002"
                disabled={isProcessing}
              />
            </>
          )}

          {sendMethod === 'contacts' && (
            <>
              <label style={styles.label}>选择联系人</label>
              <ContactSelector
                selectedContacts={selectedContacts}
                onSelectionChange={setSelectedContacts}
                multiple={true}
              />
            </>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>2. 编写消息</div>
          
          <label style={styles.label}>
            消息来源
            <span style={{marginLeft: '8px', fontSize: '12px', fontWeight: 'normal', color: WhatsAppColors.textSecondary}}>
              (选择模版或直接输入文本)
            </span>
          </label>

          <div style={{marginBottom: '16px'}}>
            <button
              style={{
                ...styles.buttonSecondary,
                marginRight: '12px',
                padding: '8px 16px',
                backgroundColor: selectedTemplate ? WhatsAppColors.accent : WhatsAppColors.inputBackground,
                color: selectedTemplate ? '#fff' : WhatsAppColors.textPrimary,
              }}
              onClick={() => {
                if (selectedTemplate) {
                  setSelectedTemplate(null);
                } else {
                  setShowTemplateSelector(!showTemplateSelector);
                }
              }}
              disabled={isProcessing}
            >
              {selectedTemplate ? `✓ 使用模版: ${selectedTemplate.name}` : '📄 选择消息模版'}
            </button>
            
            {selectedTemplate && (
              <button
                style={{
                  ...styles.buttonSecondary,
                  padding: '8px 16px',
                  backgroundColor: WhatsAppColors.inputBackground,
                  color: WhatsAppColors.textSecondary,
                }}
                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                disabled={isProcessing}
              >
                {showTemplateSelector ? '收起' : '更换模版'}
              </button>
            )}
          </div>
          
          {showTemplateSelector && (
            <div style={{marginBottom: '16px'}}>
              <TemplateSelector
                onSelect={(template) => {
                  setSelectedTemplate(template);
                  setShowTemplateSelector(false);
                }}
                onClose={() => setShowTemplateSelector(false)}
              />
            </div>
          )}

          {!selectedTemplate && (
            <>
              <label style={styles.label}>消息内容</label>
              <textarea
                style={styles.textarea}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="输入要发送的消息内容..."
                disabled={isProcessing}
              />
            </>
          )}

          {selectedTemplate && (
            <div style={{
              padding: '12px',
              backgroundColor: WhatsAppColors.inputBackground,
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <strong>模版内容：</strong>
              <div style={{marginTop: '8px', whiteSpace: 'pre-wrap'}}>{selectedTemplate.content}</div>
            </div>
          )}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>3. 高级设置</div>
          
          <label style={styles.label}>
            发送速率 (每分钟)
          </label>
          <input
            type="number"
            style={styles.input}
            value={ratePerMinute}
            onChange={(e) => setRatePerMinute(parseInt(e.target.value) || 10)}
            min="1"
            max="60"
            disabled={isProcessing}
          />

          <label style={styles.label}>
            随机延迟 (毫秒)
          </label>
          <input
            type="number"
            style={styles.input}
            value={jitterMs}
            onChange={(e) => setJitterMs(parseInt(e.target.value) || 2000)}
            min="0"
            max="10000"
            disabled={isProcessing}
          />

          <div style={{marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${WhatsAppColors.border}`}}>
            <label style={{...styles.label, display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <input
                type="checkbox"
                checked={enableSchedule}
                onChange={(e) => setEnableSchedule(e.target.checked)}
                style={{marginRight: '8px'}}
                disabled={isProcessing}
              />
              <span>⏰ 定时发送</span>
            </label>

            {enableSchedule && (
              <div style={{marginTop: '12px', padding: '16px', backgroundColor: WhatsAppColors.inputBackground, borderRadius: '8px'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                  <div>
                    <label style={{...styles.label, marginBottom: '8px'}}>日期</label>
                    <input
                      type="date"
                      style={styles.input}
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <label style={{...styles.label, marginBottom: '8px'}}>时间</label>
                    <input
                      type="time"
                      style={styles.input}
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                {scheduleDate && scheduleTime && (
                  <div style={{fontSize: '13px', color: WhatsAppColors.accent, marginTop: '8px'}}>
                    ✓ 将在 {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('zh-CN')} 执行
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{display: 'flex', gap: '12px'}}>
        <button
          style={styles.buttonPrimary}
          onClick={handleBatchSend}
          disabled={isProcessing}
          onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover)}
          onMouseLeave={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = WhatsAppColors.accent)}
        >
          {isProcessing ? '处理中...' : enableSchedule ? '⏰ 计划定时发送' : '🚀 立即开始发送'}
        </button>
        
        {isProcessing && currentBatchId && (
          <button
            style={styles.buttonSecondary}
            onClick={handleCancelBatch}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WhatsAppColors.error}
          >
            ⏹️ 停止发送
          </button>
        )}
      </div>

      {batchStatus && (
        <div style={{marginTop: '24px'}}>
          <BatchProgress
            batchId={batchStatus.id}
            status={batchStatus.status}
            progress={batchStatus.progress || 0}
            totalCount={batchStatus.totalCount || 0}
            processedCount={batchStatus.processedCount || 0}
            successCount={batchStatus.successCount || 0}
            failedCount={batchStatus.failedCount || 0}
            onCancel={isProcessing ? handleCancelBatch : undefined}
          />
        </div>
      )}
    </div>
  );

  // 渲染批量导入标签页
  const renderImportTab = () => (
    <div>
      <div style={styles.infoBox}>
        💡 <strong>提示：</strong>上传 CSV 文件批量导入联系人，支持的列：phone (必需), name, tags, notes
      </div>

      <div style={styles.section}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>1. 上传 CSV 文件</div>
          <CSVUploader
            onDataParsed={setCsvData}
            expectedHeaders={['phone']}
          />
        </div>
      </div>

      {csvData && (
        <>
          <div style={styles.section}>
            <div style={styles.card}>
              <div style={styles.sectionTitle}>2. 导入配置</div>
              
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  style={{marginRight: '8px'}}
                  disabled={isProcessing}
                />
                跳过重复号码
              </label>

              <label style={styles.label}>默认标签（逗号分隔）</label>
              <input
                type="text"
                style={styles.input}
                value={defaultTags}
                onChange={(e) => setDefaultTags(e.target.value)}
                placeholder="例如: 客户,重要"
                disabled={isProcessing}
              />

              <label style={styles.label}>来源标记</label>
              <input
                type="text"
                style={styles.input}
                value={importSource}
                onChange={(e) => setImportSource(e.target.value)}
                placeholder="例如: 展会,网站"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div style={{display: 'flex', gap: '12px'}}>
            <button
              style={styles.buttonPrimary}
              onClick={handleBatchImport}
              disabled={isProcessing}
              onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover)}
              onMouseLeave={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = WhatsAppColors.accent)}
            >
              {isProcessing ? '导入中...' : `开始导入 (${csvData.rows.length} 个联系人)`}
            </button>
            
            {isProcessing && currentBatchId && (
              <button
                style={styles.buttonSecondary}
                onClick={handleCancelBatch}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WhatsAppColors.error}
              >
                ⏹️ 停止导入
              </button>
            )}
          </div>

          {batchStatus && (
            <div style={{marginTop: '24px'}}>
              <BatchProgress
                batchId={batchStatus.id}
                status={batchStatus.status}
                progress={batchStatus.progress || 0}
                totalCount={batchStatus.totalCount || 0}
                processedCount={batchStatus.processedCount || 0}
                successCount={batchStatus.successCount || 0}
                failedCount={batchStatus.failedCount || 0}
                onCancel={isProcessing ? handleCancelBatch : undefined}
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  // 渲染标签管理标签页
  const renderTagsTab = () => (
    <div>
      <div style={styles.infoBox}>
        💡 <strong>提示：</strong>批量为联系人添加、移除或替换标签
      </div>

      <div style={styles.section}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>1. 选择联系人</div>
          <ContactSelector
            selectedContacts={tagSelectedContacts}
            onSelectionChange={setTagSelectedContacts}
            multiple={true}
          />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>2. 标签操作</div>
          
          <label style={styles.label}>操作类型</label>
          <select
            style={styles.select}
            value={tagOperation}
            onChange={(e) => setTagOperation(e.target.value as any)}
            disabled={isProcessing}
          >
            <option value="add">添加标签</option>
            <option value="remove">移除标签</option>
            <option value="replace">替换标签</option>
          </select>

          <label style={styles.label}>标签（逗号分隔）</label>
          <input
            type="text"
            style={styles.input}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="例如: VIP,重点客户"
            disabled={isProcessing}
          />
        </div>
      </div>

      <div style={{display: 'flex', gap: '12px'}}>
        <button
          style={styles.buttonPrimary}
          onClick={handleBatchTags}
          disabled={isProcessing}
          onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover)}
          onMouseLeave={(e) => !isProcessing && (e.currentTarget.style.backgroundColor = WhatsAppColors.accent)}
        >
          {isProcessing ? '处理中...' : `执行操作 (${tagSelectedContacts.length} 个联系人)`}
        </button>
        
        {isProcessing && currentBatchId && (
          <button
            style={styles.buttonSecondary}
            onClick={handleCancelBatch}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WhatsAppColors.error}
          >
            ⏹️ 停止操作
          </button>
        )}
      </div>

      {batchStatus && (
        <div style={{marginTop: '24px'}}>
          <BatchProgress
            batchId={batchStatus.id}
            status={batchStatus.status}
            progress={batchStatus.progress || 0}
            totalCount={batchStatus.totalCount || 0}
            processedCount={batchStatus.processedCount || 0}
            successCount={batchStatus.successCount || 0}
            failedCount={batchStatus.failedCount || 0}
            onCancel={isProcessing ? handleCancelBatch : undefined}
          />
        </div>
      )}
    </div>
  );

  // 渲染批量删除标签页
  const renderDeleteTab = () => (
    <div>
      <div style={styles.infoBox}>
        ⚠️ <strong>警告：</strong>批量删除联系人操作不可恢复，请谨慎操作！
      </div>

      <div style={styles.section}>
        <div style={styles.card}>
          <div style={styles.sectionTitle}>选择要删除的联系人</div>
          <ContactSelector
            selectedContacts={deleteSelectedContacts}
            onSelectionChange={setDeleteSelectedContacts}
            multiple={true}
          />
        </div>
      </div>

      <div style={{display: 'flex', gap: '12px'}}>
        <button
          style={{...styles.buttonPrimary, backgroundColor: WhatsAppColors.error}}
          onClick={handleBatchDelete}
          disabled={isProcessing}
          onMouseEnter={(e) => !isProcessing && (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => !isProcessing && (e.currentTarget.style.opacity = '1')}
        >
          {isProcessing ? '删除中...' : `删除选中联系人 (${deleteSelectedContacts.length})`}
        </button>
        
        {isProcessing && currentBatchId && (
          <button
            style={styles.buttonSecondary}
            onClick={handleCancelBatch}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WhatsAppColors.error}
          >
            ⏹️ 停止删除
          </button>
        )}
      </div>

      {batchStatus && (
        <div style={{marginTop: '24px'}}>
          <BatchProgress
            batchId={batchStatus.id}
            status={batchStatus.status}
            progress={batchStatus.progress || 0}
            totalCount={batchStatus.totalCount || 0}
            processedCount={batchStatus.processedCount || 0}
            successCount={batchStatus.successCount || 0}
            failedCount={batchStatus.failedCount || 0}
            onCancel={isProcessing ? handleCancelBatch : undefined}
          />
        </div>
      )}
    </div>
  );

  // 渲染操作历史标签页
  const renderHistoryTab = () => {
    // 筛选定时任务
    const scheduledTasks = historyList.filter(item => 
      item.status === 'PENDING' && item.config?.scheduleAt
    );
    
    // 显示列表
    const displayList = historyFilter.status === 'SCHEDULED' 
      ? scheduledTasks 
      : historyList;

    return (
    <div>
      <div style={{marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' as const}}>
        <select
          style={{...styles.select, width: 'auto', marginBottom: 0}}
          value={historyFilter.type || ''}
          onChange={(e) => setHistoryFilter({...historyFilter, type: e.target.value || undefined})}
        >
          <option value="">全部类型</option>
          <option value="SEND">批量发送</option>
          <option value="IMPORT">批量导入</option>
          <option value="TAG">标签管理</option>
          <option value="DELETE">批量删除</option>
        </select>

        <select
          style={{...styles.select, width: 'auto', marginBottom: 0}}
          value={historyFilter.status || ''}
          onChange={(e) => setHistoryFilter({...historyFilter, status: e.target.value || undefined})}
        >
          <option value="">全部状态</option>
          <option value="SCHEDULED">⏰ 定时任务</option>
          <option value="PENDING">等待中</option>
          <option value="PROCESSING">处理中</option>
          <option value="COMPLETED">已完成</option>
          <option value="FAILED">失败</option>
          <option value="CANCELLED">已取消</option>
        </select>

        {scheduledTasks.length > 0 && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(243, 156, 18, 0.15)',
            color: '#f39c12',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600' as const,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            ⏰ {scheduledTasks.length} 个定时任务待执行
          </div>
        )}
      </div>

      {displayList.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: WhatsAppColors.textSecondary,
        }}>
          <div style={{fontSize: '48px', marginBottom: '16px'}}>
            {historyFilter.status === 'SCHEDULED' ? '⏰' : '📋'}
          </div>
          <div>
            {historyFilter.status === 'SCHEDULED' ? '暂无定时任务' : '暂无批量操作历史'}
          </div>
        </div>
      ) : (
        displayList.map((item) => {
          const isScheduled = item.status === 'PENDING' && item.config?.scheduleAt;
          const scheduleTime = isScheduled ? new Date(item.config.scheduleAt) : null;
          
          return (
          <div
            key={item.id}
            style={styles.historyItem}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = WhatsAppColors.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = WhatsAppColors.panelBackground}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span style={{fontSize: '24px'}}>{getTypeIcon(item.type)}</span>
                <div>
                  <div style={{fontSize: '15px', fontWeight: '600', color: WhatsAppColors.textPrimary, marginBottom: '4px'}}>
                    {isScheduled && '⏰ '}
                    {item.title || `批量操作 #${item.id.substring(0, 8)}`}
                  </div>
                  <div style={{fontSize: '13px', color: WhatsAppColors.textSecondary}}>
                    创建: {new Date(item.createdAt).toLocaleString('zh-CN')}
                  </div>
                  {isScheduled && scheduleTime && (
                    <div style={{fontSize: '13px', color: '#f39c12', marginTop: '4px'}}>
                      计划执行: {scheduleTime.toLocaleString('zh-CN')}
                      {scheduleTime > new Date() && 
                        ` (${Math.ceil((scheduleTime.getTime() - new Date().getTime()) / 60000)} 分钟后)`
                      }
                    </div>
                  )}
                </div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: '8px'}}>
                {getStatusBadge(item.status)}
                {isScheduled && item.status === 'PENDING' && (
                  <button
                    style={{
                      padding: '4px 12px',
                      backgroundColor: WhatsAppColors.error,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (confirm('确定要取消这个定时任务吗？')) {
                        try {
                          await api.batch.cancel(item.id);
                          loadHistory();
                          alert('定时任务已取消');
                        } catch (error) {
                          alert('取消失败：' + (error instanceof Error ? error.message : '未知错误'));
                        }
                      }
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    取消任务
                  </button>
                )}
              </div>
            </div>

            <div style={{display: 'flex', gap: '24px', fontSize: '13px', color: WhatsAppColors.textSecondary}}>
              <span>总数: <strong style={{color: WhatsAppColors.textPrimary}}>{item.totalCount}</strong></span>
              <span>成功: <strong style={{color: WhatsAppColors.accent}}>{item.successCount}</strong></span>
              <span>失败: <strong style={{color: WhatsAppColors.error}}>{item.failedCount}</strong></span>
              <span>进度: <strong style={{color: WhatsAppColors.textPrimary}}>{item.progress || 0}%</strong></span>
            </div>
          </div>
        );
        })
      )}
    </div>
    );
  };

  // 渲染统计仪表板标签页
  const renderStatsTab = () => (
    <div>
      {!stats ? (
        <div style={{padding: '40px', textAlign: 'center', color: WhatsAppColors.textSecondary}}>
          加载中...
        </div>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>总操作次数</div>
              <div style={styles.statValue}>{stats.total || 0}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>总处理数量</div>
              <div style={styles.statValue}>{stats.totalProcessed || 0}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>成功率</div>
              <div style={{...styles.statValue, color: WhatsAppColors.accent}}>
                {stats.successRate || 0}%
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>失败数量</div>
              <div style={{...styles.statValue, color: WhatsAppColors.error}}>
                {stats.totalFailed || 0}
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.card}>
              <div style={styles.sectionTitle}>按类型统计</div>
              {stats.byType && Object.entries(stats.byType).map(([type, count]: [string, any]) => (
                <div key={type} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: `1px solid ${WhatsAppColors.border}`,
                }}>
                  <span style={{color: WhatsAppColors.textPrimary}}>
                    {getTypeIcon(type)} {type}
                  </span>
                  <span style={{fontWeight: '600', color: WhatsAppColors.textPrimary}}>
                    {count} 次
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.card}>
              <div style={styles.sectionTitle}>按状态统计</div>
              {stats.byStatus && Object.entries(stats.byStatus).map(([status, count]: [string, any]) => (
                <div key={status} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: `1px solid ${WhatsAppColors.border}`,
                }}>
                  <span>{getStatusBadge(status)}</span>
                  <span style={{fontWeight: '600', color: WhatsAppColors.textPrimary}}>
                    {count} 次
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const mainContent = (
    <div style={styles.fullPanel}>
      <div style={styles.header}>
        <div style={styles.title}>批量操作</div>
        <div style={styles.subtitle}>批量发送消息、导入联系人、标签管理等操作</div>
      </div>

      <div style={styles.tabs}>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === 'send' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('send')}
        >
          📤 批量发送
        </div>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === 'import' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('import')}
        >
          📥 批量导入
        </div>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === 'tags' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('tags')}
        >
          🏷️ 标签管理
        </div>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === 'delete' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('delete')}
        >
          🗑️ 批量删除
        </div>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === 'history' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('history')}
        >
          📋 操作历史
        </div>
        <div
          style={{
            ...styles.tab,
            ...(activeTab === 'stats' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('stats')}
        >
          📊 统计仪表板
        </div>
      </div>

      <div style={styles.body}>
        {activeTab === 'send' && renderSendTab()}
        {activeTab === 'import' && renderImportTab()}
        {activeTab === 'tags' && renderTagsTab()}
        {activeTab === 'delete' && renderDeleteTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'stats' && renderStatsTab()}
      </div>
    </div>
  );

  return (
    <WhatsAppLayout
      sidebar={<Sidebar />}
      mainContent={mainContent}
      hideListPanel={true}
    />
  );
}
