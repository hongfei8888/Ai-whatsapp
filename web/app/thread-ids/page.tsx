'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ThreadIds() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        const data = await api.getThreads();
        setThreads(data.threads || []);
        console.log('获取到的线程数据:', data.threads);
      } catch (error) {
        console.error('获取线程失败:', error);
        setError(error instanceof Error ? error.message : '获取线程失败');
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板: ' + text);
    }).catch(() => {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('已复制到剪贴板: ' + text);
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>加载中...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>错误: {error}</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>线程ID查看器</h1>
      <p>这里显示所有可用的线程ID，你可以复制任意一个用于测试</p>
      
      {threads.length === 0 ? (
        <div style={{ color: '#666' }}>
          <p>暂无线程数据</p>
          <p>请确保后端服务正在运行，并且有对话数据</p>
        </div>
      ) : (
        <div>
          <h3>找到 {threads.length} 个线程:</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '16px',
            marginTop: '20px'
          }}>
            {threads.map((thread, index) => (
              <div 
                key={thread.id}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#F9FAFB'
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#111827' }}>
                    {thread.contact?.name || '未知联系人'}
                  </h4>
                  <p style={{ margin: '0 0 8px 0', color: '#6B7280', fontSize: '14px' }}>
                    📱 {thread.contact?.phoneE164 || '未知号码'}
                  </p>
                  <p style={{ margin: '0 0 8px 0', color: '#6B7280', fontSize: '14px' }}>
                    💬 {thread.messagesCount || 0} 条消息
                  </p>
                  <p style={{ margin: '0 0 12px 0', color: '#6B7280', fontSize: '14px' }}>
                    🤖 AI状态: {thread.aiEnabled ? '✅ 开启' : '❌ 关闭'}
                  </p>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#374151', fontWeight: 'bold' }}>
                    线程ID:
                  </label>
                  <div style={{
                    backgroundColor: '#F3F4F6',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    marginTop: '4px'
                  }}>
                    {thread.id}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => copyToClipboard(thread.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#4F46E5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    📋 复制ID
                  </button>
                  
                  <button
                    onClick={() => window.open(`/debug-messages`, '_blank')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    🔧 测试
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '16px', 
            backgroundColor: '#EEF2FF', 
            borderRadius: '8px',
            border: '1px solid #C7D2FE'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#3730A3' }}>使用说明:</h4>
            <ol style={{ margin: '0', paddingLeft: '20px', color: '#4338CA' }}>
              <li>选择一个AI开启的线程（推荐）</li>
              <li>点击"📋 复制ID"按钮复制线程ID</li>
              <li>点击"🔧 测试"按钮打开调试页面</li>
              <li>在调试页面粘贴线程ID并测试AI回复</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
