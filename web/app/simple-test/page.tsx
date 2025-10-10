'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/lib/useWebSocket';

export default function SimpleTestPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState('未连接');

  useWebSocket({
    onConnect: () => {
      console.log('✅ 测试页面：WebSocket 已连接');
      setStatus('已连接');
      setMessages(prev => [...prev, { type: 'info', text: '✅ WebSocket 已连接', time: new Date().toLocaleTimeString() }]);
    },
    onDisconnect: () => {
      console.log('❌ 测试页面：WebSocket 已断开');
      setStatus('已断开');
      setMessages(prev => [...prev, { type: 'error', text: '❌ WebSocket 已断开', time: new Date().toLocaleTimeString() }]);
    },
    onNewMessage: (message) => {
      console.log('📨 测试页面：收到新消息', message);
      setMessages(prev => [...prev, { 
        type: 'message', 
        data: message, 
        time: new Date().toLocaleTimeString() 
      }]);
    },
    onStatusUpdate: (status) => {
      console.log('📊 测试页面：状态更新', status);
      setMessages(prev => [...prev, { 
        type: 'status', 
        data: status, 
        time: new Date().toLocaleTimeString() 
      }]);
    },
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>🧪 WebSocket 实时更新测试</h1>
      
      <div style={{ 
        padding: '15px', 
        margin: '20px 0',
        backgroundColor: status === '已连接' ? '#d4edda' : '#f8d7da',
        border: `1px solid ${status === '已连接' ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '5px',
        color: status === '已连接' ? '#155724' : '#721c24'
      }}>
        <strong>连接状态：</strong> {status}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>📋 实时消息日志：</h2>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          {messages.length === 0 ? (
            <p style={{ color: '#6c757d' }}>等待消息...</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} style={{ 
                marginBottom: '15px', 
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '5px',
                borderLeft: `4px solid ${
                  msg.type === 'message' ? '#28a745' : 
                  msg.type === 'error' ? '#dc3545' : '#17a2b8'
                }`
              }}>
                <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>
                  {msg.time}
                </div>
                {msg.type === 'info' || msg.type === 'error' ? (
                  <div style={{ fontSize: '14px' }}>{msg.text}</div>
                ) : (
                  <pre style={{ 
                    margin: 0, 
                    fontSize: '12px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {JSON.stringify(msg.data, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ 
        padding: '15px', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeeba',
        borderRadius: '5px',
        color: '#856404'
      }}>
        <h3>🔧 测试步骤：</h3>
        <ol style={{ marginBottom: 0 }}>
          <li>打开这个页面，确认状态为"已连接"</li>
          <li>从手机发送一条 WhatsApp 消息</li>
          <li>查看上面是否出现新消息</li>
          <li>如果出现，说明 WebSocket 工作正常！</li>
        </ol>
      </div>
    </div>
  );
}

