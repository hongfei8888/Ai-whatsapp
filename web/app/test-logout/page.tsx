'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function TestLogoutPage() {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStatus = async () => {
    try {
      const result = await api.getStatus();
      setStatus(result);
    } catch (error) {
      console.error('Failed to load status:', error);
      toast.error('加载状态失败');
    }
  };

  const testLogout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      toast.success('退出成功');
      await loadStatus(); // 重新加载状态
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('退出失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      color: 'white'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '30px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          🧪 退出功能测试
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={loadStatus}
            style={{
              padding: '10px 20px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            📊 加载状态
          </button>
          
          <button
            onClick={testLogout}
            disabled={isLoading}
            style={{
              padding: '10px 20px',
              backgroundColor: isLoading ? '#6b7280' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '🔄 退出中...' : '🚪 测试退出'}
          </button>
        </div>

        {status && (
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            padding: '20px',
            borderRadius: '10px',
            marginTop: '20px'
          }}>
            <h3>📋 当前状态：</h3>
            <pre style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '15px',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '14px'
            }}>
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
