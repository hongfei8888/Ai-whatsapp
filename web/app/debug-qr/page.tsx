'use client';

import { useState } from 'react';

export default function DebugQRPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    console.log(info);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const handleClick = () => {
    addDebugInfo('点击了测试按钮');
    setShowDialog(true);
    addDebugInfo('设置了showDialog为true');
  };

  const handleClose = () => {
    addDebugInfo('关闭对话框');
    setShowDialog(false);
  };

  const handleSuccess = () => {
    addDebugInfo('登录成功回调');
  };

  // 简单的对话框组件
  const SimpleDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }} onClick={onClose}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '90%'
        }} onClick={(e) => e.stopPropagation()}>
          <h2>测试对话框</h2>
          <p>如果你看到这个对话框，说明基本的对话框功能是正常的。</p>
          <button onClick={onClose}>关闭</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>二维码对话框调试页面</h1>
      
      <button 
        onClick={handleClick}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        测试简单对话框
      </button>

      <div style={{ 
        marginTop: '20px', 
        textAlign: 'left',
        backgroundColor: '#f5f5f5',
        padding: '10px',
        borderRadius: '4px',
        maxHeight: '200px',
        overflow: 'auto'
      }}>
        <h3>调试信息：</h3>
        {debugInfo.map((info, index) => (
          <div key={index} style={{ fontSize: '12px', marginBottom: '4px' }}>
            {info}
          </div>
        ))}
      </div>

      <SimpleDialog isOpen={showDialog} onClose={handleClose} />
    </div>
  );
}
