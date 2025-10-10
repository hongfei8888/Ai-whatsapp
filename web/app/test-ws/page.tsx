'use client';

import { useState, useEffect } from 'react';

export default function TestWebSocketPage() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [messages, setMessages] = useState<any[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = 'ws://localhost:4000/ws';
    console.log('连接到 WebSocket:', wsUrl);
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('✅ WebSocket 连接成功');
      setStatus('connected');
      setMessages(prev => [...prev, { type: 'system', text: '✅ WebSocket 连接成功', time: new Date().toLocaleTimeString() }]);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('收到消息:', message);
        setMessages(prev => [...prev, { 
          type: 'message', 
          data: message, 
          time: new Date().toLocaleTimeString() 
        }]);
      } catch (error) {
        console.error('解析消息失败:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('❌ WebSocket 错误:', error);
      setStatus('disconnected');
      setMessages(prev => [...prev, { type: 'error', text: '❌ WebSocket 连接错误', time: new Date().toLocaleTimeString() }]);
    };

    websocket.onclose = () => {
      console.log('🔌 WebSocket 连接关闭');
      setStatus('disconnected');
      setMessages(prev => [...prev, { type: 'system', text: '🔌 WebSocket 连接关闭', time: new Date().toLocaleTimeString() }]);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>WebSocket 连接测试</h1>
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <strong>连接状态: </strong>
        <span style={{ 
          color: status === 'connected' ? 'green' : status === 'connecting' ? 'orange' : 'red',
          fontWeight: 'bold' 
        }}>
          {status === 'connected' ? '✅ 已连接' : status === 'connecting' ? '⏳ 连接中' : '❌ 未连接'}
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping', data: 'test' }));
              setMessages(prev => [...prev, { type: 'sent', text: '发送测试消息', time: new Date().toLocaleTimeString() }]);
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#00a884',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          发送测试消息
        </button>
      </div>

      <div>
        <h2>消息日志：</h2>
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto', 
          backgroundColor: '#1e1e1e', 
          color: '#d4d4d4',
          padding: '15px',
          borderRadius: '5px'
        }}>
          {messages.length === 0 ? (
            <p style={{ color: '#888' }}>暂无消息...</p>
          ) : (
            messages.map((msg, index) => (
              <div key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                <div style={{ color: '#888', fontSize: '12px' }}>[{msg.time}]</div>
                {msg.type === 'message' ? (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#4ec9b0' }}>
                    {JSON.stringify(msg.data, null, 2)}
                  </pre>
                ) : (
                  <div style={{ 
                    color: msg.type === 'error' ? '#f48771' : msg.type === 'sent' ? '#4fc1ff' : '#ce9178' 
                  }}>
                    {msg.text}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <h3>使用说明：</h3>
        <ol>
          <li>如果连接成功，状态会显示"✅ 已连接"</li>
          <li>点击"发送测试消息"按钮测试发送功能</li>
          <li>所有收到的 WebSocket 消息会显示在日志中</li>
          <li>如果看到"connected"消息，说明 WebSocket 服务正常</li>
        </ol>
      </div>
    </div>
  );
}

