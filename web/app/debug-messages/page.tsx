'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function DebugMessages() {
  const [threadId, setThreadId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string>('');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleGetMessages = async () => {
    if (!threadId.trim()) {
      alert('请输入线程ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 正在获取消息，线程ID:', threadId);
      
      // 添加时间戳参数强制刷新
      const timestamp = Date.now();
      const result = await api.getThreadMessages(threadId, 1000);
      console.log('📊 API返回结果:', result);
      console.log('📊 API返回的消息数组:', result.messages);
      console.log('📊 消息数组长度:', result.messages?.length || 0);
      
      const newMessages = result.messages || [];
      console.log('🔄 准备设置消息状态，新消息数量:', newMessages.length);
      console.log('🔄 当前消息状态数量:', messages.length);
      
      // 检查最新消息的时间
      if (newMessages.length > 0) {
        const latestMessage = newMessages[newMessages.length - 1];
        const latestTime = new Date(latestMessage.createdAt);
        const now = new Date();
        const timeDiff = now.getTime() - latestTime.getTime();
        console.log('⏰ 最新消息时间:', latestTime.toLocaleString());
        console.log('⏰ 当前时间:', now.toLocaleString());
        console.log('⏰ 时间差:', Math.round(timeDiff / 1000 / 60), '分钟前');
      }
      
      setMessages(newMessages);
      
      // 验证状态是否真的更新了
      setTimeout(() => {
        console.log('✅ 状态更新后的消息数量:', messages.length);
        
        // 自动滚动到最新消息
        const container = document.getElementById('message-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
          console.log('📜 已自动滚动到最新消息');
        }
      }, 100);
      
      console.log('✅ 消息列表已更新');
      
    } catch (error) {
      console.error('❌ 获取消息失败:', error);
      setError(error instanceof Error ? error.message : '获取消息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!threadId.trim()) {
      alert('请输入线程ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const messageContent = `测试消息 - ${new Date().toLocaleTimeString()}`;
      console.log('📤 正在发送测试消息:', messageContent);
      console.log('🔍 线程ID:', threadId);
      
      // 首先获取线程信息，获取联系人ID
      console.log('🔍 正在获取线程信息...');
              const threadData = await api.getThreadMessages(threadId, 1000);
      console.log('📊 线程数据:', threadData);
      
      // 从线程数据中获取联系人ID
      const contactId = threadData.contact?.id;
      if (!contactId) {
        throw new Error('无法获取联系人ID，请检查线程ID是否正确');
      }
      
      console.log('👤 联系人ID:', contactId);
      console.log('📤 正在发送消息到联系人:', contactId);
      
      await api.sendOutreach(contactId, { content: messageContent });
      console.log('✅ 消息发送成功');
      
      // 立即获取一次消息
      setTimeout(async () => {
        try {
          console.log('🔍 1秒后获取消息...');
          const result = await api.getThreadMessages(threadId, 1000);
          console.log('📊 1秒后API返回:', result);
          console.log('📊 1秒后消息数量:', result.messages?.length || 0);
          console.log('📊 1秒后消息内容:', result.messages);
          
          const newMessages = result.messages || [];
          console.log('🔄 1秒后准备更新状态，新消息数量:', newMessages.length);
          console.log('🔄 1秒后当前状态数量:', messages.length);
          
          setMessages(newMessages);
          console.log('✅ 1秒后状态已更新');
        } catch (error) {
          console.error('❌ 1秒后获取消息失败:', error);
        }
      }, 1000);
      
      // 等待3秒后再次获取消息（等待AI回复）
      setTimeout(async () => {
        try {
          console.log('🔍 3秒后获取消息（等待AI回复）...');
          const result = await api.getThreadMessages(threadId, 1000);
          console.log('📊 3秒后消息数量:', result.messages?.length || 0);
          setMessages(result.messages || []);
          console.log('📝 3秒后消息列表:', result.messages);
        } catch (error) {
          console.error('❌ 3秒后获取消息失败:', error);
        }
      }, 3000);
      
      // 等待6秒后再次获取消息
      setTimeout(async () => {
        try {
          console.log('🔍 6秒后获取消息...');
          const result = await api.getThreadMessages(threadId, 1000);
          console.log('📊 6秒后消息数量:', result.messages?.length || 0);
          setMessages(result.messages || []);
          console.log('📝 6秒后消息列表:', result.messages);
        } catch (error) {
          console.error('❌ 6秒后获取消息失败:', error);
        } finally {
          setLoading(false);
        }
      }, 6000);
      
    } catch (error) {
      console.error('❌ 发送消息失败:', error);
      setError(error instanceof Error ? error.message : '发送消息失败');
      setLoading(false);
    }
  };

  const handleStartPolling = () => {
    if (!threadId.trim()) {
      alert('请输入线程ID');
      return;
    }

    console.log('🔄 开始轮询检查消息，线程ID:', threadId);
    setPollingStatus('🔄 轮询已启动，每2秒检查一次...');
    
    const interval = setInterval(async () => {
      try {
        console.log('🔍 轮询检查消息...');
        setPollingStatus('🔍 正在检查新消息...');
        
        const result = await api.getThreadMessages(threadId, 1000);
        const newMessages = result.messages || [];
        console.log('📊 轮询消息数量:', newMessages.length);
        
        setMessages(prevMessages => {
          const prevLength = prevMessages.length;
          const newLength = newMessages.length;
          
          // 检查消息数量变化
          if (newLength > prevLength) {
            console.log('✅ 检测到新消息，从', prevLength, '条增加到', newLength, '条');
            setPollingStatus(`✅ 检测到新消息！从 ${prevLength} 条增加到 ${newLength} 条`);
            return newMessages;
          } 
          // 检查消息内容变化（即使数量相同）
          else if (newLength === prevLength && newLength > 0) {
            // 比较最后一条消息的时间戳
            const lastPrevMessage = prevMessages[prevLength - 1];
            const lastNewMessage = newMessages[newLength - 1];
            
            if (lastPrevMessage && lastNewMessage && 
                lastPrevMessage.id !== lastNewMessage.id) {
              console.log('✅ 检测到消息内容更新！');
              setPollingStatus(`✅ 检测到消息内容更新！(当前 ${newLength} 条)`);
              return newMessages;
            }
          }
          
          console.log('⏸️ 无新消息');
          setPollingStatus(`⏸️ 无新消息 (当前 ${newLength} 条)`);
          return prevMessages;
        });
      } catch (error) {
        console.error('❌ 轮询失败:', error);
        setPollingStatus('❌ 轮询失败: ' + (error as Error).message);
      }
    }, 10000);

    // 10秒后停止轮询
    setTimeout(() => {
      clearInterval(interval);
      console.log('⏹️ 轮询已停止');
      setPollingStatus('⏹️ 轮询已停止');
    }, 10000);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>消息调试页面</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          线程ID: 
          <input 
            type="text" 
            value={threadId} 
            onChange={(e) => setThreadId(e.target.value)}
            placeholder="输入线程ID"
            style={{ marginLeft: '10px', padding: '5px', width: '1000px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleGetMessages}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '加载中...' : '获取消息'}
        </button>
        
        <button 
          onClick={handleSendTestMessage}
          disabled={loading}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? '发送中...' : '发送测试消息'}
        </button>
        
        <button 
          onClick={handleStartPolling}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#F59E0B',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔄 开始轮询 (10秒)
        </button>
        
        <button 
          onClick={handleGetMessages}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔄 强制刷新消息 (绕过缓存)
        </button>
        
        <button 
          onClick={() => {
            console.log('🧪 测试按钮点击');
            console.log('🧪 当前消息状态:', messages);
            console.log('🧪 当前消息数量:', messages.length);
            setMessages([...messages, {
              id: `test_${Date.now()}`,
              text: `测试消息 ${new Date().toLocaleTimeString()}`,
              direction: 'OUT',
              status: 'SENT',
              createdAt: new Date().toISOString()
            }]);
            console.log('🧪 测试消息已添加');
          }}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🧪 测试状态更新
        </button>
        
        <button 
          onClick={async () => {
            console.log('🔍 测试API调用...');
            try {
              // 强制刷新，绕过所有缓存
              const timestamp = Date.now();
              console.log('🔄 强制刷新时间戳:', timestamp);
              
              // 直接调用API，不使用缓存，无上限获取所有消息
              const result = await api.getThreadMessages('cmg6av6x5000wws1cml2eunhv', 1000);
              console.log('✅ API调用成功！');
              console.log('📊 API返回数据:', result);
              console.log('📊 消息数组:', result.messages);
              console.log('📊 消息数量:', result.messages?.length || 0);
              
              // 检查最新消息的时间
              if (result.messages && result.messages.length > 0) {
                const latestMessage = result.messages[result.messages.length - 1];
                const latestTime = new Date(latestMessage.createdAt);
                const now = new Date();
                const timeDiff = now.getTime() - latestTime.getTime();
                console.log('⏰ 最新消息时间:', latestTime.toLocaleString());
                console.log('⏰ 当前时间:', now.toLocaleString());
                console.log('⏰ 时间差:', Math.round(timeDiff / 1000 / 60), '分钟前');
                
                // 详细分析每条消息
                console.log('🔍 详细分析消息:');
                result.messages.forEach((msg, index) => {
                  console.log(`消息 ${index + 1}:`, {
                    id: msg.id,
                    direction: msg.direction,
                    status: msg.status,
                    text: msg.text?.substring(0, 50) + '...',
                    createdAt: msg.createdAt
                  });
                });
                
                // 统计消息类型
                const outMessages = result.messages.filter(m => m.direction === 'OUT');
                const inMessages = result.messages.filter(m => m.direction === 'IN');
                console.log('📊 消息统计:', {
                  总数: result.messages.length,
                  发送: outMessages.length,
                  接收: inMessages.length
                });
                
                setMessages(result.messages);
                console.log('✅ 消息状态已更新');
                
                // 自动滚动到最新消息
                setTimeout(() => {
                  const container = document.getElementById('message-container');
                  if (container) {
                    container.scrollTop = container.scrollHeight;
                    console.log('📜 已自动滚动到最新消息');
                  }
                }, 100);
              }
            } catch (error) {
              console.error('❌ API调用失败:', error);
            }
          }}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔍 测试API调用
        </button>
        
        <button 
          onClick={() => {
            console.log('🔍 显示所有消息到控制台...');
            console.log('📊 当前消息数组:', messages);
            console.log('📊 消息数组长度:', messages.length);
            messages.forEach((msg, index) => {
              console.log(`消息 ${index + 1}:`, {
                id: msg.id,
                direction: msg.direction,
                status: msg.status,
                text: msg.text?.substring(0, 100),
                createdAt: msg.createdAt
              });
            });
          }}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#F59E0B',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          📋 显示所有消息
        </button>
        
        <button 
          onClick={() => {
            console.log('🔍 强制刷新消息状态...');
            console.log('📊 当前消息数量:', messages.length);
            console.log('📊 当前消息数组:', messages);
            
            // 强制重新设置消息状态
            const currentMessages = [...messages];
            setMessages([]);
            setTimeout(() => {
              setMessages(currentMessages);
              console.log('✅ 消息状态已强制刷新');
            }, 100);
          }}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#DC2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔄 强制刷新状态
        </button>
        
        <button 
          onClick={() => {
            const container = document.getElementById('message-container');
            if (container) {
              container.scrollTop = container.scrollHeight;
              console.log('📜 已滚动到最新消息');
            }
          }}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          📜 滚动到最新消息
        </button>
        
        <button 
          onClick={async () => {
            console.log('🔄 强制刷新最新数据...');
            try {
              // 清除当前消息状态
              setMessages([]);
              console.log('🗑️ 已清除当前消息状态');
              
              // 等待100ms后重新获取
              setTimeout(async () => {
                try {
                  const result = await api.getThreadMessages('cmg6av6x5000wws1cml2eunhv', 1000);
                  console.log('✅ 重新获取消息成功！');
                  console.log('📊 最新消息数量:', result.messages?.length || 0);
                  
                  if (result.messages && result.messages.length > 0) {
                    const latestMessage = result.messages[result.messages.length - 1];
                    const latestTime = new Date(latestMessage.createdAt);
                    const now = new Date();
                    const timeDiff = now.getTime() - latestTime.getTime();
                    console.log('⏰ 最新消息时间:', latestTime.toLocaleString());
                    console.log('⏰ 当前时间:', now.toLocaleString());
                    console.log('⏰ 时间差:', Math.round(timeDiff / 1000 / 60), '分钟前');
                  }
                  
                  setMessages(result.messages || []);
                  console.log('✅ 最新数据已更新');
                  
                  // 自动滚动到最新消息
                  setTimeout(() => {
                    const container = document.getElementById('message-container');
                    if (container) {
                      container.scrollTop = container.scrollHeight;
                      console.log('📜 已自动滚动到最新消息');
                    }
                  }, 100);
                  
                } catch (error) {
                  console.error('❌ 重新获取消息失败:', error);
                }
              }, 100);
              
            } catch (error) {
              console.error('❌ 强制刷新失败:', error);
            }
          }}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#7C3AED',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 强制刷新最新数据
        </button>
        
        <button 
          onClick={async () => {
            if (loadingMore || !hasMoreMessages) return;
            
            console.log('📥 加载更多消息...');
            setLoadingMore(true);
            try {
              const result = await api.getThreadMessages(threadId || 'cmg6av6x5000wws1cml2eunhv', 1000);
              const newMessages = result.messages || [];
              
              // 合并消息，去重
              setMessages(prevMessages => {
                const existingIds = new Set(prevMessages.map(m => m.id));
                const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));
                const combined = [...prevMessages, ...uniqueNewMessages];
                
                console.log('📊 加载更多结果:', {
                  原有消息: prevMessages.length,
                  新消息: uniqueNewMessages.length,
                  总消息: combined.length
                });
                
                // 如果新消息少于1000条，说明没有更多了
                if (uniqueNewMessages.length < 1000) {
                  setHasMoreMessages(false);
                  console.log('📄 已加载所有消息');
                }
                
                return combined;
              });
            } catch (error) {
              console.error('❌ 加载更多消息失败:', error);
            } finally {
              setLoadingMore(false);
            }
          }}
          disabled={loadingMore || !hasMoreMessages}
          style={{ 
            padding: '10px 20px',
            backgroundColor: loadingMore || !hasMoreMessages ? '#9CA3AF' : '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loadingMore || !hasMoreMessages ? 'not-allowed' : 'pointer',
            marginLeft: '10px'
          }}
        >
          {loadingMore ? '⏳ 加载中...' : hasMoreMessages ? '📥 加载更多消息' : '📄 已加载全部'}
        </button>
      </div>

      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#FEF2F2', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          错误: {error}
        </div>
      )}

      {pollingStatus && (
        <div style={{ 
          color: '#059669', 
          backgroundColor: '#ECFDF5', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #10B981'
        }}>
          轮询状态: {pollingStatus}
        </div>
      )}

      <div>
        <h3>消息列表 ({messages.length} 条)</h3>
        <div style={{ 
          marginBottom: '10px', 
          padding: '8px', 
          backgroundColor: '#F0F9FF', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          📊 消息统计: 
          总数 {messages.length} 条 | 
          发送 {messages.filter(m => m.direction === 'OUT').length} 条 | 
          接收 {messages.filter(m => m.direction === 'IN').length} 条
        </div>
        <div 
          id="message-container"
          style={{ 
            border: '1px solid #ccc', 
            padding: '10px', 
            maxHeight: '600px', 
            overflowY: 'auto',
            backgroundColor: '#F9FAFB'
          }}
        >
          {messages.length === 0 ? (
            <div style={{ color: '#666' }}>暂无消息</div>
          ) : (
            messages
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // 按时间排序
              .map((message, index) => (
              <div 
                key={message.id || index}
                style={{ 
                  marginBottom: '10px', 
                  padding: '8px',
                  backgroundColor: message.direction === 'OUT' ? '#E0F2FE' : '#F3F4F6',
                  borderRadius: '4px',
                  borderLeft: `4px solid ${message.direction === 'OUT' ? '#0EA5E9' : '#6B7280'}`
                }}
              >
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  #{index + 1} | ID: {message.id} | 方向: {message.direction} | 状态: {message.status} | 
                  时间: {new Date(message.createdAt).toLocaleString()}
                </div>
                <div style={{ fontSize: '14px' }}>
                  {message.text || '[无文本内容]'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <h4>调试说明:</h4>
        <ul>
          <li>1. 输入一个有效的线程ID（可以从 <a href="/thread-ids" target="_blank">线程ID查看器</a> 获取）</li>
          <li>2. 点击"获取消息"查看当前消息列表</li>
          <li>3. 点击"发送测试消息"发送一条新消息并自动刷新列表</li>
          <li>4. 点击"开始轮询"持续检查新消息（10秒）</li>
          <li>5. 观察消息列表是否实时更新</li>
          <li>6. 打开浏览器控制台查看详细的API调用日志</li>
        </ul>
        
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#FEF3C7', 
          borderRadius: '4px',
          border: '1px solid #F59E0B'
        }}>
          <strong>💡 提示：</strong>
          <br />• 系统会自动从线程ID获取对应的联系人ID
          <br />• 推荐使用AI开启的线程进行测试
          <br />• 如果遇到"Contact not found"错误，请检查线程ID是否正确
        </div>
      </div>
    </div>
  );
}
